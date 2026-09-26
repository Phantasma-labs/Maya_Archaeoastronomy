# Architecture & Calendar "Blueprint Tour" — Design

Status: draft for review · Date: 2026-09-26 · Lesson 01, topic `solar-calendar`

## 1. Intent

When a learner selects **Calendar & Architecture**, the scene changes from the
photoreal plaza into a **blueprint view** of El Castillo: every mesh drawn with a
single wireframe material on a black sky, while a **guided tour** swings the
camera around the pyramid one viewpoint at a time. Each step shows the matching
architectural fact and how it relates to the Maya calendars.

Success: a learner can say _why_ the pyramid's structure is read as a calendar
(9 terraces, 4 × 91 steps, 365, 52 panels, Calendar Round) and which claims are
documented versus interpretation.

Constraints carried from the repo:

- ADR-001: `sliderPosition` stays the **only** runtime value; everything else is
  derived. No new store, no `useFrame`, `frameloop="demand"` unchanged.
- Layering `pages → lessons → core`; core stays lesson-agnostic.
- Content follows `LearningMaterial/lesson_01.md` — evidence vs interpretation.
  **No outside facts are added.**
- Preserve the `ModelLoader` vertex-color guard.
- No new dependencies.

Non-goals (v1): per-part highlighting of stairs/terraces/panels, free orbit
controls, idle auto-spin, cross-topic crossfade (topic switch is a hard cut),
touching Lesson 02.

## 2. Architecture

### 2.1 Data flow

`sliderPosition` for this topic means **tour step, continuous in [1, N]**
(N = number of tour stops). All of the following are pure derivations from it:

- camera pose → `sampleTour(stops, position)` (new, core)
- active text → `stops[Math.round(position) - 1].info`
- stepper dot highlight → same rounding

The existing eased sweep in `LessonPage` (`handleStepSelect`, 600 ms) already
animates `sliderPosition` between integers. Because the camera interpolates in
**azimuth / elevation / radius around a fixed target**, each sweep is a smooth
arc around the monument — the orbit — with no per-frame loop.

### 2.2 `sampleTour` (core, `core/utils/tour.ts`)

Pure function, mirrors `sampleAtmosphere`: clamps out-of-range and non-finite
input to step 1, throws on an empty tour.

- azimuth: lerp along the **shortest arc** (wrap to ±π) so a 350° → 10° step
  doesn't spin the long way round
- elevation, radius: lerp
- target: lerp per component
- Convert to camera `position` + `lookAt` (spherical → Cartesian around target)

Optional per-stop `easing` is out of scope; the sweep's `easeInOutCubic` already
provides ease-in-out between steps.

### 2.3 Components

| Unit                                                 | Layer  | Change                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core/components/CameraTour.tsx`                     | core   | New. Takes the sampled pose, applies it to the R3F camera in a dependency-guarded layout effect (mutates the camera via ref; no React state). Keeps aspect/projection in sync on resize like `FixedGlbCamera`.                 |
| `core/components/ModelLoader.tsx`                    | core   | New optional prop `materialOverride?: THREE.Material`. When set, every mesh on the **clone** gets that material; the vertex-color logic is skipped. Cached GLTF materials are never mutated.                                   |
| `core/types/lesson.types.ts`                         | core   | Add `TourStop`, `LearningTopic.tour?`, and (see 2.5) scene props.                                                                                                                                                              |
| `core/utils/tour.ts`                                 | core   | New `sampleTour`.                                                                                                                                                                                                              |
| `lessons/lesson01/BlueprintScene.tsx`                | lesson | New. Black `scene.background`, `CameraTour`, three `ModelLoader`s: layout with the blueprint material, floor with a faint variant, **trees not mounted**. No `SceneEnvironment`, no `SceneLighting`.                           |
| `lessons/lesson01/Lesson01Scene.tsx`                 | lesson | Dispatch: the active topic owning a `tour` (no topic-id special-casing) → `BlueprintScene`, otherwise the current photoreal assembly (extracted unchanged into `SerpentScene` or kept inline — whichever is the smaller diff). |
| `lessons/lesson01/TourPanel.tsx` + `TourStepper.tsx` | lesson | New. Panel shows headline, big figure, status badge, lines. Stepper: prev/next + N dots, calling `onStepSelect`.                                                                                                               |
| `lessons/lesson01/Lesson01Overlay.tsx`               | lesson | For `solar-calendar`: render `TourPanel` under the intro cards and `TourStepper` in the bottom instrument slot (replacing the hidden slider). Serpent Descent path untouched.                                                  |
| `pages/LessonPage.tsx`, `lessons/registry.ts`        | pages  | Pass `topicId` + `position` to `SceneComponent`. Topic-reset and initial position use the tour length (`topic.tour ? 1 : …`). `sampleAtmosphere` keeps using the default timeline and already clamps position.                 |
| `lessons/lesson01/config.ts`                         | lesson | Add `tour` stops to the `solar-calendar` topic.                                                                                                                                                                                |

`SceneComponent` props become `{ config, atmosphere, topicId, position }`.
Lesson 02 reuses `Lesson01Scene` behind the coming-soon guard; it just receives
the extra props (V2-10 unchanged).

### 2.4 Blueprint look

- **Material:** one shared `MeshBasicMaterial({ wireframe: true, color: gold,
transparent, opacity ≈ 0.7, toneMapped: false })`. Created once, disposed on
  unmount.
- **Edges alternative:** the pyramid has 4,964 triangles, so raw wireframe shows
  triangle diagonals. A single module constant switches to
  `EdgesGeometry(threshold ≈ 25°)` line segments over a black occluder fill.
  Both are judged on screen during implementation; keep whichever reads
  better, delete the other.
- **Floor:** 12,196 triangles across ~235 × 236 m → faint variant (opacity ≈
  0.12) or hidden if cluttered. **Trees:** not mounted.
- **Sky:** black background, no IBL, no sun — basic materials need no light.
  Nothing from `SceneEnvironment`'s PMREM caches is touched; its existing
  unmount cleanup runs on topic switch.

### 2.5 Types

```ts
export interface TourCameraPose {
  azimuth: number; // radians around +Y, measured from +Z toward +X; camera = target + r·(sin az·cos el, sin el, cos az·cos el). North (−Z) face-on = π
  elevation: number; // radians above the horizon
  radius: number; // metres from target
  target: [number, number, number];
}

export type TourEvidence = 'documented' | 'interpretation' | 'mixed'; // mixed = math documented, architectural link interpreted

export interface TourStop {
  id: string;
  label: string; // stepper / aria label
  camera: TourCameraPose;
  info: {
    headline: string;
    figure?: string; // "9", "4 × 91", "365", "52", "18,980 days"
    lines: string[];
    status: TourEvidence;
  };
}

export interface TourSample {
  eye: [number, number, number];
  target: [number, number, number];
  activeIndex: number; // nearest stop, 0-based
}

// LearningTopic gains:  tour?: TourStop[];
```

## 3. Tour content (from `lesson_01.md` only)

| #   | Label          | Camera intent                          | Figure      | Status                                    |
| --- | -------------- | -------------------------------------- | ----------- | ----------------------------------------- |
| 1   | El Castillo    | ¾ view from the NW (cinematic angle)   | —           | documented                                |
| 2   | Nine terraces  | low side profile, stepped silhouette   | 9           | documented                                |
| 3   | Four stairways | north face-on, low                     | 4 × 91      | documented                                |
| 4   | 364 + 1        | high top-down, four stairways in cross | 365         | interpretation                            |
| 5   | 52 panels      | face-on from one side                  | 52          | interpretation                            |
| 6   | Calendar Round | wide arc back to overview              | 18,980 days | mixed (documented math, interpreted link) |

Copy rules (from the vetted doc): stairs are "traditionally counted" at 91;
364 + platform is "interpreted as a symbolic representation" of the solar year;
52 panels "can be related to" the Calendar Round; the Calendar Round is when the
260-day Tzolk'in and 365-day Haab return to the **same combination of dates**
(never "realign" unqualified); builders' intentions "cannot always be
demonstrated archaeologically". An optional step 7 restating that caution is a
content decision for review.

Camera numbers (azimuth/elevation/radius/target) are **placeholders** until
tuned on screen. Reference geometry: pyramid base ≈ 74 × 76 m (x −37.7…36.0,
z −37.4…38.8), platform top ≈ 25.1 m, temple top ≈ 31.7 m, north = −Z, snake
heads at the north base (x 3…15, z −36…−29). Target ≈ (−0.9, 13, 0.7).

## 4. Validation & risks

No test framework exists (repo rule). Validation = `npm run typecheck`,
`npm run lint` (no new warnings), `npm run build`, and a manual `npm run dev`
pass:

- Serpent Descent unchanged: photoreal, slider centered, sky/IBL intact after
  switching to the tour and back (no black/invisible-mesh regression).
- Tour: 6 steps sweep smoothly, camera never takes the long way round, text and
  dots match the nearest step, reduced-motion jumps instead of sweeping.
- Deep link `?topic=solar-calendar&step=3` opens on step 3.
- `sampleTour` is pure and small; if a test runner is ever added it is the first
  candidate (clamping, wrap-around, empty input).

Risks / open items:

1. **Stairs may not be modeled as steps** (Pyramid.Base could be a ramp). Verify
   on screen first. If so, "91 steps" is carried by copy + camera framing, or a
   Blender re-export splits/steps the geometry — out of scope for v1.
2. **Wireframe legibility** — see edges alternative (2.4).
3. **Camera placeholders** need visual tuning; expect one iteration pass.
4. **Sky/IBL teardown on topic switch** relies on `SceneEnvironment`'s existing
   cleanup; verify no stale `scene.environment` leaks into the blueprint scene
   (it must not tint a basic material, but check `scene.background`).
5. **Docs:** update `docs/ARCHITECTURE.md` / `3D_ARCHITECTURE.md` (scene props,
   blueprint mode, `CameraTour`), and note that the "fixed camera" rule now
   applies per topic.
