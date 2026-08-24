# DESIGN DECISIONS

Locked product/architecture decisions, newest first. These override older statements in
`ARCHITECTURE.md` / `TECH_DEBT.md` until those documents are updated after implementation.

## ADR-001 — Remove dev panel; hardcoded light/env; Atmosphere Timeline slider (2026-08-23)

**Decision**

- The Leva-based DevPanel is **removed and must not be reintroduced**. No runtime debug
  tooling ships in this product.
- All lighting and environment values are **hardcoded in lesson configs** as complete
  keyframes. There are no fallback chains (`IBL_DEFAULTS` is deleted).
- The single learner-facing environment control is a horizontal **"Atmosphere Timeline"
  slider**, position 1→3 continuous.

**Slider spec**

- Three keyframes per lesson, hardcoded in config (Lesson 01 values):

  | Key | Step | Sky | Light rotation [X,Y,Z] | IBL |
  |---|---|---|---|---|
  | Atmospheric Daylight | 1 | `01.webp` | `[1.6564, 0, 1.5]` | 0.5 |
  | Equinoctial Horizon | 2 | `02.webp` | `[1.6564, 0, 1.66]`¹ | 0.82 |
  | Dusk Celestial View | 3 | `03.webp` | `[-0.2, 0, 0]` | 0.66 |

  ¹ K2's old preset declared only Z; X/Y are materialized to the lesson default so every
  keyframe is complete and lerp-able.

- **Drag = live.** Between keyframes n and n+1 at offset t: sky crossfades A↔B by t,
  light rotation and IBL intensity lerp by t. The value stays where dropped (no snap-back).
- **Click a step = animated sweep** — ~0.6 s eased tween to that keyframe, visibly passing
  through the in-between states. The in-between is a feature, not a transition artifact.
- All 3 skies preload with the GLBs behind the existing Suspense loading screen
  (~25 MB GPU total — accepted; see TECH_DEBT L6).
- IBL: `scene.environment` cannot blend two envmaps; it swaps at each segment's midpoint
  while `environmentIntensity` follows the lerp. With the directional sun dominant this is
  imperceptible.
- Sky crossfade rendering: two stacked skydome domes, top dome opacity = mix factor.
  No custom shaders.

**Consequences for code**

- Deleted: `src/dev/DevPanel.tsx`, Alt+D shortcut, "Dev Controls" overlay button, leva CSS
  override in `index.css`, `leva` dependency, `IBL_DEFAULTS`, the per-axis preset-merge
  logic in `LessonPage` (~50 lines), `EnvironmentPreset`'s optional per-axis overrides.
- `runtimeState` collapses to `sliderPosition`; everything else is **derived**, not stored.
  The slider is the single writer — resolves TECH_DEBT H1 and H4 by design.
- `SceneEnvironment` gains dual-texture crossfade; `SceneLighting` receives lerped values.
- `frameloop="demand"` (Roadmap 1.4) must be verified against drags and click sweeps.

**Why (rationale)**

Dev tooling had become load-bearing for production boot (H4) and fought the learner preset
system for state ownership (H1). Hardcoding keyframes removes the conflict entirely and
turns "presets" into a continuous, pedagogically-motivated timeline: the user *sees* the
sun path and sky morph between Daylight → Equinox → Dusk.
