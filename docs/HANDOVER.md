# HANDOVER — start here

Last updated **2026-10-20**. This is the "what is the state of play right now" document.
Permanent rules are in `AGENTS.md`; the project overview is in `docs/PROJECT.md`.

**Written for an agent with only this repository** (no access to the owner's machine, Notion or
chat history). Everything you need to continue is in git; §7 lists the few things that are
deliberately _not_, and how to proceed without them.

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

`.claude/launch.json` (committed) defines the `vite-dev` preview config for Claude Code. (The owner
also keeps an untracked, Firefox-path-hardcoded `scripts/launch-dev.bat` on their own laptop; you
do not need it.)

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
  Untracked/ignored on the owner's machine and absent from a clone: `node_modules`, `dist`,
  `*.log`, `scripts/launch-dev.bat`. None are needed.
- Known debt is ranked in `docs/TECH_DEBT.md`; sequencing in `docs/ROADMAP.md`.

## 7. Off-repo context (what git does not carry)

Knowledge that used to live only in the owner's machine or tooling, written down here.

**Asset pipeline.** The owner authors 3D and media in their own working tree (Blender sources,
Magnific/ComfyUI outputs, source PDFs) and commits only _shipped, config-referenced_ files into
`public/assets/`. You cannot create or fetch the missing site GLB. Do not fake it.

**What you can and cannot do without the owner:**

| Item                                                                        | Remote agent?                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 8 steps 1–2 (GLB swap, `onReady`, `BuildingGlow`, delete stand-ins)    | **Blocked** on `Lesson02_Site_v001.glb`. You may write `ModelLoader.onReady` and `BuildingGlow.ts` ahead of time (lesson-agnostic, typechecked against the stand-ins), but do not delete the stand-ins or `Uaxactun_v003.glb` until the real file is committed. |
| Sky framing re-tune (`config.ts` `scale`/`panY`/`rotation`)                 | Possible with the dev server, but judge the horizon against the **final** 3D ground, so ideally after the GLB lands.                                                                                                                                            |
| `SunDisc` visual check vs. real temples                                     | After the GLB lands.                                                                                                                                                                                                                                            |
| Owner copy review of kid strings                                            | **Owner only.** Do not change `STEP_COPY` wording without them; flag any suspected scholarly slip instead.                                                                                                                                                      |
| Docs, refactors that keep `typecheck`/`lint`/`build` green, a11y/perf fixes | Yes, within `AGENTS.md`.                                                                                                                                                                                                                                        |

If the GLB has landed in git, the first commit that adds it tells you the owner's naming; verify
node names `E-I`/`E-II`/`E-III` and centres within 0.5 m of `BUILDINGS` in `site.ts`. If they are
off, report coordinates back instead of editing `site.ts`.

**Source material.** Vetted lesson text is in `LearningMaterial/lesson_01.md` and `lesson_02.md`
(tracked). The scholarly PDF (`Archaeoastronomy_in_the_Ancient_Americas.pdf`) is tracked too.
Keep the evidence-vs-interpretation tone. Lesson 02 shows the Group E alignment as **perfect by
owner decision** (the Šprajc debate is a single gentle line); do not "correct" that.

**Notion control base.** Project page `https://app.notion.com/p/3547cc95844d81569725c5a3b024056a`
(Overview, Next Steps, Dev Tasks DB, Curriculum DB). Last synced 2026-09-01; it does not yet
know about the Lesson 02 Uaxactún pivot. If you do have Notion access, update Next Steps and
Dev Tasks; if not, leave it for the owner. API gotchas: `page_id`/`data_source_id` must be bare
UUIDs (no URLs or `collection://`); `replace_content` takes `new_str` and fails unless child
pages/databases are re-referenced; wrap Windows paths in backticks or the parser eats the
backslashes.

**Hosting.** Static SPA, no env vars or backend. The owner deploys to Cloudflare Pages (build
`npm run build`, output `dist/`); no deploy config is in the repo. Do not merge to `main`
(which may auto-deploy) until the §4 gates are met.

**Line endings.** The owner's Windows git uses `core.autocrlf=true`; files in the repo are LF.
If `prettier --check` flags CRLF files on a Windows checkout, that is the cause; do not
mass-renormalise.

**Dev server port.** `npm run dev` binds 3000. If it is busy, Vite moves to the next port;
kill only a server you started.

**Historical docs.** `docs/archive/v02/` and old `V02_*`/`V2-*` references are records of the
earlier redesign; do not edit them to match later changes.
