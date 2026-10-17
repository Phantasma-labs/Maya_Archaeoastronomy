# Lesson 02 — "Watch the Sunrise" at Group E, Uaxactún — Design

Status: draft for review · Date: 2026-10-17 · Replaces the Caracol/Venus stub in `src/lessons/lesson02/`

## 1. Intent

Lesson 02 becomes a sunrise lesson about **Group E at Uaxactún** (Parque Arqueológico
Uaxactún, Petén, Guatemala). The audience is **elementary-school children**. It must be
playful (sliders, buttons, an immediate visual reward) and still a real lesson.

Success: a child can say, in their own words, _"The sunrise moves along the horizon during
the year, and the Maya built three buildings to mark where it rises on the longest day, the
shortest day and the equinoxes."_ They should also hear, once and gently, that scientists
still discuss how the buildings were used.

The single source for all lesson copy is the vetted
[`LearningMaterial/lesson_02.md`](../../../LearningMaterial/lesson_02.md). **No outside facts
are added**; kid-level wording is a simplification of that text, never an addition.

### Decisions already made by the product owner

- Scope: one experience, **"Watch the sunrise"**: a 3D view and a 2D plan view driven by
  **one slider** (ADR-001). No dig, builder puzzle or evidence-sorting game in this version.
- **Prediction step is in**: before exploring, the child guesses where the June sun will rise,
  then checks.
- **No audio** in this version.
- The alignment is shown **perfect**: the sun rises _over_ E-I (June solstice), E-II
  (equinoxes) and E-III (December solstice), as measured by Aveni & Hartung (1989) from just
  above the middle stairway of E-VII-sub. Šprajc's doubts stay in the learning material and
  appear in the lesson as at most one gentle line.
- Venus/Caracol content is dropped entirely.
- The 3D scene is built from `Uaxactun_v003.glb` (the full site layout).

### Non-goals (v1)

Audio/narration; free orbit controls; a dig or reveal of E-VII-sub inside E-VII; masks
close-up; seasons or agriculture wheel; translation (copy is English like Lesson 01);
changes to Lesson 01.

### Anti-goals (a failure even if it works)

- Copy that states the observatory interpretation as settled fact, or invents dates or
  rituals not in the learning material.
- A sun that visibly misses the temples at the key dates (the owner chose the perfect
  alignment; it must look exact).
- Breaking ADR-001 (a second scene-state store, `useFrame`, continuous rendering) or
  special-casing Lesson 02 in `pages/` or `core/`.

## 2. The experience

One screen, one topic. The camera is fixed on top of E-VII-sub, looking east across the plaza
at the long eastern platform and its three buildings, at dawn.

1. **Predict.** On entry the slider is locked and a prompt says (wording to be finalised from
   the learning material): _"On the longest day of the year, where will the Sun rise? Tap the
   horizon."_ The child taps a point on the eastern horizon in the **plan view**. A marker
   appears there and the slider unlocks. A small "skip" link unlocks without guessing.
2. **Watch.** The slider runs through **one solar year, December solstice → December
   solstice**. As it moves, the sun disc slides along the horizon in the 3D view, and a sun dot
   travels the same arc in the plan view. Dragging is free and the value stays where dropped.
   Step markers on the slider sweep to the key dates (existing ~0.6 s eased sweep).
3. **Lock-in.** At each key date, the matching building glows in 3D, its sightline lights up in
   the plan view, and a callout appears (date + one-line fact). At the June solstice the
   callout also compares the child's prediction with E-I ("Right on!" / "Close!" / "The Sun
   went further north than you thought!").
4. **One gentle evidence line**, always visible in the info panel: e.g. _"Scientists still
   discuss whether Group E was used to watch the sky or as a stage for ceremonies."_

Key dates (modern calendar; slider steps):

| Step | Date              | Building | Callout headline              |
| ---- | ----------------- | -------- | ----------------------------- |
| 1    | Dec 21 (previous) | E-III    | December solstice: shortest day |
| 2    | Mar 20            | E-II     | Equinox: day and night equal  |
| 3    | Jun 21            | E-I      | June solstice: longest day    |
| 4    | Sep 22            | E-II     | Equinox again                 |
| 5    | Dec 21            | E-III    | Back to the shortest day      |

## 3. Astronomy (pure, calculated)

- Latitude φ = 17.394° N (Uaxactún). Flat horizon, no refraction.
- Slider position p ∈ [1, 5] → day offset: linear within each segment between the key dates
  above (segment lengths 89, 93, 93, 90 days).
- Solar declination for a day: the usual cosine approximation with amplitude 23.44°, phased
  so that the key dates return exactly −23.44°, 0, +23.44°, 0, −23.44°. Builder's choice of
  formula, as long as those five values are exact. That exactness is what makes the lock-ins
  pixel-perfect.
- Sunrise azimuth A = arccos(sin δ / cos φ): **65.36° (June), 90° (equinox), 114.64°
  (December)**, measured from north through east.
- Lives in a pure core util (e.g. `core/utils/sunrise.ts`): `sunriseAzimuth(dayOfYear,
  latitude)` plus a lesson-side mapping from slider position to day. Pure, unit-free,
  no React.

## 4. Scene geometry and the asset contract

Inspection of `Uaxactun_v003.glb` (glTF Y-up, metres):

- E-VII-sub (two `RetopoFlow` halves + details): x −65.8…−38.0, z −13.8…13.9, top ≈ y 9.9.
- Eastern platform (`Plaza_Floor.004`): x 15.6…53.7, z −41.5…42.9 (≈ 84 m north–south).
- Other plaza structures, ground plane, ~47 instanced trees.
- **East = +X.** **North = −Z** in glTF (confirmed 2026-10-17 in `layout_v003.blend`: Blender
  +Y, the top of the top view, is north; the glTF exporter maps Blender +Y → −Z).
- The three buildings **E-I, E-II, E-III do not exist as separate meshes yet.**

**Observer point (fixed now, so assets can be modelled to it):** the sightlines start at
**(x −40, z 0)**, above the middle (east) stairway of E-VII-sub. The camera eye sits there at
eye height above the pyramid top (y ≈ 11.5). The builder may tune the camera's height, field
of view and pitch for framing, but **not its x/z**: the buildings are placed relative to it.

**Asset contract for the owner (Blender), for the perfect alignment:**

- The three buildings are **not in v003** (the eastern platform is a single block). They are
  modelled new (or adapted from the `EastTemple` retopo work) and added on top of the platform
  as **separately named nodes `E-I`, `E-II`, `E-III`**, so the scene can make each one glow.
- Building centres (ground plane, metres, assuming north = −Z), on a line x = 35:
  - **E-I: (35, −34.4)**, bearing 65.36° (24.64° north of east)
  - **E-II: (35, 0)**, bearing 90° (due east)
  - **E-III: (35, +34.4)**, bearing 114.64° (24.64° south of east)
  If the platform's centre line ends up at a different x, keep z = −(x + 40)·tan 24.64° for
  E-I and the mirror for E-III.
  **In Blender coordinates (X, Y; Z up) the same points are E-I (35, +34.4), E-II (35, 0),
  E-III (35, −34.4)**, with the observer at (−40, 0).
- Working files live in `L:\Projects\EDU\Maya_Archaeoastronomy\working-assets\lesson-02-sky-atlas\`
  (source: `3d-assets\blender-source\layout_v003.blend`). Who makes each asset is decided as
  the work proceeds: likely Magnific generation plus the owner's retopology.
- Export as `public/assets/lesson_02/Lesson02_Site_v001.glb` (Draco, WebP textures as today).
  Trees may stay in the same file or be split, matching Lesson 01's separate-trees pattern.
  Builder's call with the owner.
- **A dawn sky:** at least one 2048×1024 LDR WebP equirect with the eastern horizon in
  pre-sunrise light, `public/assets/lesson_02/dawn_v001.webp`. The **sun is not painted into
  the sky**; it is a scene object, so it can move.
- A new **landing thumbnail** for Group E (the current `lesson-02-thumb.webp` was made for
  the Caracol).

The visible sun is a scene object (an emissive disc or sprite with a soft glow) placed on the
horizon at azimuth A, just above the horizon line. The directional light's azimuth follows the
same A at a low dawn elevation, so the shadows agree with the disc.

## 5. Architecture

All of it follows the existing layering `pages → lessons → core` and ADR-001.

### 5.1 State and data flow

- `sliderPosition` (LessonPage) stays the **only scene runtime value**. From it are derived:
  date → declination → sunrise azimuth → sun-disc position, light direction, active key date,
  which building glows. Nothing is stored.
- The topic owns a `skyTimeline` of **5 keyframes** (one per key date). That gives the
  existing slider, step markers, sweep, `?step=` deep links and topic reset for free. All five
  can point at the same dawn sky URL. `lightRotation` on keyframes is ignored by Lesson 02's
  scene in favour of the calculated sun (see 5.3), or holds precomputed values. The builder
  picks whichever is the smaller change, keeping a single source of truth for the sun direction.
- The **prediction marker** (an azimuth or `null`) is **overlay-local UI state**, like
  Lesson 01's `activePanel`. It never enters the scene; it is drawn only in the 2D plan view
  and read by the June callout. Not persisted, and it resets on reload. The slider is locked
  while it is `null` and "skip" was not pressed.

### 5.2 New / changed units

| Unit                                      | Layer  | Change |
| ----------------------------------------- | ------ | ------ |
| `core/utils/sunrise.ts`                   | core   | New pure astronomy helpers (§3). |
| `lessons/lesson02/config.ts`              | lesson | Rewritten: Group E title/subtitle/tagline, `difficulty: 'Introductory'`, models, dawn sky, camera, one topic with the 5-keyframe timeline and callouts from the learning material. `status` stays `'coming-soon'` until the assets land, then `'available'`. |
| `lessons/lesson02/Lesson02Scene.tsx`      | lesson | New. Site model, environment, lighting, fixed camera, `SunDisc`, building glow. |
| `lessons/lesson02/SunDisc.tsx` (+ glow)   | lesson | New. Positions the sun from the derived azimuth via refs in a dependency-guarded effect (no `useFrame`). |
| `lessons/lesson02/Lesson02Overlay.tsx`    | lesson | New. Info panel, prediction prompt, slider (core `AtmosphereTimeline` or a themed lesson slider like `SerpentSlider`), callouts, plan view. |
| `lessons/lesson02/PlanView.tsx`           | lesson | New. SVG mini-map (§5.4). |
| `lessons/registry.ts`                     | lessons | Lazy-load `Lesson02Scene` / `Lesson02Overlay` (same pattern as Lesson 01). |
| `pages/LessonPage.tsx`                    | pages  | Ideally untouched. Its initial-topic fallback looks for `'serpent-descent'` then `topics[0]`, so a one-topic Lesson 02 works as is. |
| `core/*`                                  | core   | Only additions that are lesson-agnostic (e.g. `sunrise.ts`). No Lesson 02 special cases. |

### 5.3 Scene details

- Reuse `ModelLoader` (keeps the vertex-colour guard; the plaza meshes carry `COLOR_0`),
  `SceneEnvironment`, `SceneLighting`, `FixedGlbCamera`/`CameraTour` as fits.
- One directional light + IBL only (no ambient or hemisphere lights).
- **Glow:** the building for the active key date gets an emissive tint while the slider is
  within ±3 days of that date. Done by mutating a **cloned** material via ref; cached GLTF
  materials are never mutated.
- `frameloop="demand"` stays; every derived change invalidates once.

### 5.4 Plan view (2D, overlay)

A small top-down SVG panel, placed like a mini-map (corner of the 1280×720 design space):

- Schematic footprints: E-VII-sub (west), the platform and E-I/E-II/E-III (east), labelled.
  North arrow, with north at the top.
- Three faint sightline rays from the observer point to E-I, E-II, E-III; the active one
  brightens at lock-in.
- An eastern horizon arc with the sun dot at the current azimuth. Optionally, a faint trail
  showing the full yearly swing.
- The child's prediction marker (tap or click on the arc during the Predict step;
  keyboard-accessible alternative: arrow keys move a cursor along the arc and Enter places it).
  The tappable arc spans **30°–150°**, wider than the real 65°–115° swing, so a guess can be
  clearly wrong.
- **Judging the guess** against E-I (65.36°): within **±5°** → "Right on!"; within **±15°** →
  "Close!"; further south → "The Sun went further north than you thought!"; further north →
  "The Sun didn't go quite that far north!". Final strings go through the owner's copy review.
- **Deep links:** when the page is opened with `?step=`, the prediction step is skipped (the
  link exists to show a state). The overlay reads the router's search params itself, and
  `LessonPage` is not changed.
- The azimuth → SVG mapping uses the same `sunrise.ts` numbers, so the 2D and 3D views
  always agree.

### 5.5 Phasing (decided)

- Work happens on a feature branch. Code is built **now against `Uaxactun_v003.glb`**, with
  **stand-in boxes for E-I/E-II/E-III placed from config** at the coordinates in §4, so the
  lesson can be developed and checked before the final asset exists. On the branch the
  lesson is `'available'`; it merges to main only once the real site GLB and dawn sky land
  and the stand-ins are removed.
- A temporary sky (e.g. the existing Lesson 01 `01.webp`) is allowed on the branch until
  the dawn sky exists. It is never merged.

## 6. Copy

- All strings come from the learning material, rewritten for ~8–11-year-olds: short
  sentences, one idea each. A draft copy table (headline, sublabel, 1–3 lines per key date,
  the prediction prompt and results, the evidence line, intro card) goes into `config.ts`
  and is **reviewed by the owner before shipping**.
- Lesson-level `content` (overview, `archaeologicalNotes`) is rewritten from the learning
  material at an adult level, matching Lesson 01's catalogue tone.

## 7. Validation

No test suite exists. The builder runs `npm run typecheck`, `npm run lint` and
`npm run build`, then checks in `npm run dev`:

- At each of the 5 steps the sun disc sits visually centred over the right building, and
  the plan-view ray lines up.
- Dragging between steps moves the sun smoothly. The swing slows near the solstices (it
  should "pause" there), and the equinox passes quickly.
- Prediction lock and skip work, and the June comparison message matches where the marker
  was placed.
- Lesson 01 is unchanged; the landing page still doesn't load the 3D stack (lazy chunks).

`sunrise.ts` gets a quick check (a scratch script or a dev-only assert) that the five key
dates give 114.64°, 90°, 65.36°, 90°, 114.64°.

## 8. Left to the builder

The slider's look (plain core slider vs. a themed "sun path" slider); the sun-disc
implementation; the glow technique; the exact plan-view layout; whether the keyframes carry
precomputed `lightRotation` or the scene ignores it; whether trees are split into their own
GLB; the exact observer point (within "above the middle stairway of E-VII-sub").
