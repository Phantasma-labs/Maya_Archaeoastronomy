# ROADMAP

Ordered by leverage. **Design-locked changes are Batch 0** — the authoritative spec is
`docs/DESIGN_DECISIONS.md` (ADR-001). Do not reorder Batch 0 and Phase 1 without a reason.

## 0. Design batch — ADR-001: remove DevPanel, hardcode keyframes, Atmosphere Timeline

One coherent change; ship as a single unit.

1. **Remove the DevPanel.** Delete `src/dev/DevPanel.tsx`, the Alt+D shortcut, the "Dev
   Controls" button in `Lesson01Overlay`, the leva override in `index.css`; uninstall `leva`.
2. **Hardcode keyframes.** Replace preset/optional env fields with a complete
   `skyTimeline` keyframe array in each lesson config (values in DESIGN_DECISIONS.md);
   make `EnvironmentConfig` framing fields required; delete `IBL_DEFAULTS`.
3. **Build the Atmosphere Timeline slider** (overlay): drag = live update, click = ~0.6 s
   eased sweep to the step, value stays where dropped. The slider is the **single runtime
   writer** — `runtimeState` collapses to `sliderPosition`; light/env values are derived.
4. **`SceneEnvironment` crossfade.** Two stacked skydome domes, top opacity = mix factor
   (no custom shaders); envmap swaps at each segment midpoint; `environmentIntensity`
   lerps. Preload all 3 skies behind Suspense alongside the GLBs.
5. **Delete dead plumbing.** The per-axis preset-merge in `LessonPage` (~50 lines) and the
   env/light fields of the old `SceneRuntimeState` go away.
6. **Verify:** `tsc --noEmit` + build clean, main chunk lighter (~90 KB gzip without leva),
   and manually: drag stays live, click sweep animates, sky/light continuity through the
   in-betweens, no black-mesh regression.

## 1. Must fix (protect the project)

1. **Version control baseline.** Extend `.gitignore` (`dist`, `LearningMaterial` or move it
   under `docs/`, editor/OS files). Make the initial commit. Nothing else is safe until this lands.
2. **Remove debug residue.** Delete `inspect_tree*.mjs`, `inspect_tree_output.txt`,
   `probe.mjs`, `probe_output.txt`, and `public/assets/lesson_01/01 - Copy.webp`
   (955 KB shipped per build). Verify no references first (grep — currently clean).
3. **Stop `/lesson/02` from crashing.** Cheapest correct: `LessonPage` checks
   `config.status` and renders a not-available state for `coming-soon` lessons.
4. **`frameloop="demand"`** — schedule AFTER Batch 0 and verify against it: React state
   updates auto-invalidate in demand mode, but confirm slider drags stay live and click
   sweeps still animate (the tween must drive state or call `invalidate()`).

## 2. Should fix (unblock growth)

1. **Tooling minimum.** Add ESLint (react-hooks) + Prettier + `lint`/`typecheck` npm
   scripts; run the existing eslint-disable comments against a real config.
2. **Remove dead code** (TECH_DEBT M3–M6, M8): vite middleware alias, `clsx`,
   `ModelLoader.onLoaded`, `customSceneRenderer`, `CameraConfig.source`,
   `LearningTopic.icon`, stray `scene.background` cleanup — each after a usage grep.

## 3. Nice to have (quality & headroom)

1. **Route-level code splitting**: `React.lazy` the lesson scene/overlay via the registry;
   move GLB preloading from module scope into the lesson route. Landing drops to <200 KB JS.
2. **Consolidate the design tokens** into the Tailwind `maya.*` palette; delete the CSS
   vars and hardcoded hex drift. Decide the canonical surface color (`#12151e` vs `#121622`).
3. **Typed registry**: `runtimeState: any` → the slider-position type; replace
   `Lesson01Scene`'s `find(...)` with lookups that fail visibly and early.

## 4. Future architecture (when lessons 02–05 arrive)

1. **Lesson-switching state model** — keyed remount on route change; URL params for
   deep-linked slider positions are a candidate.
2. **HDR pipeline** — real `.hdr`/KTX2 skies if IBL fidelity matters; add texture eviction
   on lesson change (~8.4 MB decoded per panorama + its PMREM result).
3. **Content pipeline** — generate lesson `content` blocks from `LearningMaterial/*.md`
   instead of hand-duplicating facts into config.
4. **Guardrails** — asset budget CI check (GLB/texture size ceilings), a smoke test for
   registry integrity (every lesson resolves, models exist on disk), and R3F v9/React 19
   evaluation only when a concrete need appears.
