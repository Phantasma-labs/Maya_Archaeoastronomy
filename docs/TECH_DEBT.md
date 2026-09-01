# TECH DEBT — Maya Archaeoastronomy

Ranked known issues. **Sequencing** lives in `docs/ROADMAP.md`. **Locked
decisions** live in `docs/DESIGN_DECISIONS.md`. This ledger is the project's
governance record — when a fix lands, update this file, do not delete the
history.

## Active issues (2026-09-01)

### P3 — Low

- **V2-7 — AGENTS.md stale references.** Still lists `runtimeState: any` in
  `registry.ts` and unused `clsx` as registered debt; both resolved long ago.
  One-pass doc cleanup.
- **V2-10 — Lesson02 reuses `Lesson01Scene` as placeholder.** Harmless today
  (the coming-soon guard prevents render) but a latent trap if the guard is ever
  removed. Resolve by authoring a real `Lesson02Scene` when the lesson's assets
  land.

## Resolved (historical)

### Resolved by ADR-001 / V01 (2026-08-23)

| ID | Item | Resolution |
|---|---|---|
| H1 | Dev panel ↔ runtimeState dual source of truth | ADR-001 — single-writer slider, derived sample |
| H4 | Dev tooling load-bearing for production boot | ADR-001 — hardcoded keyframes, no dev tooling ships |
| M5 | `FixedGlbCamera` non-null assertion / exhaustive-deps disable | Config captured into a mount-time ref |
| M9 | `find(...)!` assertions on hard-coded model ids | `requireModel(id)` throws on config/scene desync |
| L2 | Failed `useGLTF` promise stays cached as rejected | Error boundary evicts lesson GLTFs on retry |
| L4 | Per-render `Color` allocation in `SceneEnvironment` | Reusable `Color` instance mutated by memoized tint |
| L6 | GPU memory grows unbounded across lesson visits | `useLessonAssetCleanup` evicts GLB + equirect caches on route change |
| C2 | Static scene redrawn every frame | `frameloop="demand"` |

### Resolved by ROADMAP §1–§3 (post-Batch 0)

| ID | Item | Resolution |
|---|---|---|
| (git) | Version control baseline + `.gitignore` | Done |
| M2 | Orphan asset `01 - Copy.webp` (955 KB shipped) | Deleted |
| M3/M4/M6/M8 | Dead code (vite middleware alias, `clsx`, `onLoaded`, `customSceneRenderer`, `CameraConfig.source`, `LearningTopic.icon`, stray `scene.background`) | Removed, each verified by grep |
| H3 | Static registry imports pulled 3D stack into landing | Route-level code splitting |
| (bundle) | Route-level code splitting, design-token consolidation, typed registry | Done |

### Resolved by V02 Phase A (2026-09-01)

| ID | Item | Resolution |
|---|---|---|
| V2-1 | `docs/TECH_DEBT.md` missing | This ledger recreated |
| V2-2 | Font subsetting to latin-only | `@fontsource/*/latin-*.css` only — ~57% fewer font files |
| V2-8 | ErrorFallback hardcoded hex | `LoadingScreen.tsx` error UI moved onto the palette |

### Resolved by V02 Phases B–F (2026-09-01)

| ID | Item | Resolution |
|---|---|---|
| V2-4 | Zenith feature loose ends | `AtmosphereTimeline` consumes `SkyKeyframe.meta.dateLabel`; orphan skies + scratch files deleted |
| V2-5 | `hotspot.anchor` dead config | **Superseded:** the serpent-head hotspot feature (in-scene marker, "Tap serpent head" link, popup dialog) was removed from lesson 01 as a design decision. The `hotspot` field and `hotspotAnchor` were dropped from the core types and `sampleAtmosphere`; `HOTSPOT_ANCHORS` and the dialog UI are deleted. |
| V2-9 | Accessibility gaps | `prefers-reduced-motion` honored; touch targets ≥ 24 px; skip links on landing + lesson; `select-none` removed from lesson/overlay roots; global `:focus-visible` ring; contrast audit passes WCAG AA. (The hotspot dialog's focus management was removed with the hotspot feature — see V2-5.) |

### Resolved by V02 cleanup pass (2026-09-01)

| ID | Item | Resolution |
|---|---|---|
| V2-3 | `LearningMaterial/lesson_01.md` missing | Restored byte-exact from git blob `f507112b` (the file was deleted as collateral in `8505f18`); one copy drift fixed in `config.ts` — the 584-day line now reads "Venus synodic cycle" per the vetted doc's caution (584 is the synodic period as observed from Earth, not the orbital period). |
| V2-6 | `@` path alias unused | Alias stripped from `vite.config.ts` + `tsconfig.json` — zero imports used it |

## How to add to this file

- New issues get a `V2-N` id and land in the active section, ranked.
- When a fix ships, move the entry to "Resolved" with a one-line resolution.
  Don't delete the entry — the history is the point.
