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
│       ├── SceneEnvironment    skydome mesh + scene.environment IBL
│       ├── SceneLighting       single directional sun + shadow config
│       └── ModelLoader × N     useGLTF → clone → configure → <primitive>
├── OverlayComponent            from registry (Lesson01Overlay, lesson-specific UI)
└── DevPanel (dev/)             Leva controls → onChange → runtime state
```

## Modules and boundaries

| Module | Responsibility | Depends on |
|---|---|---|
| `core/types/lesson.types.ts` | All domain types: `LessonConfig`, `ModelAsset`, `EnvironmentConfig`, `CameraConfig`, `LightingConfig`, `LearningTopic`, `SceneRuntimeState` | react (types only) |
| `core/components/` | Lesson-agnostic scene infrastructure (canvas, camera, environment, lighting, model loading, loading/error screens) | R3F, drei, three |
| `lessons/registry.ts` | `LESSON_REGISTRY` id→{config, SceneComponent, OverlayComponent}; `getAllLessons`, `getLessonEntry` | static imports of every lesson |
| `lessons/<id>/config.ts` | Static, typed lesson definition (assets, camera, lighting, pedagogical content) | core types only |
| `lessons/<id>/*Scene/*Overlay` | Lesson-specific scene assembly and learner UI | core components |
| `pages/` | Route-level composition; `LessonPage` owns runtime state | registry, core, dev |
| `dev/DevPanel.tsx` | Leva developer controls; exports `IBL_DEFAULTS` | core types |

## State and data flow

Static config flows **down**; runtime edits flow **up** from exactly two writers:

```
lesson01/config.ts ──► registry ──► LessonPage useState initializer ──► runtimeState
                                        ▲              │ props
        Leva store ──onChange──► handleRuntimeStateChange              ▼
        Overlay preset click ──► handleEnvironmentPresetSelect   Scene / Overlay
```

- `runtimeState` (`SceneRuntimeState | null`) lives in `LessonPage` via `useState`.
  It is seeded **once at mount** from lesson config + `IBL_DEFAULTS`.
- Writers: (1) the Leva panel's `onChange` effect (pushes the *entire* state on any slider
  change), and (2) overlay preset selection (merges only the fields the preset declares).
- There is **no store library and no `useFrame`**; nothing per-frame lives in React state.
  This is correct and should be preserved.
- UI-only state (tabs, drawer open, dev visibility) is local component state. Good.

## Known structural weaknesses (details in TECH_DEBT.md)

1. **Dual source of truth**: Leva's internal store and `runtimeState` diverge after an
   overlay preset selection; the next slider touch overwrites the preset's light/IBL values.
2. **Mount-once seeding**: `runtimeState` and Leva initial values are only computed on
   mount — in-app navigation between lessons will not re-seed them.
3. **Dev tooling is load-bearing**: `LessonPage` imports `IBL_DEFAULTS` from
   `dev/DevPanel.tsx`, so the "removable in production" panel is actually required at boot.
4. **Static registry imports** prevent route-level code splitting and trigger Lesson01Scene's
   module-level GLB preload (~3.4 MB + Draco) even on the landing page.
5. `registry.ts` types `runtimeState: any`; `Lesson01Scene` uses non-null assertions on
   hard-coded model ids — `/lesson/02` (empty models array) crashes on direct navigation.
