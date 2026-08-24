# PROJECT — Maya Archaeoastronomy

## What the project does

An interactive 3D learning platform that presents Maya monumental architecture and its
astronomical / calendrical alignments through cinematic, fixed-camera WebGL scenes.
The current content is **Lesson 01 — Temple of Kukulkán (El Castillo, Chichén Itzá)**:
a 3D plaza reconstruction (floor, pyramid layout, tree canopy as separate Draco-compressed
GLBs) under a switchable equirectangular sky, paired with a curriculum overlay explaining
the 365-day Haab count, the equinox serpent-shadow phenomenon, the 52-year Calendar Round,
the 584-day Venus synodic period, and solar zenith passages.

Lesson 02 (El Caracol observatory) exists as a **config-only stub** (`status: 'coming-soon'`)
with no assets and a placeholder scene.

## Technology stack

| Area | Choice | Version (installed) |
|---|---|---|
| Build | Vite | 6.4.3 |
| Language | TypeScript (strict, `noUnusedLocals/ Parameters`) | 5.7 |
| UI | React | 18.3.1 |
| Routing | react-router-dom (2 routes + catch-all) | 6.29 |
| 3D | three + @react-three/fiber + @react-three/drei | 0.174.0 / 8.18.0 / 9.122.0 |
| Dev panel | leva *(removal scheduled — ADR-001)* | 0.9.36 |
| Styling | Tailwind CSS 3.4 + PostCSS + autoprefixer | — |
| Icons | lucide-react | 0.475 |
| Package manager | npm (package-lock.json) | — |

Scripts: `dev` (vite, port 3000), `build` (`tsc && vite build` — tsc type-checks, `noEmit`),
`preview`. **No lint, format, typecheck or test scripts. No eslint/prettier config, no CI.**

## Major features

- Landing page with lesson catalog (`/`) and lesson experience page (`/lesson/:lessonId`).
- Fixed cinematic camera baked from the GLB authoring camera (no user orbit/zoom — deliberate).
- Sky preset system: 3 equirectangular panoramas with per-preset IBL intensity and
  directional-light axis overrides, selectable from the learner overlay.
- Leva developer panel (Alt+D) with directional-light and IBL controls + lighting presets.
- Loading screen (drei `useProgress`) and a React error boundary with retry UI.

## Important constraints

- **Content accuracy matters.** `LearningMaterial/lesson_01.md` is the vetted source text;
  lesson copy deliberately distinguishes archaeological evidence from interpretation.
  Preserve that tone when editing content.
- Assets live in `public/assets/lesson_01/` (GLBs) with self-hosted Draco decoders in
  `public/draco/`. Sky panoramas are **LDR WebP (2048×1024), not HDR** despite UI labels.
- No environment variables, no backend, no persistence. Fully static SPA.

## Current project status

- Builds clean: `tsc --noEmit` passes, `vite build` succeeds (single 1.31 MB JS chunk,
  378 KB gzip; Vite warns about chunk size).
- **Git is initialized but has zero commits**; `.gitignore` covers only `node_modules`.
- Root contains leftover GLB-inspection scripts (`inspect_tree*.mjs`, `probe*`,
  empty `inspect_tree_output.txt`) from a past debugging session.
- See `docs/TECH_DEBT.md` for the ranked issue list and `docs/ROADMAP.md` for sequencing.
