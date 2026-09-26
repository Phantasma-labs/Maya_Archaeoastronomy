# Architecture & Calendar "Blueprint Tour" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selecting "Calendar & Architecture" switches Lesson 01 to a black-sky wireframe "blueprint" of El Castillo with a six-step guided camera tour and an on-screen panel explaining how the architecture relates to the Maya calendars.

**Architecture:** `sliderPosition` (the single runtime value, ADR-001) becomes the tour step for topics that own a `tour`. A pure `sampleTour()` derives the camera pose (azimuth/elevation/radius around a target, shortest-arc azimuth), so the existing eased sweep in `LessonPage` produces the orbit with no `useFrame`. `Lesson01Scene` dispatches on `topic.tour` to a new `BlueprintScene` (one shared wireframe material via a new `ModelLoader` `materialOverride`, black background, new core `CameraTour`). The overlay swaps the sky slider for a step navigator and shows the step's copy with an evidence badge.

**Tech Stack:** React 18, TypeScript (strict), three 0.174, @react-three/fiber 8, drei 9, Tailwind 3, lucide-react. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-26-architecture-blueprint-tour-design.md`

## Global Constraints

- `npm run typecheck` (tsc --noEmit, strict) must pass; **no `any`, no non-null assertions** in new code.
- **No new dependencies.** No `useFrame`; `frameloop="demand"` stays. Never put render-loop/GPU state in React state.
- Layering `pages → lessons → core`; `core/` must not import from `lessons/` or `pages/`. Nothing in core names Lesson 01.
- **Never special-case a lesson/topic in page or core code** — the scene dispatches on `topic.tour`, not on the id `'solar-calendar'`.
- Preserve the `ModelLoader` vertex-color guard (only enable `vertexColors` when a real `COLOR_0` attribute exists).
- `sliderPosition` in `LessonPage` remains the **only** runtime writer; camera pose, active text and stepper state are derived.
- Tour copy comes **only** from `LearningMaterial/lesson_01.md`; keep evidence vs interpretation distinct; the Calendar Round is when the Tzolk'in and Haab "once again produce the same combination of dates" (never an unqualified "realign").
- Palette tokens: gold `#d4af37`, `maya-goldLight` `#f3e5ab`, cream `#f5ecd7`, surface `#121622`, surfaceHover `#1b2133`, textDim `#a39e93`. Text floor 11 px; touch targets ≥ 24 px; honor `prefers-reduced-motion` (already handled inside `LessonPage.handleStepSelect`).
- Formatting: Prettier (`npx prettier --write <file>`) on every touched file under `src/` and `docs/`.
- **Git:** the repo is on `main` with two unrelated uncommitted edits (`src/pages/LandingPage.tsx`, `src/lessons/lesson01/SerpentSlider.tsx`). Never `git add -A`/`git add .`; stage the exact files named in each commit step. **Commit steps run only after the user has said commits are wanted** (repo rule: commit only when asked); if not confirmed, skip them and continue. Commit messages end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Validation is `typecheck` + `lint` (baseline: 0 errors, 3 pre-existing warnings in `ModelLoader.tsx` ~124 and `SceneEnvironment.tsx` ~90/202) + `build` + manual `dev` check. There is no test runner; the only automated check is the dev-only `scripts/check-tour.ts` (Task 1), run directly with Node 24.

## Review Focus

Failure modes the spec implies but the happy path won't exercise, most likely first:

1. **Deep link with a bad step** (`?topic=solar-calendar&step=99`, `step=0`, `step=abc`) → opens on a valid step (clamped to N / falls back to step 1), never a blank or crashed scene. _Pinned in Task 4 step 8._
2. **Azimuth wrap-around** — a step from 350° to 10° must swing 20°, not 340°. _Pinned by `scripts/check-tour.ts` in Task 1._
3. **Switching back to Serpent Descent** after the tour → photoreal sky, IBL and meshes are back (no black/invisible meshes, no stale wireframe material on cached GLTFs). _Pinned in Task 6 step 6._
4. **Fractional positions and tiny tours** — `sliderPosition` mid-sweep (e.g. 2.5, 5.999), a single-stop tour, and out-of-range/NaN positions all yield a valid pose. _Pinned by `scripts/check-tour.ts` in Task 1._
5. **Window resize mid-tour** → aspect updates without the pose snapping back to step 1. _Pinned in Task 6 step 7._

---

### Task 1: Tour types and `sampleTour` (TDD with a Node check script)

**Files:**

- Modify: `src/core/types/lesson.types.ts` (add types after `StepCallout`/before `SkyKeyframe`, and one field on `LearningTopic`)
- Create: `src/core/utils/tour.ts`
- Create: `scripts/check-tour.ts`
- Modify: `docs/superpowers/specs/2026-09-26-architecture-blueprint-tour-design.md` (record the two refinements)

**Interfaces:**

- Produces (`lesson.types.ts`):
  `TourCameraPose { azimuth: number; elevation: number; radius: number; target: [number, number, number] }`,
  `type TourEvidence = 'documented' | 'interpretation' | 'mixed'`,
  `TourStopInfo { headline: string; figure?: string; lines: string[]; status: TourEvidence }`,
  `TourStop { id: string; label: string; camera: TourCameraPose; info: TourStopInfo }`,
  `TourSample { eye: [number, number, number]; target: [number, number, number]; activeIndex: number }`,
  `LearningTopic.tour?: TourStop[]`.
- Produces (`tour.ts`): `sampleTour(stops: TourStop[], position: number): TourSample`.

- [ ] **Step 1: Create the working branch**

```bash
git switch -c feature/architecture-blueprint-tour
```

Expected: `Switched to a new branch 'feature/architecture-blueprint-tour'` (uncommitted edits carry over).

- [ ] **Step 2: Write the failing check script**

Create `scripts/check-tour.ts`:

```ts
// Dev-only sanity check for sampleTour — run with: node scripts/check-tour.ts
// (Node 24 executes .ts directly via type stripping; no test runner or new
// dependency is added — see the repo's "no test scripts" rule.)
import assert from 'node:assert/strict';
import { sampleTour } from '../src/core/utils/tour.ts';
import type { TourStop } from '../src/core/types/lesson.types.ts';

const stop = (
  id: string,
  azimuth: number,
  elevation = 0,
  radius = 10,
  target: [number, number, number] = [0, 0, 0]
): TourStop => ({
  id,
  label: id,
  camera: { azimuth, elevation, radius, target },
  info: { headline: id, lines: [], status: 'documented' }
});

const near = (actual: number, expected: number, label: string, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${label}: ${actual} !≈ ${expected}`);
const deg = (d: number) => (d * Math.PI) / 180;

// 1. Exact stops land exactly on their authored pose.
{
  const stops = [stop('a', 0), stop('b', Math.PI / 2)];
  const s1 = sampleTour(stops, 1);
  near(s1.eye[0], 0, 'stop1 x');
  near(s1.eye[1], 0, 'stop1 y');
  near(s1.eye[2], 10, 'stop1 z');
  const s2 = sampleTour(stops, 2);
  near(s2.eye[0], 10, 'stop2 x');
  near(s2.eye[2], 0, 'stop2 z');
}

// 2. Midpoint interpolates azimuth linearly.
{
  const s = sampleTour([stop('a', 0), stop('b', Math.PI / 2)], 1.5);
  near(s.eye[0], 10 * Math.sin(Math.PI / 4), 'mid x');
  near(s.eye[2], 10 * Math.cos(Math.PI / 4), 'mid z');
}

// 3. Wrap-around: 350° → 10° takes the 20° short arc, passing through 0°
//    (camera on +Z), never the 340° long way (camera on −Z).
{
  const s = sampleTour([stop('a', deg(350)), stop('b', deg(10))], 1.5);
  near(s.eye[0], 0, 'wrap x');
  assert.ok(s.eye[2] > 9.99, `wrap z should be ≈ +10, got ${s.eye[2]}`);
  // and the reverse direction
  const r = sampleTour([stop('a', deg(10)), stop('b', deg(350))], 1.5);
  near(r.eye[0], 0, 'wrap-rev x');
  assert.ok(r.eye[2] > 9.99, `wrap-rev z should be ≈ +10, got ${r.eye[2]}`);
}

// 4. Out-of-range / non-finite positions clamp; never NaN.
{
  const stops = [stop('a', 0), stop('b', Math.PI / 2), stop('c', Math.PI)];
  for (const p of [0, -5, Number.NaN, Number.NEGATIVE_INFINITY]) {
    const s = sampleTour(stops, p);
    near(s.eye[2], 10, `clamp-low(${p}) z`);
    assert.equal(s.activeIndex, 0);
  }
  for (const p of [3, 99]) {
    const s = sampleTour(stops, p);
    near(s.eye[2], -10, `clamp-high(${p}) z`);
    assert.equal(s.activeIndex, 2);
  }
}

// 5. activeIndex is the nearest stop (0-based).
{
  const stops = [stop('a', 0), stop('b', 1)];
  assert.equal(sampleTour(stops, 1.4).activeIndex, 0);
  assert.equal(sampleTour(stops, 1.6).activeIndex, 1);
}

// 6. A single-stop tour is valid at any position.
{
  const s = sampleTour([stop('only', 0)], 3);
  near(s.eye[2], 10, 'single z');
  assert.equal(s.activeIndex, 0);
}

// 7. Empty tour is an invalid config → throws.
assert.throws(() => sampleTour([], 1), /at least one/);

// 8. Target offset, elevation and radius/target interpolation.
{
  const up = sampleTour([stop('a', 0, Math.PI / 2, 10, [1, 2, 3])], 1);
  near(up.eye[0], 1, 'elev x');
  near(up.eye[1], 12, 'elev y');
  near(up.eye[2], 3, 'elev z');
  const mid = sampleTour([stop('a', 0, 0, 10, [0, 0, 0]), stop('b', 0, 0, 30, [10, 20, 0])], 1.5);
  near(mid.target[0], 5, 'mid target x');
  near(mid.target[1], 10, 'mid target y');
  near(mid.eye[2], 20, 'mid radius z'); // radius 20 along +Z from target z=0
}

console.log('sampleTour: all checks passed');
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node scripts/check-tour.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` (cannot find `src/core/utils/tour.ts`).

- [ ] **Step 4: Add the types**

In `src/core/types/lesson.types.ts`, insert immediately **before** the comment block that starts `/**\n * A single authored sky/light state on the Atmosphere Timeline (ADR-001).`:

```ts
/**
 * Camera pose of a tour stop, as an orbit around a target point. Azimuth is
 * measured in radians around +Y from +Z toward +X, so the camera sits at
 * target + r·(sin az·cos el, sin el, cos az·cos el). For Lesson 01 north is
 * −Z, so a north-face-on view has azimuth π. Interpolation between stops
 * takes the shortest azimuth arc (see `sampleTour`).
 */
export interface TourCameraPose {
  azimuth: number;
  /** Radians above the horizon (π/2 = straight down onto the target). */
  elevation: number;
  /** Metres from the target. */
  radius: number;
  target: [number, number, number];
}

/**
 * How firmly a tour statement is supported. `mixed` = the arithmetic/calendar
 * fact is established but its link to the architecture is an interpretation.
 */
export type TourEvidence = 'documented' | 'interpretation' | 'mixed';

/** On-screen content for a tour stop. */
export interface TourStopInfo {
  headline: string;
  /** Big number/figure shown above the headline ("9", "4 × 91", "365"). */
  figure?: string;
  lines: string[];
  status: TourEvidence;
}

/** One viewpoint + explanation in a topic's guided tour. */
export interface TourStop {
  id: string;
  /** Short name for the step navigator (dot tooltip / aria label). */
  label: string;
  camera: TourCameraPose;
  info: TourStopInfo;
}

/** Camera state derived from a continuous tour position (pure, never stored). */
export interface TourSample {
  /** Camera position in world space. */
  eye: [number, number, number];
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Nearest stop index (0-based) for the active text / navigator dot. */
  activeIndex: number;
}
```

Then in the `LearningTopic` interface, after the `skyTimeline?: SkyKeyframe[];` line, add:

```ts
  /**
   * Optional topic-owned guided tour. When present, the topic renders the
   * lesson's blueprint scene instead of the photoreal one, `sliderPosition`
   * means the tour step (1..N), and the overlay shows a step navigator with
   * each stop's `info`. Used by Calendar & Architecture.
   */
  tour?: TourStop[];
```

- [ ] **Step 5: Implement `sampleTour`**

Create `src/core/utils/tour.ts`:

```ts
// Type-only import (erased at runtime) so scripts/check-tour.ts can run this
// file directly under Node's type stripping.
import type { TourSample, TourStop } from '../types/lesson.types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TWO_PI = Math.PI * 2;

/** Signed angular difference from `from` to `to`, wrapped into (−π, π]. */
const shortestArc = (from: number, to: number): number => {
  const d = (to - from) % TWO_PI;
  if (d > Math.PI) return d - TWO_PI;
  if (d <= -Math.PI) return d + TWO_PI;
  return d;
};

/**
 * Sample a guided tour at a continuous position in [1, N] (ADR-001: pure
 * derivation of the single `sliderPosition`, never stored).
 *
 * Integer positions land exactly on a stop; in-between positions interpolate
 * stop A → B: azimuth along the SHORTEST arc (so a 350° → 10° step swings 20°,
 * not 340°), elevation / radius / target linearly. Out-of-range positions
 * clamp to the nearest stop; non-finite input falls back to step 1. Throws on
 * an empty tour — a tour topic without a stop is an invalid config.
 *
 * Because the eased step sweep in LessonPage already animates the position
 * between integers, the camera glides around the monument with no per-frame
 * loop (frameloop="demand" is untouched).
 */
export function sampleTour(stops: TourStop[], position: number): TourSample {
  const n = stops.length;
  if (n === 0) {
    throw new Error('sampleTour: a tour must contain at least one stop.');
  }

  const p = Number.isFinite(position) ? Math.min(Math.max(position, 1), n) : 1;

  let indexA = Math.floor(p) - 1;
  let t = p - Math.floor(p);
  if (indexA >= n - 1) {
    // On or above the final stop — pin to it (no outgoing blend).
    indexA = n - 1;
    t = 0;
  }
  const indexB = Math.min(indexA + 1, n - 1);

  const a = stops[indexA].camera;
  const b = stops[indexB].camera;

  const azimuth = a.azimuth + shortestArc(a.azimuth, b.azimuth) * t;
  const elevation = lerp(a.elevation, b.elevation, t);
  const radius = lerp(a.radius, b.radius, t);
  const target: [number, number, number] = [
    lerp(a.target[0], b.target[0], t),
    lerp(a.target[1], b.target[1], t),
    lerp(a.target[2], b.target[2], t)
  ];

  const cosEl = Math.cos(elevation);
  const eye: [number, number, number] = [
    target[0] + radius * Math.sin(azimuth) * cosEl,
    target[1] + radius * Math.sin(elevation),
    target[2] + radius * Math.cos(azimuth) * cosEl
  ];

  const activeIndex = Math.min(n - 1, Math.max(0, Math.round(p) - 1));

  return { eye, target, activeIndex };
}
```

- [ ] **Step 6: Run the check and typecheck**

Run: `node scripts/check-tour.ts`
Expected: prints `sampleTour: all checks passed` (a Node "type stripping" experimental warning is fine).

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 7: Record the spec refinements**

In `docs/superpowers/specs/2026-09-26-architecture-blueprint-tour-design.md`:

1. In §2.5, replace `export type TourEvidence = 'documented' | 'interpretation';` with `export type TourEvidence = 'documented' | 'interpretation' | 'mixed'; // mixed = math documented, architectural link interpreted`, and add `activeIndex`/`TourSample { eye, target, activeIndex }` to the listed types.
2. In §2.3, in the `Lesson01Scene.tsx` row, replace `` `topicId === 'solar-calendar'` `` with `` the active topic owning a `tour` `` (no topic-id special-casing).
3. In §3 table, set step 6's status cell to `mixed (documented math, interpreted link)`.

- [ ] **Step 8: Format and commit**

```bash
npx prettier --write src/core/types/lesson.types.ts src/core/utils/tour.ts docs/superpowers/specs/2026-09-26-architecture-blueprint-tour-design.md
git add src/core/types/lesson.types.ts src/core/utils/tour.ts scripts/check-tour.ts docs/superpowers/specs/2026-09-26-architecture-blueprint-tour-design.md
git commit -m "feat(core): add tour types and sampleTour with shortest-arc azimuth

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Core render primitives — `ModelLoader.materialOverride` and `CameraTour`

**Files:**

- Modify: `src/core/components/ModelLoader.tsx` (props, mesh branch, `useMemo` deps, doc comment)
- Create: `src/core/components/CameraTour.tsx`

**Interfaces:**

- Consumes: `TourSample`, `CameraConfig` from `core/types/lesson.types` (Task 1 / existing).
- Produces: `ModelLoader` prop `materialOverride?: THREE.Material`; `CameraTour` props `{ sample: TourSample; lens: Pick<CameraConfig, 'fov' | 'near' | 'far'> }`.

- [ ] **Step 1: Add the `materialOverride` prop to `ModelLoader`**

In `src/core/components/ModelLoader.tsx`:

Replace

```ts
interface ModelLoaderProps {
  asset: ModelAsset;
}
```

with

```ts
interface ModelLoaderProps {
  asset: ModelAsset;
  /**
   * When set, every mesh on this instance renders with this material instead
   * of the GLB's own (blueprint mode). The caller owns the material's
   * lifetime (create once, dispose on unmount).
   */
  materialOverride?: THREE.Material;
}
```

Replace `export const ModelLoader: React.FC<ModelLoaderProps> = ({ asset }) => {` with
`export const ModelLoader: React.FC<ModelLoaderProps> = ({ asset, materialOverride }) => {`.

Replace the line

```ts
if (asset.receiveShadow !== undefined) mesh.receiveShadow = asset.receiveShadow;
```

with

```ts
if (asset.receiveShadow !== undefined) mesh.receiveShadow = asset.receiveShadow;

// Blueprint mode: rebind this CLONE's material to the shared override.
// gltf.scene.clone(true) shares materials with the cached GLTF, but
// assigning `mesh.material` only swaps this clone's reference — the
// cached scene (and the photoreal view) is never mutated. The
// vertex-color guard below is for the glTF's own materials, so it is
// skipped for the override.
if (materialOverride) {
  mesh.material = materialOverride;
  return;
}
```

Replace `  }, [gltf.scene, asset.castShadow, asset.receiveShadow]);` with
`  }, [gltf.scene, asset.castShadow, asset.receiveShadow, materialOverride]);`.

Add one bullet to the component's doc comment, after `- Filters out camera nodes so they are not rendered as geometry`:

```
 * - Optional `materialOverride` re-skins the clone (blueprint mode) without
 *   touching the cached GLTF
```

- [ ] **Step 2: Create `CameraTour`**

Create `src/core/components/CameraTour.tsx`:

```tsx
import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraConfig, TourSample } from '../types/lesson.types';

interface CameraTourProps {
  /** Derived camera pose for the current tour position (see `sampleTour`). */
  sample: TourSample;
  /** Lens settings, shared across all stops. */
  lens: Pick<CameraConfig, 'fov' | 'near' | 'far'>;
}

/**
 * CameraTour — applies a derived tour pose to the R3F camera.
 *
 * The pose is a pure function of `sliderPosition` (ADR-001), so this
 * component holds no state and never runs per frame: a dependency-guarded
 * layout effect mutates the camera whenever the sample (or viewport) changes,
 * then invalidates because the canvas uses frameloop="demand". Sibling of
 * `FixedGlbCamera`, which locks a single authored pose instead.
 */
export const CameraTour: React.FC<CameraTourProps> = ({ sample, lens }) => {
  const { camera, size, invalidate } = useThree();

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;

    cam.position.set(...sample.eye);
    cam.fov = lens.fov;
    cam.near = lens.near;
    cam.far = lens.far;
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
    cam.lookAt(...sample.target);
    cam.updateMatrixWorld(true);
    invalidate();
  }, [camera, size.width, size.height, sample, lens.fov, lens.near, lens.far, invalidate]);

  return null;
};
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck`
Expected: exit 0.

Run: `npm run lint`
Expected: 0 errors; still only the 3 pre-existing warnings (the `ModelLoader.tsx` warning may shift by a few line numbers — that's fine).

- [ ] **Step 4: Format and commit**

```bash
npx prettier --write src/core/components/ModelLoader.tsx src/core/components/CameraTour.tsx
git add src/core/components/ModelLoader.tsx src/core/components/CameraTour.tsx
git commit -m "feat(core): ModelLoader materialOverride and CameraTour

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Tour content in the Lesson 01 config

**Files:**

- Modify: `src/lessons/lesson01/config.ts` (the `solar-calendar` topic)

**Interfaces:**

- Consumes: `TourStop` / `LearningTopic.tour` (Task 1).
- Produces: `lesson01Config.content.topics[solar-calendar].tour` — six `TourStop`s. Camera numbers are **starting values**, tuned on screen in Task 6 (target ≈ pyramid centre; north = −Z ⇒ azimuth π; the authoring camera sits at azimuth ≈ 3.68).

- [ ] **Step 1: Add the tour to the topic**

In `src/lessons/lesson01/config.ts`, replace

```ts
          'Its 52 panels are also linked to the 52-year Calendar Round.'
        ]
      }
    ],
```

with

```ts
          'Its 52 panels are also linked to the 52-year Calendar Round.'
        ],
        // Guided blueprint tour (wireframe on black). Copy is drawn only from
        // LearningMaterial/lesson_01.md — `status` marks what is documented
        // versus interpretation. Camera poses are orbits around the pyramid:
        // azimuth 0 = camera on +Z, increasing toward +X; north (−Z) = π.
        tour: [
          {
            id: 'tour-outline',
            label: 'El Castillo',
            camera: { azimuth: 3.68, elevation: 0.32, radius: 105, target: [-1, 13, 1] },
            info: {
              headline: 'El Castillo in outline',
              lines: [
                'A monumental stepped pyramid at Chichén Itzá, strongly associated with calendrical and astronomical symbolism.',
                'Drawn here as a blueprint: only the geometry remains.'
              ],
              status: 'documented'
            }
          },
          {
            id: 'tour-terraces',
            label: 'Nine terraces',
            camera: { azimuth: 4.712, elevation: 0.05, radius: 95, target: [-1, 13, 1] },
            info: {
              headline: 'Nine stepped terraces',
              figure: '9',
              lines: ['The body of the pyramid is built from nine stepped terraces.'],
              status: 'documented'
            }
          },
          {
            id: 'tour-stairways',
            label: 'Four stairways',
            camera: { azimuth: 3.1416, elevation: 0.12, radius: 80, target: [-1, 12, 1] },
            info: {
              headline: 'Four stairways',
              figure: '4 × 91',
              lines: [
                'Four stairways climb the pyramid.',
                'Each is traditionally counted as 91 steps: 4 × 91 = 364.'
              ],
              status: 'documented'
            }
          },
          {
            id: 'tour-365',
            label: '364 + 1',
            camera: { azimuth: 3.1416, elevation: 1.35, radius: 90, target: [-1, 25, 1] },
            info: {
              headline: '364 steps + the platform',
              figure: '365',
              lines: [
                'Together with the upper platform, the 364 steps make 365.',
                'This has been interpreted as a symbolic representation of the 365-day solar year (the Haab).'
              ],
              status: 'interpretation'
            }
          },
          {
            id: 'tour-panels',
            label: '52 panels',
            camera: { azimuth: 1.5708, elevation: 0.1, radius: 70, target: [-1, 10, 1] },
            info: {
              headline: '52 panels on each side',
              figure: '52',
              lines: [
                'The structure contains 52 architectural panels or elements on each side.',
                'The number can be related to the 52-year Calendar Round.'
              ],
              status: 'interpretation'
            }
          },
          {
            id: 'tour-calendar-round',
            label: 'Calendar Round',
            camera: { azimuth: 4.2, elevation: 0.45, radius: 130, target: [-1, 13, 1] },
            info: {
              headline: 'The Calendar Round',
              figure: '18,980 days',
              lines: [
                'The Calendar Round repeats approximately every 18,980 days — 52 Haab years.',
                'It is the point at which the 260-day Tzolk’in and the 365-day Haab once again produce the same combination of dates.',
                'Whether El Castillo’s numbers were meant to echo it cannot always be demonstrated archaeologically.'
              ],
              status: 'mixed'
            }
          }
        ]
      }
    ],
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exit 0 (the `tour` field type-checks against `TourStop[]`).

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write src/lessons/lesson01/config.ts
git add src/lessons/lesson01/config.ts
git commit -m "feat(lesson01): add blueprint tour content to Calendar & Architecture

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `BlueprintScene`, scene dispatch and page plumbing

**Files:**

- Create: `src/lessons/lesson01/BlueprintScene.tsx`
- Modify: `src/lessons/lesson01/Lesson01Scene.tsx` (props, dispatch)
- Modify: `src/lessons/registry.ts` (`SceneComponent` prop type)
- Modify: `src/pages/LessonPage.tsx` (initial position, topic-reset, scene props)

**Interfaces:**

- Consumes: `sampleTour`, `CameraTour`, `ModelLoader.materialOverride`, `tour` config (Tasks 1–3).
- Produces: `SceneComponent` props become `{ config, atmosphere, topicId: string, position: number }`; `BlueprintScene` props `{ tour: TourStop[]; position: number; lens: Pick<CameraConfig,'fov'|'near'|'far'>; layoutAsset: ModelAsset; floorAsset: ModelAsset }`.

- [ ] **Step 1: Create `BlueprintScene`**

Create `src/lessons/lesson01/BlueprintScene.tsx`:

```tsx
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CameraTour } from '../../core/components/CameraTour';
import { ModelLoader } from '../../core/components/ModelLoader';
import { sampleTour } from '../../core/utils/tour';
import { CameraConfig, ModelAsset, TourStop } from '../../core/types/lesson.types';

interface BlueprintSceneProps {
  tour: TourStop[];
  /** Continuous tour position in [1, N] (the single runtime value, ADR-001). */
  position: number;
  lens: Pick<CameraConfig, 'fov' | 'near' | 'far'>;
  layoutAsset: ModelAsset;
  floorAsset: ModelAsset;
}

/** maya-gold token (tailwind.config.js). */
const BLUEPRINT_GOLD = '#d4af37';

/**
 * Lesson 01 blueprint scene — the Calendar & Architecture view.
 *
 * Everything is drawn with ONE shared wireframe material (plus a fainter
 * variant for the plaza floor) on a black background. Basic materials ignore
 * lights and IBL, so — deliberately — there is no SceneEnvironment and no sun
 * here. The tree canopy is not mounted (a wireframe canopy is only haze).
 * The camera pose is derived from the tour position by `sampleTour`; no
 * useFrame, no state.
 */
export const BlueprintScene: React.FC<BlueprintSceneProps> = ({
  tour,
  position,
  lens,
  layoutAsset,
  floorAsset
}) => {
  const sample = useMemo(() => sampleTour(tour, position), [tour, position]);

  const pyramidMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: BLUEPRINT_GOLD,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        toneMapped: false
      }),
    []
  );
  const floorMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: BLUEPRINT_GOLD,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        toneMapped: false
      }),
    []
  );
  useEffect(
    () => () => {
      pyramidMaterial.dispose();
      floorMaterial.dispose();
    },
    [pyramidMaterial, floorMaterial]
  );

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraTour sample={sample} lens={lens} />
      <group name="Lesson01_Blueprint">
        <ModelLoader asset={layoutAsset} materialOverride={pyramidMaterial} />
        <ModelLoader asset={floorAsset} materialOverride={floorMaterial} />
      </group>
    </>
  );
};
```

- [ ] **Step 2: Dispatch from `Lesson01Scene`**

In `src/lessons/lesson01/Lesson01Scene.tsx`:

Add the import after the `SceneLighting` import:

```ts
import { BlueprintScene } from './BlueprintScene';
```

Replace the props interface

```ts
interface Lesson01SceneProps {
  config: LessonConfig;
  /** Derived sample of the Atmosphere Timeline (ADR-001). */
  atmosphere: AtmosphereSample;
}
```

with

```ts
interface Lesson01SceneProps {
  config: LessonConfig;
  /** Derived sample of the Atmosphere Timeline (ADR-001). */
  atmosphere: AtmosphereSample;
  /** Selected topic id — a topic that owns a `tour` renders the blueprint scene. */
  topicId: string;
  /** Continuous `sliderPosition`; for tour topics it is the tour step (1..N). */
  position: number;
}
```

Replace `export const Lesson01Scene: React.FC<Lesson01SceneProps> = ({ config, atmosphere }) => {` with

```ts
export const Lesson01Scene: React.FC<Lesson01SceneProps> = ({
  config,
  atmosphere,
  topicId,
  position
}) => {
```

Immediately after the line `const treesAsset = requireModel('trees');` insert:

```tsx
// A topic that owns a guided tour renders the blueprint scene (wireframe on
// black, orbiting camera) instead of the photoreal assembly below. The
// dispatch keys on the topic's `tour`, never on a topic id.
const tour = config.content.topics.find((t) => t.id === topicId)?.tour;
if (tour) {
  return (
    <BlueprintScene
      tour={tour}
      position={position}
      lens={config.camera}
      layoutAsset={layoutAsset}
      floorAsset={floorAsset}
    />
  );
}
```

Also extend the component's doc comment with a last line:
`* When the selected topic owns a`tour`, BlueprintScene is rendered instead.`

- [ ] **Step 3: Registry prop type**

In `src/lessons/registry.ts`, replace

```ts
    /** Derived sample of the Atmosphere Timeline at the current slider position. */
    atmosphere: AtmosphereSample;
  }>;
```

with

```ts
    /** Derived sample of the Atmosphere Timeline at the current slider position. */
    atmosphere: AtmosphereSample;
    /** Selected topic id (lets a scene pick a per-topic presentation). */
    topicId: string;
    /** Continuous slider position — the sky position or, for tour topics, the tour step. */
    position: number;
  }>;
```

- [ ] **Step 4: `LessonPage` — initial position honours tours**

In `src/pages/LessonPage.tsx`, replace

```ts
const n = (initialTopic.skyTimeline ?? lessonEntry.config.assets.environment.skyTimeline).length;
const step = Number(searchParams.get('step'));
if (Number.isFinite(step) && step >= 1) return Math.min(Math.round(step), n);
return initialTopic.skyTimeline ? 1 : 3;
```

with

```ts
const n =
  initialTopic.tour?.length ??
  (initialTopic.skyTimeline ?? lessonEntry.config.assets.environment.skyTimeline).length;
const step = Number(searchParams.get('step'));
if (Number.isFinite(step) && step >= 1) return Math.min(Math.round(step), n);
return initialTopic.skyTimeline || initialTopic.tour ? 1 : 3;
```

- [ ] **Step 5: `LessonPage` — topic reset honours tours**

Replace

```ts
setSliderPosition(topic?.skyTimeline ? 1 : 3);
```

with

```ts
setSliderPosition(topic?.skyTimeline || topic?.tour ? 1 : 3);
```

and in the comment block above that effect, change the sentence
`Topics that own a skyTimeline start at step 1;` to
`Topics that own a skyTimeline or a tour start at step 1;`.

Also update the comment above `activeSkyTimeline`: replace
`Serpent Descent owns a 2-step focused timeline; the Calendar & Architecture topic falls back to the lesson default.` with
`Serpent Descent owns a 2-step focused timeline; the Calendar & Architecture topic owns a tour (its sky is unused — sampleAtmosphere clamps out-of-range positions).`

(Adjust the surrounding line wrapping; Prettier does not reflow comments.)

- [ ] **Step 6: `LessonPage` — pass the new scene props**

Replace

```tsx
<SceneComponent config={config} atmosphere={atmosphere} />
```

with

```tsx
<SceneComponent
  config={config}
  atmosphere={atmosphere}
  topicId={selectedTopicId}
  position={sliderPosition}
/>
```

- [ ] **Step 7: Typecheck, lint, format**

Run: `npm run typecheck` → exit 0.
Run: `npm run lint` → 0 errors, still only the 3 pre-existing warnings.
Run: `npx prettier --write src/lessons/lesson01/BlueprintScene.tsx src/lessons/lesson01/Lesson01Scene.tsx src/lessons/registry.ts src/pages/LessonPage.tsx`

- [ ] **Step 8: Manual check — the blueprint renders and bad deep links are safe**

Run `npm run dev -- --port 3001 --strictPort` in the background (the user's own server may hold 3000). Open each URL and confirm:

- `http://localhost:3001/lesson/01?topic=solar-calendar&step=1` → black background, gold wireframe pyramid + faint floor, no trees; no console errors. (The tour panel/stepper don't exist yet — that's Task 5.)
- `...&step=4` → camera is high above the pyramid, looking down.
- `...&step=99` → renders as step 6 (wide view); `...&step=0` and `...&step=abc` → render as step 1. No blank canvas, no crash. _(Review Focus 1.)_
- `http://localhost:3001/lesson/01` (default) → unchanged photoreal Serpent Descent.
- `http://localhost:3001/lesson/02` → the "coming soon" page, unchanged.

- [ ] **Step 9: Commit**

```bash
git add src/lessons/lesson01/BlueprintScene.tsx src/lessons/lesson01/Lesson01Scene.tsx src/lessons/registry.ts src/pages/LessonPage.tsx
git commit -m "feat(lesson01): render Calendar & Architecture as a blueprint scene

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Overlay UI — `TourPanel`, `TourStepper`, integration

**Files:**

- Create: `src/lessons/lesson01/TourPanel.tsx`
- Create: `src/lessons/lesson01/TourStepper.tsx`
- Modify: `src/lessons/lesson01/Lesson01Overlay.tsx`

**Interfaces:**

- Consumes: `TourStop`, `TourEvidence` (Task 1); overlay's existing `sliderPosition`, `handleStepSelect`, `activeTopic`, `selectedTopicId`, `config`.
- Produces: `TourPanel` props `{ stops: TourStop[]; value: number }`; `TourStepper` props `{ stops: TourStop[]; value: number; onStepSelect: (step: number) => void }`.

- [ ] **Step 1: Create `TourPanel`**

Create `src/lessons/lesson01/TourPanel.tsx`:

```tsx
import React from 'react';
import { TourEvidence, TourStop } from '../../core/types/lesson.types';

interface TourPanelProps {
  stops: TourStop[];
  /** Continuous tour position in [1, N]; the nearest stop is shown. */
  value: number;
}

const STATUS_LABEL: Record<TourEvidence, string> = {
  documented: 'Documented',
  interpretation: 'Interpretation',
  mixed: 'Documented · interpreted link'
};

// Documented = solid gold chip; interpretation = dashed, dimmer chip, so the
// evidence/interpretation distinction reads at a glance, not only by label.
const STATUS_STYLE: Record<TourEvidence, string> = {
  documented: 'border-maya-gold/60 bg-maya-gold/15 text-maya-goldLight',
  interpretation: 'border-dashed border-white/30 bg-white/5 text-maya-textDim',
  mixed: 'border-dashed border-maya-gold/50 bg-maya-gold/10 text-maya-goldLight'
};

/**
 * TourPanel — the current tour step's explanation. Pure view of the derived
 * step (nearest stop to `value`); holds no state (ADR-001).
 */
export const TourPanel: React.FC<TourPanelProps> = ({ stops, value }) => {
  const n = stops.length;
  if (n === 0) return null;
  const index = Math.min(n - 1, Math.max(0, Math.round(value) - 1));
  const { info } = stops[index];

  return (
    <section
      aria-live="polite"
      aria-label="Tour step"
      className="bg-maya-surfaceHover/70 border border-maya-gold/30 rounded-xl p-4 space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-maya-gold">
          Step {index + 1} of {n}
        </span>
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLE[info.status]}`}
        >
          {STATUS_LABEL[info.status]}
        </span>
      </div>

      {info.figure && (
        <p className="font-serif text-3xl font-bold text-maya-cream leading-none">{info.figure}</p>
      )}
      <h3 className="font-serif text-[15px] font-bold text-maya-cream">{info.headline}</h3>

      <ul className="space-y-2 text-[13.5px] text-maya-textDim leading-relaxed">
        {info.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
};
```

- [ ] **Step 2: Create `TourStepper`**

Create `src/lessons/lesson01/TourStepper.tsx`:

```tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TourStop } from '../../core/types/lesson.types';

interface TourStepperProps {
  stops: TourStop[];
  /** Continuous tour position in [1, N]. */
  value: number;
  /** Step navigation — the parent runs the eased camera sweep. */
  onStepSelect: (step: number) => void;
}

/**
 * TourStepper — prev/next + one dot per stop. Stateless: the active step is
 * derived from `value`, navigation goes through `onStepSelect` (the same
 * eased sweep the sky slider uses), so the camera glides between viewpoints.
 */
export const TourStepper: React.FC<TourStepperProps> = ({ stops, value, onStepSelect }) => {
  const n = stops.length;
  if (n === 0) return null;
  const active = Math.min(n, Math.max(1, Math.round(value)));
  const go = (step: number) => onStepSelect(Math.min(n, Math.max(1, step)));

  const navButton =
    'flex h-7 w-7 items-center justify-center rounded-full text-maya-textDim transition-colors ' +
    'hover:text-maya-gold disabled:opacity-30 disabled:hover:text-maya-textDim cursor-pointer disabled:cursor-default';

  return (
    <nav
      aria-label="Architecture tour"
      className="mx-auto flex w-full max-w-[640px] items-center justify-center gap-3 rounded-full border border-maya-gold/30 bg-maya-surface/90 px-3 py-1.5 backdrop-blur-xl"
    >
      <button
        type="button"
        aria-label="Previous step"
        disabled={active === 1}
        onClick={() => go(active - 1)}
        className={navButton}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <ol className="flex items-center">
        {stops.map((stop, i) => (
          <li key={stop.id}>
            <button
              type="button"
              aria-label={`Step ${i + 1}: ${stop.label}`}
              aria-current={active === i + 1 ? 'step' : undefined}
              title={stop.label}
              onClick={() => go(i + 1)}
              className="flex h-6 w-6 items-center justify-center cursor-pointer"
            >
              <span
                className={`block rounded-full transition-all ${
                  active === i + 1
                    ? 'h-3 w-3 bg-maya-gold'
                    : 'h-2 w-2 bg-maya-textDim/50 hover:bg-maya-textDim'
                }`}
              />
            </button>
          </li>
        ))}
      </ol>

      <span className="min-w-[8.5rem] text-center font-mono text-[11px] text-maya-textDim">
        {active} / {n} · {stops[active - 1].label}
      </span>

      <button
        type="button"
        aria-label="Next step"
        disabled={active === n}
        onClick={() => go(active + 1)}
        className={navButton}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};
```

- [ ] **Step 3: Wire into `Lesson01Overlay` — imports**

In `src/lessons/lesson01/Lesson01Overlay.tsx`, after `import { SerpentSlider } from './SerpentSlider';` add:

```ts
import { TourPanel } from './TourPanel';
import { TourStepper } from './TourStepper';
```

- [ ] **Step 4: Replace the `sliderHidden` logic**

Replace

```ts
// The slider is the environment control for the sky setup (Serpent
// Descent). Calendar & Architecture is a reference view — no slider.
const sliderHidden = selectedTopicId === 'solar-calendar';
```

with

```ts
// A topic that owns a guided tour swaps the sky slider for a step
// navigator; both write the single `sliderPosition` (ADR-001).
const tour = config.content.topics.find((t) => t.id === selectedTopicId)?.tour;
```

- [ ] **Step 5: Show the step panel at the top of the field guide**

Replace

```tsx
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <p className="text-[13.5px] text-maya-textDim leading-relaxed italic border-l-2 border-maya-gold/50 pl-3">
```

with

```tsx
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {activeTopic.tour && <TourPanel stops={activeTopic.tour} value={sliderPosition} />}

                <p className="text-[13.5px] text-maya-textDim leading-relaxed italic border-l-2 border-maya-gold/50 pl-3">
```

- [ ] **Step 6: Swap the bottom instrument**

Replace the comment + wrapper opening

```tsx
      {/* Bottom instrument — the Atmosphere Timeline, full width, and
          nothing else: the slider is the single environment control
          (ADR-001). Rendered for the sky setup (Serpent Descent); hidden
          in the Calendar & Architecture reference view. The overlay lives
```

with

```tsx
      {/* Bottom instrument — one control at a time: the Atmosphere Timeline
          for the sky setup (Serpent Descent), or the tour stepper for the
          Calendar & Architecture blueprint tour. Both write the single
          `sliderPosition` (ADR-001). The overlay lives
```

and replace

```tsx
      <div
        className={`pointer-events-auto mt-auto ${
          sliderHidden ? 'hidden' : activePanel ? 'block' : ''
        }`}
      >
        <div id="lesson-instrument">
          {selectedTopicId === 'serpent-descent' ? (
```

with

```tsx
      <div className={`pointer-events-auto mt-auto ${activePanel ? 'block' : ''}`}>
        <div id="lesson-instrument">
          {tour ? (
            <TourStepper stops={tour} value={sliderPosition} onStepSelect={handleStepSelect} />
          ) : selectedTopicId === 'serpent-descent' ? (
```

- [ ] **Step 7: Typecheck, lint, format**

Run: `npm run typecheck` → exit 0 (no unused `sliderHidden`).
Run: `npm run lint` → 0 errors, still only the 3 pre-existing warnings.
Run: `npx prettier --write src/lessons/lesson01/TourPanel.tsx src/lessons/lesson01/TourStepper.tsx src/lessons/lesson01/Lesson01Overlay.tsx`

- [ ] **Step 8: Manual check**

With the dev server up, open `/lesson/01?topic=solar-calendar&step=1` (reload it if HMR misses the type change):

- The left panel is open with the Step 1 of 6 card at the top (badge "Documented"), followed by the existing summary/overview/culture content; the bottom shows the stepper (6 dots, prev disabled).
- Click each dot / next: the camera **glides** (~0.6 s) around the pyramid; the card text, badge and the `n / 6 · Label` caption follow the nearest step. Step 4 and 5 show a dashed "Interpretation" chip; step 6 shows "Documented · interpreted link".
- Click **Serpent Descent** in the header: photoreal scene + SerpentSlider return (details verified in Task 6).

- [ ] **Step 9: Commit**

```bash
git add src/lessons/lesson01/TourPanel.tsx src/lessons/lesson01/TourStepper.tsx src/lessons/lesson01/Lesson01Overlay.tsx
git commit -m "feat(lesson01): tour panel and step navigator for Calendar & Architecture

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Visual verification and camera tuning

**Files:**

- Modify (only if tuning is needed): `src/lessons/lesson01/config.ts` (camera numbers in the six stops)

No new code — this is the evidence step. Use the browser tooling (or a manual browser) against `http://localhost:3001/lesson/01?topic=solar-calendar&step=N`. The design spec lists three open risks that only screen inspection can settle.

- [ ] **Step 1: Are the stairs modeled as steps?**

At `step=3` (north face-on, low), look for repeated horizontal step lines on the stairways (≈91 per stairway is not required to count, but distinct step edges vs. a smooth diagonal ramp is). Record the outcome in the final report. If the stairs are a smooth ramp, **do not change the copy or geometry** — report it to the user (the "91 steps" story then rests on copy + framing; a Blender re-export is out of scope).

- [ ] **Step 2: Judge wireframe legibility**

Look at steps 1, 3 and 4. Answer: are triangle diagonals across flat faces distracting enough that the pyramid's terraces/stairs no longer read? Write the answer down: **clean** or **noisy**. If **noisy**, do Task 7 (edge-lines variant); if **clean**, skip Task 7 and delete it from the plan file when reporting.

- [ ] **Step 3: Frame each step**

For each of the 6 stops, confirm: the pyramid is fully visible, **not hidden behind the open left panel** (the panel covers roughly the left 26% of the frame — shift `target` x or increase `radius` to move the pyramid right/smaller), and the view suits the caption (terraces silhouette at 2, stairway face-on at 3, top-down at 4, side face at 5, wide at 6). Adjust `azimuth/elevation/radius/target` in `config.ts` and reload; iterate until all six look right. Keep azimuth deltas between neighbours under π so each sweep takes the intended way round.

- [ ] **Step 4: Floor**

Decide whether the faint floor (opacity 0.12) helps or clutters. If cluttered, remove the `<ModelLoader asset={floorAsset} …/>` line and the now-unused `floorMaterial`/`floorAsset` wiring from `BlueprintScene.tsx` (and stop passing `floorAsset` from `Lesson01Scene.tsx`); if it reads fine, leave it.

- [ ] **Step 5: Reduced motion and keyboard**

With OS/devtools `prefers-reduced-motion: reduce` emulated, clicking a dot **jumps** to the step (no sweep). Tab reaches the stepper buttons; Enter/Space activate them; the focus ring is visible.

- [ ] **Step 6: Round trip back to Serpent Descent** _(Review Focus 3)_

From any tour step click **Serpent Descent**: the photoreal sky returns, the trees and floor render with their real materials (not gold wireframe), the pyramid is not black, the SerpentSlider is centered and works, and dragging it still crossfades sky + IBL. Then click Calendar & Architecture again → blueprint again, step 1.

- [ ] **Step 7: Resize mid-tour** _(Review Focus 5)_

At `step=4`, resize the browser window narrower/wider: the view re-frames for the new aspect but stays on the step-4 pose (it does not snap to step 1).

- [ ] **Step 8: Final tuned commit (only if `config.ts`/`BlueprintScene.tsx` changed)**

```bash
npx prettier --write src/lessons/lesson01/config.ts src/lessons/lesson01/BlueprintScene.tsx src/lessons/lesson01/Lesson01Scene.tsx
git add src/lessons/lesson01/config.ts src/lessons/lesson01/BlueprintScene.tsx src/lessons/lesson01/Lesson01Scene.tsx
git commit -m "tune(lesson01): frame blueprint tour stops

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Stage only the files that actually changed.)

---

### Task 7 (conditional): Clean edge-line variant — only if Task 6 step 2 said "noisy"

**Files:**

- Create: `src/lessons/lesson01/BlueprintEdges.tsx`
- Modify: `src/lessons/lesson01/BlueprintScene.tsx` (use it for the pyramid)

**Interfaces:**

- Produces: `BlueprintEdges` props `{ asset: ModelAsset; color: string; opacity: number; thresholdDeg?: number }` — draws only hard edges (`THREE.EdgesGeometry`, default 25°) over a black occluder so back edges are hidden.

- [ ] **Step 1: Create `BlueprintEdges`**

```tsx
import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAsset } from '../../core/types/lesson.types';

interface BlueprintEdgesProps {
  asset: ModelAsset;
  color: string;
  opacity: number;
  /** Edges are drawn where adjacent faces differ by more than this angle. */
  thresholdDeg?: number;
}

/**
 * Clean blueprint rendering: only hard edges (no triangle diagonals), over a
 * black occluder so lines behind the front faces are hidden. Built from the
 * cached GLTF without mutating it; the occluder shares the cached geometry
 * (never disposed here), the edge geometries/materials are ours to dispose.
 */
export const BlueprintEdges: React.FC<BlueprintEdgesProps> = ({
  asset,
  color,
  opacity,
  thresholdDeg = 25
}) => {
  const gltf = useGLTF(asset.url);

  const built = useMemo(() => {
    const group = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false
    });
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: '#000000',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      toneMapped: false
    });
    const edgeGeometries: THREE.EdgesGeometry[] = [];

    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry, thresholdDeg);
      edgeGeometries.push(edgesGeometry);

      const lines = new THREE.LineSegments(edgesGeometry, lineMaterial);
      lines.applyMatrix4(mesh.matrixWorld);
      const occluder = new THREE.Mesh(mesh.geometry, fillMaterial);
      occluder.applyMatrix4(mesh.matrixWorld);
      group.add(lines, occluder);
    });

    return { group, lineMaterial, fillMaterial, edgeGeometries };
  }, [gltf.scene, color, opacity, thresholdDeg]);

  useEffect(
    () => () => {
      built.lineMaterial.dispose();
      built.fillMaterial.dispose();
      built.edgeGeometries.forEach((g) => g.dispose());
    },
    [built]
  );

  return (
    <primitive
      object={built.group}
      position={asset.position || [0, 0, 0]}
      rotation={asset.rotation || [0, 0, 0]}
      scale={asset.scale || [1, 1, 1]}
    />
  );
};
```

- [ ] **Step 2: Use it for the pyramid**

In `BlueprintScene.tsx`: import `BlueprintEdges` from `./BlueprintEdges`; replace
`<ModelLoader asset={layoutAsset} materialOverride={pyramidMaterial} />` with
`<BlueprintEdges asset={layoutAsset} color={BLUEPRINT_GOLD} opacity={0.85} />`;
delete the now-unused `pyramidMaterial` memo and its `dispose()` call (keep `floorMaterial` and the floor `ModelLoader`).

- [ ] **Step 3: Verify and compare**

Run `npm run typecheck` and `npm run lint` (0 errors). Reload the tour and compare steps 1/3/4 against the wireframe: keep whichever reads better. If the wireframe was better after all, `git checkout -- src/lessons/lesson01/BlueprintScene.tsx` and delete `BlueprintEdges.tsx`.

- [ ] **Step 4: Format and commit**

```bash
npx prettier --write src/lessons/lesson01/BlueprintEdges.tsx src/lessons/lesson01/BlueprintScene.tsx
git add src/lessons/lesson01/BlueprintEdges.tsx src/lessons/lesson01/BlueprintScene.tsx
git commit -m "feat(lesson01): clean edge-line blueprint rendering for the pyramid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Docs and final validation

**Files:**

- Modify: `docs/ARCHITECTURE.md`, `docs/3D_ARCHITECTURE.md`, `docs/PROJECT.md`

- [ ] **Step 1: `docs/ARCHITECTURE.md`**

- In the module table, after the `core/utils/atmosphere.ts` row, add:
  `| `core/utils/tour.ts`|`sampleTour()` — pure guided-tour sampler (shortest-arc azimuth, elevation/radius/target lerp) | core types only |`
- In the `LessonPage` tree, change
  `│   └── SceneComponent          from registry (currently always Lesson01Scene)` to
  `│   └── SceneComponent          from registry (currently always Lesson01Scene; renders BlueprintScene when the topic owns a `tour`)`.
- In the data-flow diagram, change `SceneComponent (config + atmosphere)` to `SceneComponent (config + atmosphere + topicId + position)`.
- After the bullet ending `…mutates only `sliderPosition`.`, add:
  `- **Tour topics** (`LearningTopic.tour`, e.g. Calendar & Architecture): `sliderPosition`means the tour step (1..N).`sampleTour(stops, position)`derives the camera pose; the eased sweep between steps is the orbit, so there is still no`useFrame`. The overlay swaps the sky slider for `TourStepper`+`TourPanel`.`

- [ ] **Step 2: `docs/3D_ARCHITECTURE.md`**

Append to the `## Camera` section:

```
**Tour camera (Calendar & Architecture).** Topics that own a `tour` mount `BlueprintScene`
instead of the photoreal assembly: black `scene.background`, no `SceneEnvironment`/sun (basic
materials ignore light and IBL), the tree canopy unmounted, and every mesh re-skinned with one
shared wireframe `MeshBasicMaterial` via `ModelLoader`'s `materialOverride` (the clone's material
is rebound; the cached GLTF is never mutated). `CameraTour` applies the pose derived by
`sampleTour(stops, sliderPosition)` in a dependency-guarded layout effect and invalidates —
`frameloop="demand"` and the no-`useFrame` rule are unchanged; the eased step sweep produces the
orbit. Photoreal topics still use the locked `FixedGlbCamera`.
```

- [ ] **Step 3: `docs/PROJECT.md`**

Change the bullet
`- Fixed cinematic camera baked from the GLB authoring camera (no user orbit/zoom — deliberate).` to
`- Fixed cinematic camera baked from the GLB authoring camera on the photoreal topics (no user orbit/zoom — deliberate); the Calendar & Architecture blueprint tour moves the camera along authored viewpoints (still no user orbit).`

Also add a feature bullet:
`- **Blueprint tour** (Calendar & Architecture): wireframe El Castillo on black, a six-step guided camera tour, and a step panel that marks each claim Documented or Interpretation.`

- [ ] **Step 4: Full validation**

Run each and confirm:

```bash
node scripts/check-tour.ts     # → sampleTour: all checks passed
npm run typecheck              # → exit 0
npm run lint                   # → 0 errors; only the 3 pre-existing warnings
npm run build                  # → succeeds (three chunk-size warning is expected)
npx prettier --check src/core src/lessons src/pages docs/ARCHITECTURE.md docs/3D_ARCHITECTURE.md docs/PROJECT.md docs/superpowers
```

If `prettier --check` flags files this plan did **not** touch (e.g. the user's uncommitted `LandingPage.tsx`), leave them and report; fix only files touched here.

Confirm the landing page is still lean: `npm run build` output shows the landing chunk ≈ 190 KB (no three/R3F pulled in — `BlueprintScene`/`CameraTour` are only reachable through the lazy Lesson01Scene chunk).

- [ ] **Step 5: Commit**

```bash
npx prettier --write docs/ARCHITECTURE.md docs/3D_ARCHITECTURE.md docs/PROJECT.md
git add docs/ARCHITECTURE.md docs/3D_ARCHITECTURE.md docs/PROJECT.md
git commit -m "docs: describe the blueprint tour (sampleTour, CameraTour, materialOverride)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Stop the dev server** started in Task 4 (stop the background task, or kill the PID found via `netstat -ano | grep :3001`).

---

## Self-Review

**Spec coverage.** §2.1 data flow → Tasks 1, 4 (position semantics, initial/reset). §2.2 `sampleTour` → Task 1 (shortest arc, clamp, throw). §2.3 components: `CameraTour`, `ModelLoader.materialOverride` → Task 2; types/`tour.ts` → Task 1; `BlueprintScene`, `Lesson01Scene` dispatch, registry/`LessonPage` props + reset → Task 4; `TourPanel`/`TourStepper`/`Overlay` → Task 5; `config.ts` tour → Task 3. §2.4 look (shared wireframe, faint floor, trees unmounted, black sky, edges alternative) → Tasks 4, 6 (step 2/4), 7. §2.5 types → Task 1. §3 content → Task 3 (six stops, copy from `lesson_01.md`); the optional step 7 was not requested by the user and is omitted. §4 validation/risks (stairs modeled?, wireframe legibility, camera tuning, teardown, docs) → Tasks 6, 4/6, 8. Spec deltas found while planning: `TourEvidence` gains `mixed`, dispatch keys on `topic.tour` — both recorded in Task 1 step 7.

**Placeholder scan.** No TBD/TODO; every code step shows the code; camera numbers are concrete starting values with an explicit tuning task; Task 7 is conditional but complete.

**Type consistency.** `TourSample { eye, target, activeIndex }` (Task 1) is what `CameraTour` (Task 2) and `BlueprintScene` (Task 4) consume; `sampleTour(stops, position)` signature matches its call in `BlueprintScene`; `SceneComponent` props `{ config, atmosphere, topicId, position }` match between `registry.ts`, `Lesson01Scene`, and `LessonPage`; `TourPanel`/`TourStepper` props match their use in the overlay; `materialOverride?: THREE.Material` matches `MeshBasicMaterial` instances.

**Review Focus coverage.** (1) bad deep links → Task 4 step 8; (2) azimuth wrap → Task 1 check case 3; (3) round trip back → Task 6 step 6; (4) fractional/tiny tours → Task 1 check cases 4, 6; (5) resize → Task 6 step 7.
