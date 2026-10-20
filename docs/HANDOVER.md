# HANDOVER — start here

Last updated **2026-10-20**. This is the "what is the state of play right now" document.
Permanent rules are in `AGENTS.md`; the project overview is in `docs/PROJECT.md`.

## 1. Get running (new session / new clone)

```bash
git fetch origin
git checkout feature/lesson02-uaxactun-sunrise   # all active work is on this branch
git pull
npm install                                       # Node 24 (the check scripts run .ts directly)
npm run dev                                       # http://localhost:3000
```

Open `http://localhost:3000/lesson/02` (add `?step=3` to jump to a key date and skip the
prediction lock). Lesson 01 is `/lesson/01`.

On the owner's Windows laptop, the untracked `scripts/launch-dev.bat` starts the dev server (if
port 3000 is free) and opens Firefox. It hardcodes a Firefox path, so it is deliberately **not**
committed. `.claude/launch.json` (committed) defines the `vite-dev` preview config for Claude Code.

Validation (there are no tests and no CI):

```bash
npm run typecheck && npm run lint && npm run build
node scripts/check-sunrise.ts     # sunrise astronomy + Lesson 02 sun path/prediction asserts
node scripts/check-tour.ts        # Lesson 01 tour sampler
```

Baseline on 2026-10-20: typecheck clean, lint 0 errors / **3 pre-existing warnings**
(`ModelLoader.tsx:127`, `SceneEnvironment.tsx:106` and `:225`, all documented StrictMode-safe
patterns), both check scripts pass.

## 2. Branches

| Branch                                                      | State                                                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                                                      | Lesson 01 complete (incl. Calendar & Architecture blueprint tour, PR #4). **No Lesson 02 work.**                                                                    |
| `feature/lesson02-uaxactun-sunrise`                         | **Active.** Lesson 02 Tasks 0–7 done plus the dawn sky and thumbnail (Task 8, partial). Pushed to origin. Do **not** merge until the final site GLB lands (see §4). |
| `feature/architecture-blueprint-tour`, `lesson01uiredesign` | Merged/historical.                                                                                                                                                  |
| `backup/pre-dist-purge`, `origin/archive/legacy-v1`         | Archive. Ignore.                                                                                                                                                    |

## 3. What exists (Lesson 02 — "Group E at Uaxactún: Watching the Sunrise")

A kids' (~8–11) lesson. One slider (`sliderPosition` 1–5, ADR-001) runs one solar year,
December solstice → December solstice, through five key dates. The sunrise point slides along
the eastern horizon in a 3D view (fixed camera on E-VII-sub looking due east) and in a 2D SVG
plan view. At each key date the matching building (E-III / E-II / E-I / E-II / E-III) is
highlighted with a callout. Before exploring, the child predicts where the June sun will rise
by tapping the plan-view arc; the June callout then compares the guess. One gentle evidence
line says scientists still discuss how Group E was used. No audio. The alignment is shown
perfect by owner decision.

Files (`src/lessons/lesson02/`):

| File                   | Role                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `config.ts`            | `LessonConfig`: copy (`STEP_COPY`), 5-keyframe `skyTimeline`, one model, fixed camera, `status: 'available'`                             |
| `site.ts`              | Observer (-40, 0), eye height 11.5, building positions E-I (35, -34.4) / E-II (35, 0) / E-III (35, +34.4). North = -Z, east = +X         |
| `sunPath.ts`           | Pure: slider position → day → declination → azimuth; `KEY_DATES`, `activeKeyDate`, prediction clamp/judging, `SUN_ELEVATION_DEG = 8`     |
| `Lesson02Scene.tsx`    | Camera, env, light, site GLB, stand-ins, `SunDisc`. Sun direction derived from position; keyframe `lightRotation` is unused by the scene |
| `SunDisc.tsx`          | Emissive disc placed by refs in a dependency-guarded effect; renders with `depthTest=false` (see §5)                                     |
| `StandInBuildings.tsx` | **Temporary** boxes for E-I/E-II/E-III, with glow. Deleted in Task 8                                                                     |
| `PlanView.tsx`         | SVG plan; pointer → SVG via `getScreenCTM().inverse()` because the overlay is CSS-scaled by `ViewportScaler`                             |
| `Lesson02Overlay.tsx`  | Info panel, prediction flow (overlay-local state), core `AtmosphereTimeline`, callouts; reads `?step=` itself                            |

Core addition: `src/core/utils/sunrise.ts` (pure `sunriseAzimuthDeg`, `sunDirection`,
`sunLightRotation`; no imports so Node can run it). Registry lazy-loads the Lesson 02 scene and
overlay, so the landing page still does not pull in the 3D stack. `pages/` and the other core
files have no Lesson 02 special cases.

Key numbers: latitude 17.394° N; sunrise azimuths 114.64° / 90° / 65.36° / 90° / 114.64°;
tappable prediction arc 30°–150°; judging ±5° "Right on!", ±15° "Close!".

Source of truth for all copy: `LearningMaterial/lesson_02.md` (vetted, reviewer decisions at the
end). Design: `docs/superpowers/specs/2026-10-17-lesson02-uaxactun-sunrise-design.md`. Plan with
task list: `docs/superpowers/plans/2026-10-17-lesson02-uaxactun-sunrise.md`.

## 4. What is left (Task 8 and gates)

Done since the last plan update: owner delivered `dawn_v001.webp` (2048×1024, referenced by all
five keyframes in `config.ts`) and a new `lesson-02-thumb.webp`. The temporary Lesson 01 sky is gone.

Still open, in order:

1. **Owner delivers `Lesson02_Site_v001.glb`**: Draco GLB with separately named nodes `E-I`,
   `E-II`, `E-III` at the §4 positions of the spec, E-VII-sub left out (decision 2026-10-17).
   Working files: `L:\Projects\EDU\EduTech\Maya_Archaeoastronomy\working-assets\lesson-02-sky-atlas\`
   (`3d-assets\blender-source\layout_v003.blend`). Not in git. Blender coordinates are
   E-I (35, +34.4), E-II (35, 0), E-III (35, -34.4), observer (-40, 0).
2. **Task 8 implementation** (details in the plan): verify the node centres match `BUILDINGS`
   within 0.5 m (if not, return coordinates to the owner, do not edit `site.ts`); add the
   optional `ModelLoader` `onReady(root)` prop (lesson-agnostic; keep the vertex-colour guard);
   add `BuildingGlow.ts` (clone materials once, never mutate cached GLTF materials); delete
   `StandInBuildings.tsx` and `Uaxactun_v003.glb`; point `config.ts` at the new GLB.
3. **Re-tune the sky framing** in `config.ts` (`scale`, `panY`, `rotation`). These are still
   Lesson 01's horizon values and were **not** re-tuned for `dawn_v001.webp` — check the horizon
   against the 3D ground at every key date.
4. **Visual check of `SunDisc`** against real building geometry (see §5).
5. **Owner copy review** of the kid strings (`STEP_COPY` in `config.ts` and the overlay constants).
   Gate before shipping; not yet confirmed done.
6. Final checks (typecheck, lint, build, both scripts, manual pass of spec §7, Lesson 01
   unchanged, no 3D chunk or GLB requested from `/`), confirm no orphaned asset, commit
   `feat(lesson02): final Group E site, dawn sky and thumbnail`, then merge via
   `superpowers:finishing-a-development-branch`. Then update `docs/` status lines and the Notion page.

## 5. Gotchas that cost time

- **The overlay is CSS-scaled** (`ViewportScaler`, 1280×720 design space). Never convert pointer
  positions with raw `clientX` math; use `getScreenCTM().inverse()` (PlanView does).
- **`SunDisc` uses `depthTest=false`** so the disc is visible over canopy. With the real temples
  it might paint over their roof combs. If so, lower `SUN_ELEVATION_DEG` or use depth-tested
  rendering with `renderOrder`.
- The disc must stay inside the 500 m skydome and the camera far plane (1000), or it vanishes silently.
- Out-of-range / NaN slider positions must still give a valid date and azimuth (asserted in `check-sunrise.ts`).
- `?step=` deep links skip the prediction lock by design; the overlay owns that logic.
- `frameloop="demand"`, no `useFrame`, one directional light + IBL, no ambient light — unchanged
  and enforced in `AGENTS.md`.
- Windows: git warns "LF will be replaced by CRLF" on some files. Harmless; do not mass-renormalise.
- Skies are LDR WebP, not HDR. Do not call them HDR.

## 6. Housekeeping state

- `.claude/settings.local.json` is machine-local permissions, **not committed** (ignored).
- Notion control-base page (see memory `notion-control-base`) was last synced 2026-09-01 and
  does not yet know about Lesson 02's Uaxactún pivot. Update its Next Steps and Dev Tasks.
- Known debt is ranked in `docs/TECH_DEBT.md`; sequencing in `docs/ROADMAP.md`.
