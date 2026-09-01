# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

- **`AGENTS.md`** — the engineering constitution. All architecture, TypeScript/React/Three.js rules, asset conventions, and the "Before Editing" / "Before Completion" checklists live there. Follow it.
- **`docs/PROJECT.md`** — what the project is, stack, constraints, status.
- **`docs/ARCHITECTURE.md`** — app shape, module boundaries, state/data flow (ADR-001).
- **`docs/3D_ARCHITECTURE.md`** — render pipeline, camera, asset loading, the vertex-color fix, sky/IBL, lighting.
- **`docs/TECH_DEBT.md`** — ranked known issues; `docs/ROADMAP.md` — sequencing.

## Commands

```bash
npm run dev          # Vite dev server, port 3000
npm run typecheck    # tsc --noEmit (strict; must pass before completion)
npm run build        # tsc --noEmit && vite build
npm run lint         # ESLint 9 flat config
npm run lint:fix
npm run format       # Prettier (src/, docs/, config files)
npm run format:check
```

No test scripts and no CI exist. Validation = `typecheck` + `lint` + `build` + manual `dev` check.

## Architecture in brief

A config-driven 3D learning platform (React 18 + Vite + three/R3F/drei + Tailwind). Each lesson is a typed `LessonConfig` plus optional Scene/Overlay components, registered once in `src/lessons/registry.ts`. **Never special-case a lesson in page or core code.**

Layering is one-directional: `pages` → `lessons` → `core`. `core/` must not import from `lessons/` or `pages/`.

```
src/
├── core/            reusable, lesson-agnostic
│   ├── types/lesson.types.ts   all domain types (LessonConfig, SkyKeyframe, AtmosphereSample, …)
│   ├── components/  SceneCanvas, FixedGlbCamera, SceneEnvironment, SceneLighting,
│   │                ModelLoader, AtmosphereTimeline, LoadingScreen
│   └── utils/       atmosphere.ts (sampleAtmosphere — pure timeline sampler)
├── lessons/
│   ├── registry.ts  LESSON_REGISTRY id → {config, SceneComponent, OverlayComponent}
│   ├── lesson01/    config.ts + Lesson01Scene.tsx + Lesson01Overlay.tsx
│   └── lesson02/    config-only stub (status: 'coming-soon')
├── pages/           LandingPage (catalog) + LessonPage (3D host, composition root)
└── styles/
```

**State (ADR-001):** static config flows down; the scene has exactly **one** runtime value — `sliderPosition` in `LessonPage`. Everything visual is *derived* via `sampleAtmosphere(skyTimeline, sliderPosition)`, never stored. No store library, no `useFrame`, `frameloop="demand"`.

**Route-level code splitting:** the registry lazy-loads scene/overlay modules, so the landing page never pulls in the three/drei/R3F stack or triggers GLB preloads. Keep it that way.

**Assets:** Draco-compressed GLBs in `public/assets/lesson_XX/` (versioned `*_vNNN.glb`), self-hosted Draco decoders in `public/draco/`, LDR WebP equirect skies (2048×1024). Every asset must be referenced by a lesson config — orphans get deleted.

## Key invariants (full detail in AGENTS.md)

- `tsc --noEmit` must pass; `strict` on, no `any`, no non-null assertions in new code.
- No `useFrame` for static scenes; never put render-loop/GPU state into React state — mutate Three.js objects via refs in dependency-guarded effects.
- Preserve the `ModelLoader` vertex-color guard (only enable `vertexColors` when a real `COLOR_0` attribute exists) — the "everything went black" regression.
- One directional light + IBL fill only; no ambient/hemisphere lights.
- Make the smallest appropriate change; no new dependencies without demonstrating an existing one can't do the job; don't commit `dist/`.
- Content edits must respect the scholarly-caution tone (evidence vs. interpretation) of the vetted lesson copy.
