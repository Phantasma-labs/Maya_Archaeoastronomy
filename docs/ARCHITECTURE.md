# ARCHITECTURE

## Shape of the app

```
index.html
└── src/main.tsx                     React root, StrictMode
    └── App.tsx                      BrowserRouter
        ├── /          → pages/LandingPage.tsx     lesson catalog
        └── /lesson/:id → pages/LessonPage.tsx     3D experience host
```

`LessonPage` is the composition root for a lesson. It resolves the lesson through the
registry, owns all runtime state, and stacks three layers:

```
LessonPage
├── SceneCanvas (core)          ErrorBoundary + Suspense(LoadingScreen) + R3F <Canvas>
│   └── SceneComponent          from registry (currently always Lesson01Scene; renders
│       │                       BlueprintScene when the selected topic owns a `tour`)
│       ├── FixedGlbCamera      applies baked camera transform once, locks it
│       ├── SceneEnvironment    dual skydome crossfade + scene.environment IBL
│       ├── SceneLighting       single directional sun, rotation from timeline sample
│       └── ModelLoader × N     useGLTF → clone → configure → <primitive>
└── OverlayComponent            from registry (Lesson01Overlay: curriculum tabs +
                                Atmosphere Timeline slider — the only scene input)
```

## Modules and boundaries

| Module                         | Responsibility                                                                                                                              | Depends on                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `core/types/lesson.types.ts`   | All domain types: `LessonConfig`, `SkyKeyframe`, `EnvironmentConfig`, `CameraConfig`, `LightingConfig`, `LearningTopic`, `AtmosphereSample` | react (types only)             |
| `core/components/`             | Lesson-agnostic scene/UI infrastructure (canvas, camera, environment, lighting, model loading, loading/error screens, AtmosphereTimeline)   | R3F, drei, three               |
| `core/utils/atmosphere.ts`     | `sampleAtmosphere()` — pure timeline sampler (keyframe lerp + mix)                                                                          | core types only                |
| `core/utils/tour.ts`           | `sampleTour()` / `projectToScreen()` / `tourSettle()` — pure tour sampler, world→screen projection, "camera at rest" factor                 | core types only                |
| `lessons/registry.ts`          | `LESSON_REGISTRY` id→{config, SceneComponent, OverlayComponent}; `getAllLessons`, `getLessonEntry`                                          | static imports of every lesson |
| `lessons/<id>/config.ts`       | Static, typed lesson definition (assets, camera, lighting, pedagogical content)                                                             | core types only                |
| `lessons/<id>/*Scene/*Overlay` | Lesson-specific scene assembly and learner UI                                                                                               | core components                |
| `pages/`                       | Route-level composition; `LessonPage` owns the single runtime value (`sliderPosition`)                                                      | registry, core                 |

## State and data flow

ADR-001: static config flows **down**; the scene has exactly **one** runtime value.

```
lessonXX/config.ts ──► registry ──► LessonPage ── useState: sliderPosition (1..N)
                                         │
                                         ├─► sampleAtmosphere(skyTimeline, sliderPosition)
                                         │     = AtmosphereSample { indexA, indexB, mix,
                                         │       lightRotation[], iblIntensity, activeIndex }
                                         ▼
                                   SceneComponent (config + atmosphere + topicId + position)
                                   OverlayComponent (config + sliderPosition + callbacks)
```

- The **Atmosphere Timeline slider** (in the overlay) is the single writer. Drag/track-click
  write directly; step-marker clicks run a ~0.6 s eased rAF sweep on the same writer, so the
  user watches the sky crossfade and the sun swing through the in-between states.
- Everything visual is **derived, never stored**: `sampleAtmosphere()` is a pure function of
  the slider position — no env/light state exists anywhere to desync (kills the old
  Leva↔runtimeState dual-source bug).
- No store library and no `useFrame`; nothing per-frame lives in React state. The sweep
  tween lives in `LessonPage` and mutates only `sliderPosition`.
- **Tour topics** (`LearningTopic.tour`, e.g. Calendar & Architecture): `sliderPosition` means
  the tour step (1..N). `sampleTour(stops, position)` derives the camera pose; the eased sweep
  between steps is the orbit, so there is still no `useFrame`. The overlay swaps the sky slider
  for `TourStepper` + `TourPanel`, and `Lesson01Scene` renders `BlueprintScene` (dispatch keys on
  the topic's `tour`, never on a topic id). Each stop may carry `callouts` (2D arrows + labels
  pointing at 3D features): world-space anchors are projected to the screen by the pure
  `projectToScreen()` — the same camera pose the canvas shows — and drawn by `TourCallouts` in the
  overlay's 1280×720 design space (same 16:9 aspect as the canvas frame, so no access to the R3F
  camera is needed). They fade out mid-sweep via `tourSettle()`.
- UI-only state (tabs, drawer open) stays local in the overlay.

## Known structural weaknesses (details in TECH_DEBT.md)

1. ~~Dual source of truth~~, ~~mount-once seeding~~, ~~dev tooling load-bearing~~ —
   all **resolved by ADR-001 / Batch 0** (single-writer slider + derived sample;
   no dev tooling ships).
2. ~~Static registry imports~~ — **resolved:** `App` lazy-loads `LessonPage` and the registry
   lazy-loads the lesson scene/overlay, so the landing page no longer pulls in the 3D stack
   or triggers the module-level GLB preload (TECH_DEBT H3).
3. ~~Non-null assertions on hard-coded model ids~~ — **resolved:** `Lesson01Scene` now uses a
   `requireModel(id)` helper that throws a descriptive error on a config/scene desync
   (TECH_DEBT M9).
