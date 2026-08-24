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
│   └── SceneComponent          from registry (currently always Lesson01Scene)
│       ├── FixedGlbCamera      applies baked camera transform once, locks it
│       ├── SceneEnvironment    dual skydome crossfade + scene.environment IBL
│       ├── SceneLighting       single directional sun, rotation from timeline sample
│       └── ModelLoader × N     useGLTF → clone → configure → <primitive>
└── OverlayComponent            from registry (Lesson01Overlay: curriculum tabs +
                                Atmosphere Timeline slider — the only scene input)
```

## Modules and boundaries

| Module | Responsibility | Depends on |
|---|---|---|
| `core/types/lesson.types.ts` | All domain types: `LessonConfig`, `SkyKeyframe`, `EnvironmentConfig`, `CameraConfig`, `LightingConfig`, `LearningTopic`, `AtmosphereSample` | react (types only) |
| `core/components/` | Lesson-agnostic scene/UI infrastructure (canvas, camera, environment, lighting, model loading, loading/error screens, AtmosphereTimeline) | R3F, drei, three |
| `core/utils/atmosphere.ts` | `sampleAtmosphere()` — pure timeline sampler (keyframe lerp + mix) | core types only |
| `lessons/registry.ts` | `LESSON_REGISTRY` id→{config, SceneComponent, OverlayComponent}; `getAllLessons`, `getLessonEntry` | static imports of every lesson |
| `lessons/<id>/config.ts` | Static, typed lesson definition (assets, camera, lighting, pedagogical content) | core types only |
| `lessons/<id>/*Scene/*Overlay` | Lesson-specific scene assembly and learner UI | core components |
| `pages/` | Route-level composition; `LessonPage` owns the single runtime value (`sliderPosition`) | registry, core |

## State and data flow

ADR-001: static config flows **down**; the scene has exactly **one** runtime value.

```
lessonXX/config.ts ──► registry ──► LessonPage ── useState: sliderPosition (1..N)
                                         │
                                         ├─► sampleAtmosphere(skyTimeline, sliderPosition)
                                         │     = AtmosphereSample { indexA, indexB, mix,
                                         │       lightRotation[], iblIntensity, activeIndex }
                                         ▼
                                   SceneComponent (config + atmosphere)
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
- UI-only state (tabs, drawer open) stays local in the overlay.

## Known structural weaknesses (details in TECH_DEBT.md)

1. ~~Dual source of truth~~, ~~mount-once seeding~~, ~~dev tooling load-bearing~~ —
   all **resolved by ADR-001 / Batch 0** (single-writer slider + derived sample;
   no dev tooling ships).
2. **Static registry imports** prevent route-level code splitting and trigger Lesson01Scene's
   module-level GLB preload (~3.4 MB + Draco) even on the landing page.
3. `Lesson01Scene` uses non-null assertions on hard-coded model ids — fine under the new
   `coming-soon` page guard, but should become a visible early failure (ROADMAP 3.3).
