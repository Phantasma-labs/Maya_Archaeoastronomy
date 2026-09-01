# AGENTS.md — Engineering Constitution

Permanent guidance for AI agents and humans working in this repository.
Read `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, and `docs/3D_ARCHITECTURE.md` first.
Known, ranked issues live in `docs/TECH_DEBT.md`; sequencing in `docs/ROADMAP.md`.

## Project principles

### Architecture
- **Config-driven lessons.** A lesson is a typed `LessonConfig` + optional Scene/Overlay
  components, registered once in `src/lessons/registry.ts`. Never special-case lessons in
  page or core code.
- **Layering is one-directional:** `pages` → `lessons` → `core`. `core/` must not import
  from `lessons/` or `pages/`. `dev/` is leaf tooling — nothing in `src/` outside `pages`
  may depend on it.
- **Make the smallest appropriate change.** Do not refactor adjacent code, rename things,
  or "improve" patterns you were not asked to touch, even if they are listed in TECH_DEBT —
  unless the task explicitly includes that cleanup.
- **No premature abstractions.** The second use of a pattern is not proof a third is
  coming. Keep the concrete code until the third lesson forces the abstraction.

### TypeScript
- `strict` is on and stays on. `tsc --noEmit` must pass before completion.
- No `any` in new code.
- Avoid non-null assertions (`find(...)!`). If a lookup can fail, handle it or fail loudly.
- Shared domain types live only in `src/core/types/lesson.types.ts`.

### React
- UI state stays local (`useState` in the owning component). Global state requires an
  actual reason — current app has none and deliberately uses no store library.
- Keep callbacks stable (`useCallback`) when passed into panels that fire them in effects.
- Do not add side effects inside `useMemo`. The existing texture-setup `useMemo` in
  `SceneEnvironment` is registered legacy, not a pattern.
- Never let a component silently depend on mount-once initialization if the underlying
  data (lesson, route param) can change while mounted — re-seed or key-remount explicitly.

### Three.js / React Three Fiber
- **No `useFrame` for static scenes.** Nothing in the current scene animates; do not add
  per-frame work without a functional requirement, and prefer `frameloop="demand"`.
- **Never put render-loop or GPU state into React state.** Mutate Three.js objects via
  refs inside dependency-guarded effects — this is the established, correct pattern here.
- Load GLBs exclusively through `ModelLoader`/`useGLTF` with the local `/draco/` decoder
  path. Do not hand-roll GLTFLoader usage.
- **Preserve the vertex-color guard in `ModelLoader`**: only enable `vertexColors` when a
  real 3/4-component `COLOR_0` attribute exists — otherwise the mesh renders black.
  This regression happened once; the comments there are institutional knowledge, keep them.
- Camera nodes inside GLBs are data, not geometry — they must stay hidden from render.
- One directional light + IBL fill is the lighting model. Do not reintroduce ambient or
  hemisphere lights; fill comes from the IBL environment by design.

### State management
- **ADR-001 (implemented):** this product ships **no developer panel**. Light/environment
  values are hardcoded keyframes in lesson configs (`skyTimeline`); the Atmosphere
  Timeline slider is the single runtime writer (`sliderPosition` in `LessonPage`), and
  everything else derives via `sampleAtmosphere()` — never stored. Do not reintroduce
  leva-style debug stores as state owners.

### Assets
- GLBs go to `public/assets/lesson_XX/`, Draco-compressed, versioned filenames
  (`*_vNNN.glb`). Skies are 2048×1024 equirect LDR WebP until the HDR roadmap item lands.
- Do not describe WebP skies as HDR in UI or docs.
- Every asset must be referenced by a lesson config. Orphan files get deleted, not kept
  "just in case" (see `01 - Copy.webp` in TECH_DEBT M2).

### Performance rules
- Keep the landing page free of the 3D stack: no module-level GLB preloads reachable from
  `/`, and preserve the option of route-level code splitting.
- DPR stays clamped to `[1, 2]`. Shadows stay at one 2048² map unless a scene outgrows the
  ±120-unit ortho box — re-derive texel density (~0.12 units/texel today) before enlarging.
- Watch GPU memory: each equirect panorama costs ~8.4 MB decoded plus its PMREM result.
- Bundle budget: the app must not silently exceed ~400 KB gzip JS; Vite's chunk-size
  warning is a tripwire, not noise.

### Naming & structure
- Folders: `core` (reusable), `lessons/<id>` (content), `pages` (routes), `dev` (tooling),
  `styles`. New shared 3D code goes to `core/components`, never into a lesson folder.
- Components `PascalCase.tsx`, configs `config.ts`, types `*.types.ts`, assets `kebab` or
  `CamelCase_vNNN.glb` consistent with existing files.
- Comments explain **why**, including regressions avoided — never narrate what the code says.
- Hardcoded hex colors are registered debt; new UI uses the Tailwind palette.

## Rules for AI agents

- **Inspect before changing.** Read the relevant module and its docs section before any
  edit. Never assume an architecture decision was wrong just because another shape is
  theoretically cleaner — challenge it in prose, not in code, unless asked.
- **No new dependencies** without demonstrating that an existing one cannot do the job.
- **Preserve working behavior.** If behavior change is not explicitly required, it is
  forbidden. "Looks unused" is never sufficient grounds for deletion — verify with a
  project-wide usage grep (code, configs, `index.html`, assets) and say what you checked.
- **Do not duplicate state.** Before adding a new runtime value, check whether it is
  derivable from lesson config or existing state — ADR-001: `sliderPosition` is the only
  writer. One owner per piece of state.
- **Explain tradeoffs** in the PR/task summary when a change has architectural weight
  (state ownership, render-loop behavior, asset pipeline, bundle size).
- **Comments with "CRITICAL", "regression", or a rationale are load-bearing.** Move them
  with the code they describe; never strip them during cleanup.
- **Do not commit build output** (`dist/`) or machine-specific files.
- Content edits (lesson copy) must respect the scholarly-caution tone of
  `LearningMaterial/` — evidence vs. interpretation stays distinct.

## Before Editing

1. Understand the relevant architecture (`docs/ARCHITECTURE.md`, `docs/3D_ARCHITECTURE.md`).
2. Identify every affected file, including type definitions and the registry.
3. Identify dependencies the change touches (three/drei/R3F version constraints matter).
4. Check existing patterns in neighboring files and follow them.
5. Make the smallest appropriate change; keep diffs reviewable.
6. Plan validation before writing code (what command proves this works?).

## Before Completion

1. Run `npx tsc --noEmit` — must pass with zero errors.
2. Run the linter if configured; if not, state that lint coverage is absent.
3. Run `npm run build` for anything touching `src/` — confirm it succeeds and record the
   chunk-size warning state (it currently warns; do not make it worse).
4. For runtime-visible changes, run `npm run dev` and verify behavior manually where
   possible (scene renders, no console errors).
5. Verify unrelated functionality was not broken (both routes, landing catalog, overlays).
6. Summarize **exactly** what changed: files, behavior, and any tradeoff accepted.
7. If you discover new debt while working, add it to `docs/TECH_DEBT.md` with a rank —
   do not fix it silently in an unrelated change.

