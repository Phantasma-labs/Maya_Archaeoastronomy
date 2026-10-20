# Lesson 02 "Watch the Sunrise" (Uaxactún Group E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status 2026-10-20:** Tasks 0–7 done (checkboxes below were not ticked). Task 8 is partial: `dawn_v001.webp` and the new thumbnail are in; the final site GLB, `BuildingGlow`/`onReady`, sky re-tune and owner copy review remain. Live state: `docs/HANDOVER.md`.

**Goal:** Replace the Caracol/Venus stub with a playful kids' lesson in which one day-of-year slider moves the sunrise along the horizon at Group E, Uaxactún, lighting up E-III / E-II / E-I at the solstices and equinoxes, with a prediction step and a 2D plan view.

**Architecture:** All astronomy is pure derivation from `sliderPosition` (ADR-001). A core util gives the sunrise azimuth, and a lesson util maps slider position → date → declination → azimuth, plus key-date and prediction logic. `Lesson02Scene` places a sun disc, the directional light and stand-in buildings from those numbers. `Lesson02Overlay` holds the only extra state, the prediction (overlay-local UI state), and renders the slider, the callouts and an SVG plan view. Lesson 02 is wired through the registry's lazy imports; `pages/` and the existing core components are unchanged.

**Tech Stack:** React 18, TypeScript (strict), three 0.174 / @react-three/fiber 8 / drei 9, Tailwind, Vite 6, Node 24 (runs `.ts` check scripts directly).

**Spec:** [`docs/superpowers/specs/2026-10-17-lesson02-uaxactun-sunrise-design.md`](../specs/2026-10-17-lesson02-uaxactun-sunrise-design.md). Copy source: [`LearningMaterial/lesson_02.md`](../../../LearningMaterial/lesson_02.md).

## Global Constraints

- Branch `feature/lesson02-uaxactun-sunrise`. Nothing merges to `main` until Task 8 (real assets) is done.
- ADR-001: `sliderPosition` is the only scene runtime value. No `useFrame`, `frameloop="demand"` unchanged, no store library; mutate three objects via refs in dependency-guarded effects and `invalidate()`.
- Layering `pages → lessons → core`. `core/` never imports `lessons/` or `pages/`. No Lesson 02 special cases in `pages/` or `core/`.
- One directional light + IBL only. Keep the `ModelLoader` vertex-colour guard. Never mutate cached GLTF materials.
- `strict`, no `any`, no non-null assertions in new code. No new dependencies.
- Validation per task: `npm run typecheck` and `npm run lint` (baseline: 0 errors, 3 pre-existing warnings), plus `node scripts/check-sunrise.ts` once it exists. No test runner is added.
- Modules imported by `scripts/check-sunrise.ts` must be Node-runnable: relative imports carry the `.ts` extension, and type-only imports use `import type`.
- Copy: English, for ~8–11-year-olds, only simplifications of `LearningMaterial/lesson_02.md`, with no new facts. The alignment is shown **perfect** ("over" E-I/E-II/E-III). Exactly one gentle evidence line.
- Latitude **17.394° N**; key azimuths **114.64° / 90° / 65.36° / 90° / 114.64°**; observer at **world (x −40, z 0)**; buildings at **E-I (35, −34.4), E-II (35, 0), E-III (35, +34.4)** in world x/z; north = −Z, east = +X.
- No audio.

## Review Focus

1. **The overlay is CSS-scaled** (`ViewportScaler`): plan-view taps must convert pointer → SVG units with `getScreenCTM().inverse()`, never with raw `clientX` arithmetic, or guesses land in the wrong place at any viewport but 1280×720. _Pinned in Task 5, step 3 (manual check at two window sizes)._
2. **Prediction outside the tappable arc**: taps or keys beyond 30°–150° must clamp to the arc, not produce NaN or wrap. _Pinned by `clampPredictionDeg` asserts in Task 2._
3. **Out-of-range and non-finite slider positions** (0, 6, NaN, mid-sweep 4.999) must give a valid date, azimuth and key-date result. _Pinned by asserts in Task 2._
4. **The sun disc must stay inside the 500 m skydome and in front of the far plane**; a disc at the wrong distance vanishes silently. _Pinned in Task 3, step 4 (manual check at every key date)._
5. **`?step=` deep links** must skip the prediction lock instead of showing the answer behind a locked prompt. _Pinned in Task 6, step 4 (manual check of `/lesson/02?step=3`)._

---

### Task 0: Branch and source material

**Files:**
- Add (already on disk, uncommitted): `LearningMaterial/lesson_02.md`, `LearningMaterial/Archaeoastronomy_in_the_Ancient_Americas.pdf`, `docs/superpowers/specs/2026-10-17-lesson02-uaxactun-sunrise-design.md`, this plan.

- [ ] **Step 1:** `git checkout -b feature/lesson02-uaxactun-sunrise` from `main`.
- [ ] **Step 2: Commit**

```bash
git add LearningMaterial/lesson_02.md LearningMaterial/Archaeoastronomy_in_the_Ancient_Americas.pdf docs/superpowers/specs/2026-10-17-lesson02-uaxactun-sunrise-design.md docs/superpowers/plans/2026-10-17-lesson02-uaxactun-sunrise.md
git commit -m "docs(lesson02): Uaxactún Group E learning material, design and plan"
```

---

### Task 1: Core sunrise astronomy

**Files:**
- Create: `src/core/utils/sunrise.ts`
- Create: `scripts/check-sunrise.ts`

**Interfaces:**
- Produces:
  - `sunriseAzimuthDeg(declinationDeg: number, latitudeDeg: number): number`: arccos(sin δ / cos φ) in degrees, measured from north through east, flat horizon, no refraction. Clamp the arccos argument to [−1, 1].
  - `sunDirection(azimuthDeg: number, elevationDeg: number): [number, number, number]`: unit vector in this repo's world frame (east +X, up +Y, north −Z): `(sin A·cos e, sin e, −cos A·cos e)`.
  - `sunLightRotation(azimuthDeg: number, elevationDeg: number): [number, number, number]`: Euler for `SceneLighting` (order `'YXZ'`, which rotates `(0,1,0)`), equal to `[π/2 − e, π − A, 0]` in radians. Derivation: Rx then Ry of (0,1,0) gives (sinθ sinφ, cosθ, sinθ cosφ).

- [ ] **Step 1: Write the check script** `scripts/check-sunrise.ts` (same header style as `scripts/check-tour.ts`), using `node:assert/strict` and `import { … } from '../src/core/utils/sunrise.ts'`:

```ts
const near = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
near(sunriseAzimuthDeg(23.44, 17.394), 65.36);
near(sunriseAzimuthDeg(0, 17.394), 90);
near(sunriseAzimuthDeg(-23.44, 17.394), 114.64);
// direction: due east on the horizon → +X
const d = sunDirection(90, 0); near(d[0], 1); near(d[1], 0); near(d[2], 0);
// north-east at 65.36° → x>0, z<0 (north is −Z)
const ne = sunDirection(65.36, 0); assert.ok(ne[0] > 0 && ne[2] < 0);
// sunLightRotation agrees with sunDirection when applied YXZ to (0,1,0)
for (const [a, e] of [[65.36, 5], [90, 5], [114.64, 5]]) {
  const v = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(...sunLightRotation(a, e), 'YXZ'));
  const s = sunDirection(a, e); near(v.x, s[0]); near(v.y, s[1]); near(v.z, s[2]);
}
console.log('check-sunrise: core OK');
```

- [ ] **Step 2:** Run `node scripts/check-sunrise.ts`. Expected: it fails because the module is not found.
- [ ] **Step 3:** Implement the three functions in `src/core/utils/sunrise.ts`. No imports, with JSDoc stating units and the frame, in the style of `core/utils/tour.ts`.
- [ ] **Step 4:** Run `node scripts/check-sunrise.ts` (expected `check-sunrise: core OK`), then `npm run typecheck` and `npm run lint` (expected: no new errors or warnings).
- [ ] **Step 5: Commit:** `feat(core): pure sunrise azimuth + sun direction helpers`.

---

### Task 2: Lesson 02 sun path, site data and prediction logic

**Files:**
- Create: `src/lessons/lesson02/site.ts`
- Create: `src/lessons/lesson02/sunPath.ts`
- Modify: `scripts/check-sunrise.ts` (append the lesson asserts)

**Interfaces:**
- Consumes: Task 1 `sunriseAzimuthDeg`.
- Produces (`site.ts`, lesson-owned geometry; the spec's "recorded in config"):

```ts
export const LATITUDE_DEG = 17.394;
export const OBSERVER_XZ: [number, number] = [-40, 0];
export type BuildingId = 'E-I' | 'E-II' | 'E-III';
export const BUILDINGS: { id: BuildingId; xz: [number, number] }[] =
  [{ id: 'E-I', xz: [35, -34.4] }, { id: 'E-II', xz: [35, 0] }, { id: 'E-III', xz: [35, 34.4] }];
```

- Produces (`sunPath.ts`):
  - `KEY_DATES: { dayOfYear: number; label: string; building: BuildingId }[]` = `[{-11,'Dec 21','E-III'}, {78,'Mar 20','E-II'}, {171,'Jun 21','E-I'}, {264,'Sep 22','E-II'}, {354,'Dec 21','E-III'}]` (day 0 = Jan 1, non-leap reference year; step i+1 ↔ index i).
  - `positionToDay(position: number): number`: clamp to [1, 5] (NaN → 1), then linear within the segment between adjacent `KEY_DATES` (segments 89/93/93/90 days).
  - `positionToDeclinationDeg(position: number): number`: with p clamped, segment k = min(floor(p) − 1, 3), t = p − (k + 1); phase = −90° + 90°·(k + t); return `23.44 · sin(phase)`. This makes all five key positions exact (−23.44, 0, 23.44, 0, −23.44).
  - `positionToAzimuthDeg(position: number): number`, using `sunriseAzimuthDeg(…, LATITUDE_DEG)`.
  - `dateLabel(dayOfYear: number): string`, e.g. `'Jun 21'` (wrap negative days into the previous year; use `Date.UTC(2026, 0, 1 + day)` and English month abbreviations, no locale dependency).
  - `activeKeyDate(position: number, toleranceDays = 3): number | null`: index into `KEY_DATES` whose day lies within ±tolerance of `positionToDay(position)`, else `null`.
  - `PREDICTION_ARC_DEG: [number, number] = [30, 150]`; `clampPredictionDeg(az: number): number` (clamp to the arc; NaN → 90).
  - `type PredictionResult = 'right-on' | 'close' | 'too-south' | 'too-north'`; `judgePrediction(guessDeg: number): PredictionResult` against 65.36°: |Δ| ≤ 5 → right-on; ≤ 15 → close; guess > target → too-south; otherwise too-north.

- [ ] **Step 1: Append asserts** to `scripts/check-sunrise.ts` (import from `../src/lessons/lesson02/sunPath.ts`):

```ts
[1, 2, 3, 4, 5].forEach((p, i) => near(positionToAzimuthDeg(p), [114.64, 90, 65.36, 90, 114.64][i]));
near(positionToDay(1), -11); near(positionToDay(3), 171); near(positionToDay(2.5), 78 + 46.5);
// range safety (Review Focus 3)
near(positionToDay(0), -11); near(positionToDay(6), 354); near(positionToDay(NaN), -11);
assert.ok(Number.isFinite(positionToAzimuthDeg(4.999)));
// monotone swing: Dec→Jun northward (azimuth falls), Jun→Dec southward
assert.ok(positionToAzimuthDeg(2.5) < positionToAzimuthDeg(2) && positionToAzimuthDeg(3.5) > positionToAzimuthDeg(3));
assert.equal(dateLabel(171), 'Jun 21'); assert.equal(dateLabel(-11), 'Dec 21'); assert.equal(dateLabel(264), 'Sep 22');
assert.equal(activeKeyDate(3), 2); assert.equal(activeKeyDate(2.5), null);
assert.equal(activeKeyDate(3 + 3 / 93), 2); assert.equal(activeKeyDate(3 + 4 / 93), null);
// prediction (Review Focus 2)
assert.equal(clampPredictionDeg(10), 30); assert.equal(clampPredictionDeg(170), 150); assert.equal(clampPredictionDeg(NaN), 90);
assert.equal(judgePrediction(68), 'right-on'); assert.equal(judgePrediction(78), 'close');
assert.equal(judgePrediction(100), 'too-south'); assert.equal(judgePrediction(40), 'too-north');
// buildings sit exactly on the key bearings from the observer
for (const [id, az] of [['E-I', 65.36], ['E-II', 90], ['E-III', 114.64]] as const) {
  const b = BUILDINGS.find((x) => x.id === id); assert.ok(b);
  const dx = b.xz[0] - OBSERVER_XZ[0], dz = b.xz[1] - OBSERVER_XZ[1];
  near((Math.atan2(dx, -dz) * 180) / Math.PI, az, 0.1);
}
console.log('check-sunrise: lesson02 OK');
```

- [ ] **Step 2:** Run `node scripts/check-sunrise.ts`. Expected: it fails because the modules are not found.
- [ ] **Step 3:** Implement `site.ts` and `sunPath.ts` to the interfaces above.
- [ ] **Step 4:** Run `node scripts/check-sunrise.ts` (both OK lines), then `npm run typecheck` and `npm run lint`.
- [ ] **Step 5: Commit:** `feat(lesson02): sun path, site geometry and prediction logic`.

---

### Task 3: Config rewrite + Lesson02Scene (3D, stand-ins)

**Files:**
- Copy: `L:\Projects\EDU\Maya_Archaeoastronomy\working-assets\lesson-02-sky-atlas\3d-assets\blender-models\GLB\Uaxactun_v003.glb` → `public/assets/lesson_02/Uaxactun_v003.glb`
- Rewrite: `src/lessons/lesson02/config.ts`
- Create: `src/lessons/lesson02/Lesson02Scene.tsx`, `src/lessons/lesson02/SunDisc.tsx`, `src/lessons/lesson02/StandInBuildings.tsx`
- Modify: `src/lessons/registry.ts` (lazy `Lesson02Scene`, like Lesson 01)

**Interfaces:**
- Consumes: Task 1 `sunDirection`, `sunLightRotation`; Task 2 `positionToAzimuthDeg`, `activeKeyDate`, `KEY_DATES`, `BUILDINGS`, `OBSERVER_XZ`.
- Produces:
  - Config, with exact values:
    - `title: 'Group E at Uaxactún: Watching the Sunrise'`; `subtitle: 'Parque Arqueológico Uaxactún, Petén, Guatemala'`.
    - `status: 'available'` (branch only); `difficulty: 'Introductory'`.
    - One model `{ id: 'site', url: '/assets/lesson_02/Uaxactun_v003.glb', castShadow: true, receiveShadow: true }`.
    - `camera: { position: [-40, 11.5, 0], rotation: [0, -Math.PI / 2, 0], fov: 50, near: 0.1, far: 1000 }` (looks due east; the builder may tune pitch, height and fov but not x/z).
    - One topic `{ id: 'watch-sunrise', … }` whose `skyTimeline` has 5 keyframes, one per `KEY_DATES` entry. Every keyframe uses `url: '/assets/lesson_01/01.webp'` (temporary, branch only), `lightRotation: sunLightRotation(az_i, SUN_ELEVATION_DEG)`, `meta.dateLabel` = the key-date label, and `callout` = kid copy (Task 6 finalises the strings).
    - `content` rewritten at adult level from the learning material.
  - `SUN_ELEVATION_DEG = 4` (exported from `sunPath.ts`; the disc and the light both use it).
  - `Lesson02Scene` props: same as the registry's `SceneComponent` props (`config, atmosphere, topicId, position`).
  - `SunDisc` props `{ azimuthDeg: number; elevationDeg: number }`: an emissive disc (or sprite) with soft glow, placed at `observer + 300 · sunDirection(…)` (observer y = 11.5) and facing the observer. Its position is set in a `useLayoutEffect` on `[azimuthDeg, elevationDeg]` via ref, followed by `invalidate()`.
  - `StandInBuildings` props `{ activeId: BuildingId | null }`: a 10 × 8 × 10 m box per `BUILDINGS` entry on the platform top (y ≈ 4.5), with its own `MeshStandardMaterial` each. The active one gets an emissive gold tint (set via ref in an effect on `[activeId]`).

- [ ] **Step 1:** Copy the GLB; rewrite `config.ts`; add `SUN_ELEVATION_DEG` to `sunPath.ts`.
- [ ] **Step 2:** Implement `SunDisc`, `StandInBuildings`, `Lesson02Scene`. The scene composes `FixedGlbCamera`, `SceneEnvironment`, `SceneLighting` (rotation = `sunLightRotation(positionToAzimuthDeg(position), SUN_ELEVATION_DEG)`, **not** `atmosphere.lightRotation`), `ModelLoader` (site), `SunDisc`, `StandInBuildings` (`activeId` = `KEY_DATES[activeKeyDate(position)]?.building ?? null`). Preload the GLB at module scope like Lesson 01.
- [ ] **Step 3:** Register the lazy scene in `registry.ts`. Leave `OverlayComponent` undefined for now.
- [ ] **Step 4: Manual check** (Review Focus 4): `npm run dev` → `/lesson/02?step=1` … `?step=5`. At each step the sun disc is visible, sits just above the horizon, and is centred over the right stand-in (1 & 5 → E-III south/right, 2 & 4 → E-II, 3 → E-I north/left), and that stand-in glows. Shadows fall away from the sun. Lesson 01 is unchanged.
- [ ] **Step 5:** `npm run typecheck`, `npm run lint`, `npm run build`. Expected: all pass, and the build output shows the lesson02 scene in its own lazy chunk.
- [ ] **Step 6: Commit:** `feat(lesson02): Group E scene with sun disc and stand-in buildings`.

---

### Task 4: Plan view (2D SVG)

**Files:**
- Create: `src/lessons/lesson02/PlanView.tsx`

**Interfaces:**
- Consumes: Task 2 `BUILDINGS`, `OBSERVER_XZ`, `PREDICTION_ARC_DEG`, `clampPredictionDeg`, `positionToAzimuthDeg`.
- Produces: `PlanView` props:

```ts
{ azimuthDeg: number; activeId: BuildingId | null; prediction: number | null;
  predicting: boolean; onPredict: (azimuthDeg: number) => void }
```

  - North is up. World x/z map to SVG with a fixed scale; the observer is at the left.
  - It draws: footprints of E-VII-sub, the platform and the three buildings (labelled); three faint rays from the observer (the active one bright); the horizon arc over `PREDICTION_ARC_DEG` centred on the observer; the real 65°–115° band as a subtle highlight; the sun dot at `azimuthDeg`; the prediction marker if set; a north arrow.
  - Azimuth on the SVG: point = observer + R·(sin A, −cos A) in (x-right, y-down) SVG space. This is the same frame as world x/z, so 3D and 2D agree.
  - While `predicting`: clicking the arc calls `onPredict(clampPredictionDeg(az))`, where az comes from the pointer converted with `svg.getScreenCTM()?.inverse()` (Review Focus 1). A keyboard cursor works too: the arc is focusable, ←/→ move it by 2° within the arc, and Enter calls `onPredict`.

- [ ] **Step 1:** Implement `PlanView`, with an `aria-label` describing the map and the current sun direction.
- [ ] **Step 2:** `npm run typecheck`, `npm run lint`.
- [ ] **Step 3: Commit:** `feat(lesson02): 2D plan view with sightlines and prediction arc`.

(It is exercised visually in Task 5.)

---

### Task 5: Lesson02Overlay: slider, callouts, prediction flow

**Files:**
- Create: `src/lessons/lesson02/Lesson02Overlay.tsx`
- Modify: `src/lessons/registry.ts` (lazy `Lesson02Overlay`)

**Interfaces:**
- Consumes: the registry `OverlayComponent` props; Task 2 helpers; Task 4 `PlanView`; core `AtmosphereTimeline`.
- Produces: overlay-local state only:

```ts
type Phase = 'predicting' | 'exploring';
const [phase, setPhase] = useState<Phase>(() => (searchParams.has('step') ? 'exploring' : 'predicting'));
const [prediction, setPrediction] = useState<number | null>(null);
```

  `searchParams` comes from `useSearchParams()` (react-router), read once for the initial state (Review Focus 5).

Layout, in the 1280×720 design space and visually consistent with Lesson 01 (same Tailwind tokens, Home link top-left):
- **Info panel** (left): lesson title, a one-sentence intro, the always-visible evidence line.
- **Plan view** (bottom-right corner, mini-map size).
- **Bottom bar:**
  - `predicting`: the prompt plus a "Skip" text button. No slider. Placing a guess sets `prediction` and switches to `exploring`.
  - `exploring`: `AtmosphereTimeline` (`keyframes = skyTimeline`, `value = sliderPosition`, `onLiveChange = onSliderPositionChange`, `onStepSelect`), plus a row of 5 date buttons (`KEY_DATES` labels) calling `onStepSelect(i + 1)`, plus the live `dateLabel(positionToDay(sliderPosition))`.
- **Callout** (above the bar) while `activeKeyDate(sliderPosition) !== null`: that keyframe's `callout.label` / `lines`. At index 2 (June), if `prediction !== null`, add the `judgePrediction(prediction)` message.

- [ ] **Step 1:** Implement the overlay and register it lazily.
- [ ] **Step 2:** `npm run typecheck`, `npm run lint`.
- [ ] **Step 3: Manual check:**
  - Fresh `/lesson/02` shows the prompt with no slider.
  - Tapping the arc places a marker and reveals the slider. Dragging to Jun 21 shows the June callout plus the right verdict. Try a guess at ~68°, ~80°, ~100° and ~40°: each gives its own message.
  - Skip works without a verdict.
  - Repeat with the window resized to a non-16:9 size: the marker lands where tapped (Review Focus 1).
  - Keyboard-only: Tab to the arc, use arrows and Enter, then Tab to the slider and use arrows.
- [ ] **Step 4: Commit:** `feat(lesson02): overlay with prediction flow, slider and callouts`.

---

### Task 6: Kid copy from the learning material

**Files:**
- Modify: `src/lessons/lesson02/config.ts` (keyframe callouts, topic summary/details, lesson `content`)
- Modify: `src/lessons/lesson02/Lesson02Overlay.tsx` (prompt, verdict strings, evidence line, intro), or move those strings into config if the overlay already reads them from there.

- [ ] **Step 1:** Write all strings as simplifications of `LearningMaterial/lesson_02.md`: short sentences, one idea each, no new facts.
  - Callout headlines: "December solstice: shortest day", "Equinox: day and night equal", "June solstice: longest day", "Equinox again", "Back to the shortest day".
  - Each callout has 1–3 lines naming the building the Sun rises over.
  - Prompt: "On the longest day of the year, where will the Sun rise? Tap the horizon."
  - Verdicts: right-on "Right on!"; close "Close!"; too-south "The Sun went further north than you thought!"; too-north "The Sun didn't go quite that far north!".
  - Evidence line: "Scientists still discuss whether Group E was used to watch the sky or as a stage for ceremonies."
- [ ] **Step 2:** Put the full string list in the commit body for the owner's copy review.
- [ ] **Step 3:** `npm run typecheck`, `npm run lint`, then a quick visual pass in `npm run dev`.
- [ ] **Step 4: Commit:** `content(lesson02): kid-level copy from vetted learning material`.
- [ ] **Step 5: Owner gate.** The owner reviews the copy; apply edits before Task 7.

---

### Task 7: Branch verification

- [ ] **Step 1:** `node scripts/check-sunrise.ts`, `npm run typecheck`, `npm run lint`, `npm run build`. All must pass.
- [ ] **Step 2: Manual check in `npm run dev`:**
  - Every item of spec §7.
  - Lesson 01 unchanged in both topics.
  - Landing page network tab: no three/drei chunk and no GLB requested before opening a lesson.
- [ ] **Step 3:** Update `docs/ROADMAP.md` / `docs/PROJECT.md` status lines to say Lesson 02 is in progress on this branch, and that the Caracol stub was replaced by Uaxactún Group E. Commit: `docs: Lesson 02 status`.
- [ ] **Step 4:** Push the branch. Do **not** merge (blocked on Task 8).

---

### Task 8: Swap in final assets (blocked on the owner's assets)

Starts when the owner delivers `Lesson02_Site_v001.glb` (with nodes `E-I`, `E-II`, `E-III` at the spec §4 positions), `dawn_v001.webp`, and a new `lesson-02-thumb.webp`.

**Files:**
- Add: `public/assets/lesson_02/Lesson02_Site_v001.glb`, `public/assets/lesson_02/dawn_v001.webp`; replace `public/assets/landing/lesson-02-thumb.webp`
- Delete: `public/assets/lesson_02/Uaxactun_v003.glb`, `src/lessons/lesson02/StandInBuildings.tsx`
- Modify: `src/core/components/ModelLoader.tsx`: optional prop `onReady?: (root: THREE.Object3D) => void`, called once with the **clone** after setup (lesson-agnostic). The vertex-colour guard is untouched.
- Create: `src/lessons/lesson02/BuildingGlow.ts`: given the clone and `activeId`, finds the nodes by name, gives each target mesh its own cloned material once, and sets the emissive tint on the active one.
- Modify: `config.ts` (model URL, sky URLs), `Lesson02Scene.tsx` (glow on real nodes)

- [ ] **Step 1:** In the new GLB, verify that the `E-I` / `E-II` / `E-III` node centres match `BUILDINGS` within 0.5 m. If not, return the coordinates to the owner rather than editing `site.ts`.
- [ ] **Step 2:** Implement the `ModelLoader.onReady` prop and `BuildingGlow`; remove the stand-ins; switch the URLs.
- [ ] **Step 3:** Repeat the Task 3 step 4 and Task 7 checks; also confirm that no GLB/sky/thumbnail is orphaned (each is referenced by config).
  - (a) Re-tune the environment `scale` / `panY` / `rotation` in config for the dawn sky; it currently uses Lesson 01's horizon framing.
  - (b) `SunDisc` renders with depthTest=false (Ruling 7): visually confirm the disc never paints over the real E-I/E-II/E-III geometry (roof combs). If it does, lower `SUN_ELEVATION_DEG` or switch to depth-tested rendering with renderOrder.
- [ ] **Step 4: Commit** `feat(lesson02): final Group E site, dawn sky and thumbnail`, then use superpowers:finishing-a-development-branch to merge.
