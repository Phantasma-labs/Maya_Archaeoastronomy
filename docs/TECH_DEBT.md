# TECH DEBT

Ranked: **Critical** (risk of breakage/data loss), **High** (user- or growth-facing),
**Medium** (maintenance friction), **Low** (polish).

## Critical

| # | Item | Evidence |
|---|---|---|
| C1 | **No version control.** → **RESOLVED:** repo has commits; `.gitignore` covers `dist/` (build output) and editor/OS noise. `LearningMaterial/` is intentionally tracked source. | `git log`; `.gitignore` |
| C2 | **Static scene renders forever.** → **RESOLVED:** `SceneCanvas` now sets `frameloop="demand"` — a fully static frame renders once and only re-renders on invalidation (R3F auto-invalidates on re-render, so slider drags and eased step sweeps still animate). Eliminates the dominant GPU/battery waste. | `SceneCanvas.tsx` (`frameloop="demand"`) |

## High

| # | Item | Evidence |
|---|---|---|
| H1 | **Dual runtime-state ownership.** → **RESOLVED (Batch 0, ADR-001):** DevPanel/Leva deleted; the Atmosphere Timeline slider at `LessonPage` is now the single writer (`sliderPosition`), everything else derives via `sampleAtmosphere()`. *(Historical detail: Leva kept its own store alongside `runtimeState`; overlay preset clicks desynced the two.)*
| H2 | **`/lesson/02` crashes on direct navigation.** → **RESOLVED (Batch 0):** `LessonPage` checks `config.status === 'coming-soon'` and renders a holding page before any scene component mounts. *(Remaining sub-issue: registry still points `'02'` at `Lesson01Scene` with its `find()!` assertions — see M9.)*
| H3 | **Landing page eagerly loads the whole 3D stack.** → **RESOLVED:** route-level code splitting — `App` lazy-loads `LessonPage`; the registry lazy-loads `Lesson01Scene`/`Lesson01Overlay`. The landing page main chunk dropped from ~1.03 MB (287 KB gzip) to ~190 KB (62 KB gzip); the three/drei/R3F stack + GLB preload now live in a separate chunk loaded only on the lesson route. | `App.tsx`, `registry.ts`, build output |
| H4 | **Dev panel was load-bearing for production boot.** → **RESOLVED (Batch 0, ADR-001):** `src/dev/` deleted; framing values (`scale`/`panY`/`rotation`) are authored in each lesson config; `IBL_DEFAULTS` is gone. No dev tooling ships. *(Historical detail: `LessonPage` imported `IBL_DEFAULTS` from `dev/DevPanel.tsx` to seed runtime state.)*
| H5 | **Mount-once state seeding.** → **RESOLVED (Batch 0, ADR-001):** the only runtime state is `sliderPosition`; the atmosphere sample derives per render via `sampleAtmosphere()` — nothing to seed, nothing to go stale on lesson switch. |

## Medium

| # | Item | Evidence |
|---|---|---|
| M1 | Leftover debug artifacts at repo root. → **RESOLVED:** deleted `inspect_tree.mjs`, `inspect_tree_run.mjs`, `inspect_tree_output.txt`, `probe.mjs`, `probe_output.txt`, `dev-stderr.log`, `dev-stdout.log`. | root listing |
| M2 | Unused/shipped file `public/assets/lesson_01/01 - Copy.webp` (955 KB). → **RESOLVED:** deleted; no longer copied into builds. | asset grep vs configs |
| M3 | Dead dev-only middleware: `vite.config.ts` aliases `/assets/lesson01/` → `/assets/lesson_01/`. → **RESOLVED:** middleware removed; `vite.config.ts` is now a plain react() + alias config. | vite.config.ts; grep |
| M4 | `clsx` dependency has zero imports. → **RESOLVED:** removed from `package.json` + lockfile. | grep; package.json |
| M5 | No ESLint/Prettier, yet code contains `eslint-disable-line react-hooks/exhaustive-deps` for a config that doesn't exist; `noUnusedLocals` is the only unused-code guard. | `FixedGlbCamera.tsx:53` |
| M6 | Dead API surface. → **RESOLVED:** removed `ModelLoader.onLoaded`, `LessonConfig.customSceneRenderer`, `CameraConfig.source`, `LearningTopic.icon` (and the now-unused `ReactNode` import). | grep |
| M7 | LDR WebP skies: IBL samples 8-bit 2048×1024 panoramas (fidelity ceiling; HDR pipeline is ROADMAP 4.2). The misleading UI label was fixed in Batch 0 ("Equirectangular Panorama Sky + IBL"). | `lesson01/config.ts` skyTimeline |
| M8 | → **RESOLVED (Batch 0):** `SceneEnvironment` rewrite dropped the stray `scene.background` cleanup; it now manages only `scene.environment*`, with a correct cleanup. | |
| M9 | Registry `SceneComponent` now typed (`atmosphere: AtmosphereSample`) — resolved in Batch 0. Remaining: three non-null assertions in `Lesson01Scene`. → **RESOLVED:** replaced `models.find(...)!` with a `requireModel(id)` helper that throws a descriptive error (surfaced by the error boundary) on a config/scene desync. | `Lesson01Scene.tsx` |

## Low

| # | Item | Evidence |
|---|---|---|
| L1 | Design tokens exist in 3 places with drift: Tailwind `maya.*` palette (used **0** times; `surface: #121622`), CSS `:root` vars, and hardcoded hex in JSX (`#12151e` etc.). | grep `maya-` → no results |
| L2 | Retry button in the error boundary resets React state, but a failed `useGLTF` promise cache means retry can instantly re-throw. → **RESOLVED:** `SceneCanvas` accepts `gltfUrls` (passed by `LessonPage` from the lesson config) and evicts them from the drei cache on retry, so the retry actually re-fetches. | `SceneCanvas.tsx`, `LessonPage.tsx` |
| L3 | `SceneCanvas` wrapper div sets `w-full h-full relative` twice (className + inline style). → **RESOLVED:** removed the redundant inline style. | `SceneCanvas.tsx` |
| L4 | `new THREE.Color()` allocated per `SceneEnvironment` render; DevPanel lighting presets duplicate magic numbers independent of lesson config. | `SceneEnvironment.tsx:190`, `DevPanel.tsx:114-125` |
| L5 | Google Fonts loads 3 families × many weights render-blocking; `LearningMaterial/` not referenced by the app (facts duplicated into `lesson01/config.ts` by hand). | `index.html:11` |
| L6 | No disposal policy for textures/cloned scenes; ~8.4 MB decoded per visited sky preset stays resident plus PMREM output. | `docs/3D_ARCHITECTURE.md` |

## False positives checked and dismissed

- Per-render React work in scene components: effects are correctly dependency-guarded; only
  texture matrix/color mutations run, exactly when the corresponding slider changes. Fine.
- `import React` in every file: required for the `React.FC` namespace under `react-jsx` — noise, not a bug.
- Camera nodes inside the Layout GLB: correctly hidden by `ModelLoader`, not rendered.
