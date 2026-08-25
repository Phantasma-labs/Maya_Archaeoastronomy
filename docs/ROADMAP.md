# ROADMAP

Ordered by leverage. **Design-locked changes are Batch 0** — the authoritative spec is
`docs/DESIGN_DECISIONS.md` (ADR-001). Do not reorder Batch 0 and Phase 1 without a reason.

## 0. ✅ COMPLETED (2026-08-23) — ADR-001: DevPanel removed, hardcoded keyframes, Atmosphere Timeline

Shipped as one unit. `tsc --noEmit` clean; build clean (main chunk 1,312→1,116 KB raw,
378→312 KB gzip without leva); dev server smoke-tested. Removed: `src/dev/DevPanel.tsx`,
`leva`, Alt+D shortcut, Dev Controls button, leva CSS override, `EnvironmentPreset`,
`SceneRuntimeState`, per-axis preset merging. Added: `SkyKeyframe` + `skyTimeline` configs,
`sampleAtmosphere()`, dual-dome crossfade in `SceneEnvironment`, `AtmosphereTimeline`
component, eased step sweep in `LessonPage`, coming-soon route guard.

## 1. Must fix (protect the project)

1. ✅ **Version control baseline.** `.gitignore` covers `dist/` + editor/OS noise; repo has commits.
2. ✅ **Remove debug residue.** Deleted `inspect_tree*.mjs`, `inspect_tree_output.txt`,
   `probe.mjs`, `probe_output.txt`, `dev-stderr.log`, `dev-stdout.log`, and
   `public/assets/lesson_01/01 - Copy.webp` (955 KB shipped per build).
3. ✅ **Stop `/lesson/02` from crashing.** `LessonPage` checks `config.status` and renders a
   not-available state for `coming-soon` lessons (Batch 0).
4. ✅ **`frameloop="demand"`** — `SceneCanvas` sets it; R3F auto-invalidates on re-render, so
   slider drags stay live and click sweeps still animate (the tween drives `sliderPosition`
   state each rAF tick).

## 2. Should fix (unblock growth)

1. **Tooling minimum.** Add ESLint (react-hooks) + Prettier + `lint`/`typecheck` npm
   scripts; run the existing eslint-disable comments against a real config.
2. ✅ **Remove dead code** (TECH_DEBT M3, M4, M6, M8): vite middleware alias, `clsx`,
   `ModelLoader.onLoaded`, `customSceneRenderer`, `CameraConfig.source`,
   `LearningTopic.icon`, stray `scene.background` cleanup — each verified by grep.

## 3. Nice to have (quality & headroom)

1. ✅ **Route-level code splitting** — `App` lazy-loads `LessonPage`; the registry
   lazy-loads the lesson scene/overlay. Landing main chunk dropped to ~190 KB (62 KB gzip);
   the 3D stack + GLB preload load only on the lesson route.
2. **Consolidate the design tokens** into the Tailwind `maya.*` palette; delete the CSS
   vars and hardcoded hex drift. Decide the canonical surface color (`#12151e` vs `#121622`).
3. **Typed registry**: `runtimeState: any` → the slider-position type; replace
   `Lesson01Scene`'s `find(...)` with lookups that fail visibly and early. *(The `find(...)!`
   assertions were replaced with a throwing `requireModel(id)` helper — see TECH_DEBT M9.)*

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
