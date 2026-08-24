# 3D ARCHITECTURE

## Render pipeline (R3F)

`SceneCanvas` creates the `<Canvas>` with: `shadows`, `dpr=[1,2]`,
`gl={ antialias: true, toneMapping: ACESFilmic, toneMappingExposure: 1.05,
powerPreference: 'high-performance' }`. No post-processing. Camera props are passed at
Canvas level, then **overwritten** by `FixedGlbCamera` — two initialization paths for the
same camera; `FixedGlbCamera` is the authoritative one.

**Render loop: default `frameloop='always'`** — the scene re-renders every frame even
though nothing animates (no `useFrame` anywhere). This is the top GPU finding in
`docs/TECH_DEBT.md`; the scene is a candidate for `frameloop="demand"` + `invalidate()`.

## Camera

Fixed cinematic viewpoint. The GLB authoring camera transform is **baked into
`lesson01/config.ts`** (position, quaternion, fov ≈48.455°, near 0.1, far 1000) to avoid a
first-frame race against GLB traversal. `FixedGlbCamera` applies it once in
`useLayoutEffect` on mount and updates only `aspect` on resize. No controls by design.

## Asset loading

- `useGLTF.setDecoderPath('/draco/')` at module scope; decoders self-hosted in
  `public/draco/` (~1 MB). All 3 GLBs are Draco-compressed (verified):
  Floor 348 KB (1 mesh/1 mat), Layout 1.85 MB (4 meshes/3 mats/**1 camera node**),
  Trees 1.18 MB (1 mesh/2 mats).
- `preloadLessonModels()` runs **at module scope of Lesson01Scene.tsx** → importing the
  registry (as `LandingPage` does) starts all GLB downloads immediately.
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

## Environment / sky

`SceneEnvironment` renders **both** IBL and the visible sky from one 2048×1024 **LDR WebP**
equirect (8.4 MB decoded each; clamped wrap, no mipmaps, `matrixAutoUpdate=false`):

1. `scene.environment = texture` + `environmentIntensity` (= `iblIntensity`) +
   `environmentRotation` for PBR reflections. PMREM generation happens once per unique URL.
2. An inverted sphere skydome (r=500, 64×32, BackSide, `MeshBasicMaterial`, depthTest/
   depthWrite off, `renderOrder=-1000`, not frustum-culled) for the visible sky.
   `intensity` tints `material.color`; `scale`/`panY` write a custom UV `texture.matrix`.
   It deliberately does not use `scene.background` (needs UV zoom control).

Not HDR: IBL from 8-bit data has no dynamic range — the UI footer label "HDR/PBR Sky"
overstates it. Textures are never evicted; visiting all presets keeps all decoded textures
plus PMREM results resident (~25 MB+ GPU for the three skies).

## Lighting & shadows

One directional light; Euler rotation → position at radius 120 via `useMemo`.
Shadow map 2048², ortho ±120 units, near 0.5, far 400, bias −0.0005 / normalBias 0.02.
Effective density ≈ 0.12 world units per texel — tuned for this plaza; re-evaluate for
larger scenes. No ambient/hemisphere light: fill is IBL-only (deliberate). Trees do not
cast shadows (deliberate: cleaner plaza, less canopy self-shadow noise).

## Performance characteristics (measured)

- Scene: ~6 meshes / <10 draw calls, small footprint; DPR clamped; MSAA on. GPU load is
  light *per frame* — waste comes from rendering a static frame forever.
- Bundle: single 1.31 MB JS chunk (three+drei+leva+router+icons) loaded by the landing page.
- No disposal policy exists (models, textures, cloned scenes); acceptable for the current
  single-lesson SPA, undefined behavior territory once lessons switch in-app.

## Correct patterns worth preserving

Config-driven scene assembly; baked camera transform (documented rationale); local Draco
decoders; per-URL drei caching; effect-dependency-guarded Three.js mutations (no per-frame
React work); defensive numeric guards on `scale`/`panY`.
