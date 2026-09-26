# 3D ARCHITECTURE

## Render pipeline (R3F)

`SceneCanvas` creates the `<Canvas>` with: `shadows`, `dpr=[1,2]`,
`gl={ antialias: true, toneMapping: ACESFilmic, toneMappingExposure: 1.05,
powerPreference: 'high-performance' }`. No post-processing. Camera props are passed at
Canvas level, then **overwritten** by `FixedGlbCamera` — two initialization paths for the
same camera; `FixedGlbCamera` is the authoritative one.

**Render loop: `frameloop="demand"`** — the scene is fully static (no `useFrame` anywhere),
so it renders once and only re-renders when invalidated. R3F auto-invalidates on any
re-render, so the Atmosphere Timeline drags and the eased step sweeps (which drive
`sliderPosition` state each rAF tick) still animate one frame per update. This was the top
GPU finding in `docs/TECH_DEBT.md` (C2).

## Camera

Fixed cinematic viewpoint. The GLB authoring camera transform is **baked into
`lesson01/config.ts`** (position, quaternion, fov ≈48.455°, near 0.1, far 1000) to avoid a
first-frame race against GLB traversal. `FixedGlbCamera` applies it once in
`useLayoutEffect` on mount and updates only `aspect` on resize. No controls by design.

**Tour camera (Calendar & Architecture).** Topics that own a `tour` mount `BlueprintScene`
instead of the photoreal assembly: black `scene.background`, no `SceneEnvironment`/sun (basic
materials ignore light and IBL), and the tree canopy and floor mesh unmounted. The pyramid is drawn
as an outline: `BlueprintEdges` builds `THREE.EdgesGeometry` line segments (hard edges only —
10° threshold, 55° for the organic serpent heads) from the cached GLTF over a black occluder
(shared geometry, never mutated) so hidden lines stay hidden; a `GridHelper` replaces the floor.
The Lesson 01 stairways are flat ramps (their 91 steps exist only in the photoreal textures), so
`BlueprintStairs` draws them procedurally: `stairStepSlots()` (pure, `core/utils/stairs.ts`) gives
each step line's horizontal placement from `LessonConfig.blueprint.stairways`. Downward rays
against the `PyramidBase` mesh (three's GLTFLoader strips the dot from the authored node name
`Pyramid.Base`) sample each ramp's centre line, `fitLine()` fits its plane, and all step lines are
laid on that plane, lifted just above the ramp's highest bump so eroded ramps cannot poke through
and hide parts of the lines. Stairways flagged `worn` (Lesson 01: east and south, whose meshes are
uneven) also have their noisy mesh edges hidden inside the footprint (`stairFootprintContains()`,
in `BlueprintEdges`) and a clean outline drawn instead. `BlueprintEdges` also drops long stray edges of the pyramid body (`isStrayEdge()`, pure, `core/utils/edges.ts`, keyed on `blueprint.axisAzimuth`): every real edge of the monument is vertical, level along an axis, or steep along one (stairway walls ~45°), while erosion produces long edges 1.5°–20° off-axis or tilted 3°–15° from level (e.g. a terrace rim that rises 2 m over 22 m). `CameraTour` applies the pose derived by
`sampleTour(stops, sliderPosition)` in a dependency-guarded layout effect and invalidates —
`frameloop="demand"` and the no-`useFrame` rule are unchanged; the eased step sweep produces the
orbit. Photoreal topics still use the locked `FixedGlbCamera`. Tour poses are orbits around a
target: azimuth 0 = camera on +Z increasing toward +X; the Lesson 01 pyramid is rotated ~17° in
world space, so its north stairway faces azimuth ≈ 2.85 (not π).

## Asset loading

- `useGLTF.setDecoderPath('/draco/')` at module scope; decoders self-hosted in
  `public/draco/` (~1 MB). All 3 GLBs are Draco-compressed (verified):
  Floor 348 KB (1 mesh/1 mat), Layout 1.85 MB (4 meshes/3 mats/**1 camera node**),
  Trees 1.18 MB (1 mesh/2 mats).
- `preloadLessonModels()` runs **at module scope of Lesson01Scene.tsx** — but that module is
  now lazy-loaded (route-level code splitting, TECH_DEBT H3), so the GLB downloads start only
  when the user navigates to the lesson route, never on the landing page.
- `ModelLoader` clones `gltf.scene` per instance, hides camera nodes, applies
  `castShadow`/`receiveShadow`, and renders via `<primitive>`.

## Materials: the vertex-color fix (do not regress)

Tree canopies declare grey `baseColorFactor [0.8,0.8,0.8,1]` and carry hue in `COLOR_0`.
`ModelLoader` enables `vertexColors`, normalizes the color attribute, and whitens
`material.color` — **only when a real 3/4-component `color` attribute exists**. Enabling
`vertexColors` on geometry without `COLOR_0` multiplies diffuse by black (WebGL2 unbound
attribute default) — the "everything went black" regression documented in the code.
Caveat: `clone(true)` shares materials with the drei cache, so this fix mutates the cached
originals (safe today at one loader per URL, hazardous if a URL is ever double-mounted).

## Environment / sky (ADR-001 — Atmosphere Timeline)

`SceneEnvironment` renders the visible sky as **two stacked inverted-sphere skydomes**
driven by a derived `AtmosphereSample` (`sampleAtmosphere()` in `core/utils`):

- **Dome A** (renderOrder −1000, opaque) shows `skyTimeline[sample.indexA]`.
- **Dome B** (renderOrder −999, `transparent`, `opacity = sample.mix`, hidden at mix ≈ 0)
  shows `skyTimeline[sample.indexB]`. Crossfade = plain alpha blending; no custom shaders.
  Dome B keeps depth testing ON: as the only transparent object it renders in three.js's
  transparent pass _after_ all opaque geometry regardless of renderOrder, so the models'
  depth must occlude it — `depthTest=false` blended it over the whole viewport, making the
  geometry dissolve toward the incoming sky during sweeps (fixed regression).
- Both domes share the lesson's framing (`scale`/`panY` via `texture.matrix` with
  `matrixAutoUpdate=false`; shared `rotation`) and brightness tint (`intensity`).
- **IBL**: `scene.environment` can't blend two envmaps, so it follows the _dominant_
  keyframe (A below mix 0.5, B at/above) while `scene.environmentIntensity` lerps
  continuously. The directional sun dominates, making the midpoint envmap swap
  imperceptible. `environmentRotation` tracks the shared rotation.
- All (currently three) 2048×1024 **LDR WebP** textures load up front via
  `useTexture([...urls])` under Suspense — the loading screen covers them, so scrubbing
  never hits the network. Resident GPU cost ≈ 25 MB decoded + PMREM outputs.

It deliberately does not use `scene.background` (needs UV zoom control).

## Lighting & shadows

One directional light; Euler rotation → position at radius 120 via `useMemo`. The rotation
arrives **already interpolated** from the timeline keyframes (ADR-001) — the sun visibly
swings as the user scrubs the slider. Intensity and color are lesson-level constants.
Shadow map 2048², ortho ±120 units, near 0.5, far 400, bias −0.0005 / normalBias 0.02.
Effective density ≈ 0.12 world units per texel — tuned for this plaza; re-evaluate for
larger scenes. No ambient/hemisphere light: fill is IBL-only (deliberate). Trees do not
cast shadows (deliberate: cleaner plaza, less canopy self-shadow noise).

## Performance characteristics (measured)

- Scene: ~6 meshes / <10 draw calls, small footprint; DPR clamped; MSAA on. GPU load is
  light _per frame_ — and with `frameloop="demand"` (C2) a static frame is no longer redrawn
  forever.
- Bundle: route-level code splitting (H3) keeps the landing page at ~190 KB JS (62 KB gzip);
  the three/drei/R3F stack (~890 KB / 240 KB gzip) loads only on the lesson route.
- No disposal policy exists (models, textures, cloned scenes); acceptable for the current
  single-lesson SPA, undefined behavior territory once lessons switch in-app.

## Correct patterns worth preserving

Config-driven scene assembly; baked camera transform (documented rationale); local Draco
decoders; per-URL drei caching; effect-dependency-guarded Three.js mutations (no per-frame
React work); defensive numeric guards on `scale`/`panY`.
