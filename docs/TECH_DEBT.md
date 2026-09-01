# TECH DEBT — Maya Archaeoastronomy

Ranked known issues. Sequencing lives in `docs/ROADMAP.md`; locked decisions in
`docs/DESIGN_DECISIONS.md`. This ledger was recreated on 2026-09-01 (V02 Phase A) —
the original file was missing despite being referenced by CLAUDE.md / AGENTS.md /
PROJECT.md / ARCHITECTURE.md / ROADMAP.md. Historical items are reconstructed from
those references; new items carry the `V2-` prefix.

## Resolved (historical, per ROADMAP / ARCHITECTURE)

| ID | Item | Resolution |
|---|---|---|
| H1 | Dev panel ↔ runtimeState dual source of truth | ADR-001 — single-writer slider, derived sample |
| H3 | Static registry imports pulled the 3D stack into the landing page | Route-level code splitting (lazy scene/overlay) |
| H4 | Dev tooling load-bearing for production boot | ADR-001 — hardcoded keyframes, no dev tooling ships |
| M2 | Orphan asset `01 - Copy.webp` (955 KB shipped) | Deleted |
| M3/M4/M6/M8 | Dead code (vite middleware alias, `clsx`, `onLoaded`, `customSceneRenderer`, `CameraConfig.source`, `LearningTopic.icon`, stray `scene.background` cleanup) | Removed, each verified by grep |
| M5 | `FixedGlbCamera` non-null assertion / exhaustive-deps disable | Config captured into a mount-time ref |
| M9 | `find(...)!` assertions on hard-coded model ids | `requireModel(id)` throws on config/scene desync |
| L2 | Failed `useGLTF` promise stays cached as rejected | Error boundary evicts lesson GLTFs on retry |
| L4 | Per-render `Color` allocation in `SceneEnvironment` | Reusable `Color` instance mutated by memoized tint |
| L5 | Google Fonts `<link>` render-blocking | Self-hosted `@fontsource` imports (subsetting was the remaining half — see V2-2) |
| L6 | GPU memory grows unbounded across lesson visits | `useLessonAssetCleanup` evicts GLB + equirect caches on route change |
| C2 | Static scene redrawn every frame | `frameloop="demand"` |

## Open

### P1 — High

- **V2-3 — `LearningMaterial/` missing.** PROJECT.md cites
  `LearningMaterial/lesson_01.md` as the vetted source text, but the folder does not
  exist in the repo. The lesson copy in `config.ts` is the de-facto source; the vetted
  text must be located or recreated before content edits.

### P3 — Low

- **V2-6 — `@` path alias unused.** Configured in `vite.config.ts` + `tsconfig.json`,
  no imports use it.
- **V2-7 — AGENTS.md stale references.** Still lists `runtimeState: any` in
  `registry.ts` and unused `clsx` as registered debt; both are already resolved.
- **V2-10 — Lesson02 reuses `Lesson01Scene` as placeholder.** Harmless today (the
  coming-soon guard prevents render) but a latent trap if the guard is ever removed.

## Resolved by V02 Phase A (2026-09-01)

- **V2-1 — `docs/TECH_DEBT.md` missing.** This ledger recreated.
- **V2-2 — Font subsetting.** `main.tsx` now imports `@fontsource/*/latin-*.css` only.
  Build: CSS 77.97 → 29.10 KB raw (33.26 → 5.98 KB gzip); ~40 font files → 19, all
  latin. No visual change.
- **V2-8 — ErrorFallback hardcoded hex.** `LoadingScreen.tsx` error UI moved onto the
  palette (`bg-maya-bg`, Tailwind red status colors), matching the emerald/stone
  status-color convention used elsewhere.

## Resolved by V02 Phases C–F (2026-09-01)

- **V2-4 — Zenith feature loose ends.** `AtmosphereTimeline` now consumes
  `SkyKeyframe.meta.dateLabel` as the primary step label (Phase C); the orphan skies
  `03after.webp` / `04.webp` and the `overlay-raw.txt` / `tsc-output.txt` scratch files
  were deleted (Phase F).
- **V2-5 — `hotspot.anchor` dead config.** `AtmosphereSample` now carries
  `hotspotAnchor` (derived in `sampleAtmosphere`); `Lesson01Scene` renders an in-scene
  gold marker at the anchor position (Phase D). The serpent-descent topic's Step 2 also
  gained the Kukulcán hotspot so the marker is reachable in the primary topic.
  **Superseded 2026-09-01:** the serpent-head hotspot (in-scene marker, "Tap serpent
  head" link, popup dialog) was removed from lesson 01 as a design decision. The
  `hotspot` field and `hotspotAnchor` were dropped from the core types and
  `sampleAtmosphere`; the `HOTSPOT_ANCHORS` map and dialog UI are deleted.
- **V2-9 — Accessibility gaps.** `prefers-reduced-motion` honored (sweep jumps, CSS
  fades disabled); touch targets ≥ 24 px (step markers, slider thumb); skip links on
  landing + lesson; `select-none` removed from lesson/overlay roots; global
  `:focus-visible` ring; contrast audit passes WCAG AA. Remaining: no automated a11y
  testing. (The hotspot dialog's focus management was removed with the hotspot feature —
  see V2-5.)
