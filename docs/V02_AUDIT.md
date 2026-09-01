# V02 AUDIT — Maya Archaeoastronomy

Baseline: V01 as shipped at commit `8505f18` plus the **uncommitted working-tree changes**
(the in-progress Zenith topic feature). Audit date: 2026-09-01.

## Evidence key

Every claim below is tagged with how it was established:

- **[code]** — inferred from source inspection (architecture, styles, component logic).
- **[runtime]** — observed at runtime this session (dev server boot, HTTP 200, build/typecheck/lint output).
- **[not-verified]** — could not be visually confirmed. **No browser-based visual inspection was
  performed this session.** Anything about how the rendered page *looks* is code-inferred, not observed.

---

## Executive Assessment

V01 is a **disciplined, well-architected single-lesson 3D learning experience**. The
engineering is genuinely strong: config-driven lessons, a single-writer state model
(ADR-001), route-level code splitting, demand-driven rendering, self-hosted assets, and a
documented regression history. The build is clean (`tsc` 0 errors, lint 0 errors / 3
documented warnings, `vite build` succeeds).

The product gap is **presentation, not engineering**. The landing page reads as a generic
SaaS template (badge → headline → paragraph → feature pills → card grid → gradient CTA
buttons), and the lesson page stacks four simultaneous UI regions over the 3D scene
(header, curriculum toggle, drawer with tabs, footer dashboard, plus a hotspot popup).
The 3D scene — the product's reason to exist — is visually crowded by its own interface.
The Atmosphere Timeline is a genuinely novel pedagogical device and should remain the
centerpiece; the work is to make everything around it feel like a serious digital
archaeological observatory rather than an app dashboard.

The working tree contains a coherent, **uncommitted in-progress feature** (Zenith topic
with its own focused timeline, `directionalIntensity` plumbing, `meta` fields, two new
unreferenced sky assets). This audit treats that work as part of the baseline and flags
its loose ends; it must be preserved, not overwritten.

---

## Product Experience

**What the product is** [code]: an interactive 3D learning platform presenting Maya
monumental architecture and its astronomical/calendrical alignments through cinematic,
fixed-camera WebGL scenes. Lesson 01 (Temple of Kukulkán / El Castillo) is the only
shippable lesson; Lesson 02 (El Caracol) is a `coming-soon` stub.

**Learner** [code]: a general/interested audience, not a specialist. Difficulty
"Introductory", 15-minute study, scholarly-caution tone preserved in copy.

**Intended experience** [code]: enter a monument, investigate its astronomical phenomena
through a continuous "Atmosphere Timeline" that visibly moves the sun and sky, with
curriculum content alongside.

**Current lesson flow** [code]: Landing (`/`) → catalog card → Lesson (`/lesson/01`) →
scene + curriculum drawer (open by default) + footer dashboard (slider/callout/astro
data) → topic pills switch between Serpent Descent / Zenith / Calendar.

### Already strong

- **The Atmosphere Timeline is the product's soul.** A continuous slider whose in-between
  states are the feature (the sun visibly swings, the sky crossfades). This is a
  museum-grade interaction idea, correctly implemented as a single writer with pure
  derivation.
- **Focused topics** (Serpent Descent, Zenith) scope the timeline to their own keyframes —
  the config model cleanly supports per-topic pedagogy.
- **Scholarly caution is preserved** in copy (evidence vs. interpretation kept distinct).
- **Fixed cinematic camera** — no orbit/zoom; the scene is composed, not explored. Right
  call for this product.
- **Loading screen + error boundary + retry** with cache eviction on retry [code].

### Weak

- **No onboarding.** The lesson opens with the curriculum drawer open and the slider at
  step 1. A first-time learner is not told what they're looking at or what to do; the
  only guidance is a small "→ Drag to Step 2…" prompt line [code].
- **The Calendar topic has no interactive element.** `showFocusedUI` is false for it, so
  the footer dashboard (and the slider) is not rendered — the learner sees a static scene
  and a text panel only [code].
- **No in-lesson navigation between lessons** (only "All Lessons" back) [code].
- **One real lesson.** The catalog shows two cards, one locked. Fine for V01; the design
  must not assume a richer catalog exists yet.

---

## Visual / UI

### Hierarchy, typography, spacing [code]

- **Palette is coherent and appropriate**: `maya.bg #090b10`, `surface #121622`,
  `surfaceHover #1b2133`, gold `#d4af37` / `goldLight` / `goldDark`, text `#e6dfd3`,
  `textDim #a39e93`, `cream #f5ecd7`. Dark, warm, gold-accented — a good archaeological
  night-sky base. **Keep it.**
- **Type trio is right**: Cinzel (serif, inscription character) for headings, Plus Jakarta
  Sans for UI/body, JetBrains Mono for metadata. **Keep it.**
- **Weaknesses** [code]:
  - **Excessive glassmorphism**: `backdrop-blur` on nearly every panel (header, drawer,
    footer dashboard, badges, pills). Against the V02 design principles.
  - **Excessive rounded containers**: `rounded-xl`/`rounded-2xl` on almost everything,
    including small badges and buttons. Flattens the editorial character.
  - **Very small type**: `text-[9px]` (timeline step labels), `text-[10px]`/`text-[11px]`
    throughout. Below comfortable reading size in places.
  - **Dense stacking**: the lesson page renders header + curriculum toggle + drawer +
    footer dashboard simultaneously; the drawer alone has tabs, topic pills, a summary
    block, a details list, and a key-fact box.
  - **Gradient CTA buttons** ("Launch 3D Experience", the slider fill, the loading bar)
    read as SaaS/game UI, not observatory UI.
  - **Decorative animation**: `animate-pulse` on the "Available Now" dot, `animate-ping`
    on the loading ring — motion without UX purpose.
  - **ErrorFallback uses hardcoded hex** (`#0d0707`, `#f8d7da`, `#8b2323`) inconsistent
    with the palette — registered debt per AGENTS.md.
  - Landing hero is the generic badge→headline→paragraph→pills pattern; the header
    "Mesoamerican Horizons" pill and footer "Documentation"/"Archaeological Sources"
    spans are decorative (not links) [code].

### Composition [code]

- The 16:9 cinematic letterbox on the lesson page is a deliberate, good framing choice.
- The footer dashboard's three-column layout (callout · slider · astro data) is a sound
  structure; on `md` screens the columns squeeze, and on mobile it stacks into a tall
  block over the scene.

### Visual consistency [code]

- Strong: palette and type are used consistently; no hex drift except ErrorFallback.
- Weak: the "Available Now" emerald badge and the red error UI are off-palette (intentional
  status colors, but they clash with the warm gold system).

---

## UX

### Strong [code]

- **Single-writer slider** (ADR-001): one control, everything derives. Clean mental model.
- **Eased step sweep** (~0.6 s): the in-between transition is the feature.
- **Keyboard support** on the slider (arrows, Home/End) with `role="slider"` + aria values.
- **Hotspot popup is user-opened** (no auto-open) — correctly fixes the "Step 2 feels
  broken" regression.
- **Topic switch resets the timeline** to a sensible position per topic.
- `aria-live="polite"` on the callout region.

### Weak [code]

- **Discoverability of the timeline**: it lives in the footer dashboard, which only
  renders for focused topics. Nothing on first entry points the learner at it except the
  small prompt line.
- **No entry narrative**: no "what you'll investigate" framing before the scene loads.
- **Overlay has no loading state** (`Suspense fallback={null}`) — it pops in after the
  scene, which can feel like a layout jump.
- **Drawer + footer dashboard compete for vertical space** on the 16:9 frame; on short
  viewports the drawer's `max-h-[calc(100vh-140px)]` and the dashboard can crowd the scene.
- **No reduced-motion handling** for the sweep/fade animations.
- **No focus management** for the hotspot dialog (no trap, no Escape-to-close, no focus
  restore).

---

## 3D Experience

### Strong [code]

- **Fixed cinematic camera** baked from GLB authoring data — deliberate, documented, correct.
- **`frameloop="demand"`** — a static scene does not redraw forever; drags/sweeps still
  animate one frame per update.
- **Dual-dome sky crossfade** with the depth-testing regression documented and fixed.
- **IBL crossfade** via canvas compositing + on-the-fly PMREM, with per-keyframe caches so
  steady state does no per-frame work. Clever and correct.
- **One directional light + IBL fill**; no ambient/hemisphere. Vertex-color guard preserved.
- **Draco-compressed GLBs, self-hosted decoders**, per-URL drei caching, asset cleanup on
  route change.

### Weak [code]

- **The scene is fully static** — no subtle life (no atmospheric drift, no gentle sky
  rotation). The V02 direction calls for "subtle transitions" and "immersive 3D
  presentation"; any motion must be justified and must not add render-loop work.
- **No in-scene affordance for the hotspot.** `StepCallout.hotspot.anchor`
  (`'serpent-head' | 'temple-summit' | 'staircase-base'`) is defined in the types and
  populated in config but **never consumed** — the learner is told to "tap the serpent
  head" via a text link with no visual marker in the scene [code].
- **No camera response to topic changes** — switching topics swaps sky/sun only. A subtle
  camera settle could help, but only if it can be done without per-frame work.
- **16:9 letterboxing** means large empty bars on ultrawide and a small frame on portrait
  phones [code].

---

## Code Architecture

### Strong [code]

- **Layering is clean**: `pages → lessons → core`; `core/` imports nothing from
  `lessons/`/`pages/`.
- **Config-driven lessons** with no special-casing in page/core code; `requireModel`
  fails loudly on config/scene desync.
- **ADR-001 state model is exemplary**: one runtime value, pure derivation, no store.
- **Route-level code splitting** keeps the landing free of the 3D stack.
- **TypeScript strict**, no `any` in the current tree (the old `runtimeState: any` is
  gone from `registry.ts`).
- **Comments explain WHY**, including regressions; the load-bearing comments are intact.
- Small, focused components; no speculative abstractions.

### Weak / loose ends [code]

- **In-progress Zenith feature gaps** (uncommitted):
  - `SkyKeyframe.meta.dateLabel`/`days` are defined and populated, and the config comment
    claims they drive the timeline step labels — but `AtmosphereTimeline` does **not**
    read `meta`; it uses `callout.label ?? name`. The Zenith labels currently come from
    `callout.label` ("Zenith 1 / Summer Solstice / Zenith 2"), not the dates.
  - `03after.webp` and `04.webp` are **unreferenced** (orphans pending the feature's
    completion). `03before.webp` is referenced by the Zenith solstice keyframe.
  - `overlay-raw.txt` (a scratch copy of an experimental overlay importing a
    `ZenithDateScrubber` component that does not exist in the tree) and `tsc-output.txt`
    (empty) sit in the repo root.
- **`hotspot.anchor` is dead config** (defined, populated, never rendered).
- **`@` path alias** is configured in `vite.config.ts`/`tsconfig.json` but unused.
- **`Lesson02` reuses `Lesson01Scene`** as a placeholder — harmless today (the
  coming-soon guard prevents render) but a latent trap if the guard is ever removed.
- **`AGENTS.md` is stale on two points**: it still lists `runtimeState: any` in
  `registry.ts` and unused `clsx` as registered debt — both are already resolved.
- **`docs/TECH_DEBT.md` does not exist** despite being referenced by CLAUDE.md,
  AGENTS.md, PROJECT.md, ARCHITECTURE.md, and ROADMAP.md. The debt ledger is missing.
- **`LearningMaterial/` does not exist** despite PROJECT.md citing
  `LearningMaterial/lesson_01.md` as the vetted source text.

---

## Performance

Measured this session [runtime]:

| Item | Size | gzip |
|---|---|---|
| Landing main chunk (`index-*.js`) | 191.95 KB | 62.42 KB |
| 3D stack (`Gltf-*.js`, three/drei/R3F) | 889.98 KB | 239.86 KB |
| `LessonPage` chunk | 17.88 KB | 6.57 KB |
| `Lesson01Scene` chunk | 5.49 KB | 2.35 KB |
| `Lesson01Overlay` chunk | 16.65 KB | 4.46 KB |
| CSS | 77.97 KB | 33.26 KB |
| **Fonts (all subsets)** | **~450 KB raw** | — |

- Build succeeds; the only Vite warning is the known three.js chunk-size warning [runtime].
- **Font subsetting is the clearest measurable win**: `@fontsource/*/400.css` imports ship
  **all** unicode subsets (latin, latin-ext, cyrillic, greek, vietnamese) for every weight
  of all three families — ~40 font files, most never used by English content. Importing
  only `latin-*.css` subsets would cut this to roughly a third with zero visual change.
- Assets: 01.webp 616 KB, 02.webp 772 KB, 03.webp 992 KB, 03before.webp 960 KB,
  03after.webp 960 KB, 04.webp 892 KB; GLBs Floor 352 KB / Layout 1.9 MB / Trees 1.2 MB.
- GPU memory: ~8.4 MB decoded per panorama + PMREM; the lesson preloads 3–4 skies up
  front (~25–33 MB resident) — accepted and documented (TECH_DEBT L6), with cache
  eviction on route change.
- Route splitting is intact: the landing page never pulls the 3D stack [code + build].

### V02 Phase F re-measurement (2026-09-01) [runtime]

| Item | V01 | V02 (after Phases A–F) | Δ |
|---|---|---|---|
| CSS | 77.97 KB / 33.26 KB gzip | 30.38 KB / 6.23 KB gzip | **−61% raw** |
| Landing main chunk | 191.95 KB / 62.42 KB gzip | 189.02 KB / 61.91 KB gzip | −1.5% |
| `Lesson01Overlay` chunk | 16.65 KB / 4.46 KB gzip | 19.57 KB / 5.26 KB gzip | +18% (field guide + a11y) |
| Fonts | ~40 files / ~450 KB raw | 19 latin files | −57% files |
| Orphan assets | 03after.webp + 04.webp (~1.9 MB) | deleted | — |

- Landing initial load ≈ 61.91 KB JS + 6.23 KB CSS + latin fonts — comfortably under the
  ~400 KB gzip budget. The lesson page adds the lazy 3D stack (239.86 KB gzip) plus the
  Draco GLBs (Floor 352 KB / Layout 1.9 MB / Trees 1.2 MB) — the GLBs are the dominant
  payload and are an asset-authoring concern, not a code one.
- The overlay chunk grew ~3 KB because the field-guide panel and a11y wiring are now in
  the bundle; it still loads in parallel with the scene and is negligible.

---

## Accessibility

### Present [code]

- `role="slider"` with `aria-valuemin/max/now/text`, keyboard arrows/Home/End.
- `aria-live="polite"` on the callout; `aria-expanded`/`aria-controls` on the curriculum
  toggle; `role="dialog"` + `aria-labelledby` on the hotspot; `aria-label`s on step
  markers; `alt` on card images; semantic `header/main/footer/aside/dl`.

### Missing / weak [code]

- **No skip link.**
- **No focus management** for the hotspot dialog (no trap, no Escape, no focus restore).
- **No `prefers-reduced-motion`** handling for the sweep and fade animations.
- **Small touch targets**: step markers are 12 px, the slider thumb 16 px (WCAG 2.5.8
  recommends ≥ 24 px).
- **Tiny text**: 9–11 px labels in several places; `textDim` at those sizes is hard to
  read.
- **`select-none` on the lesson page root** — learners cannot select/copy the educational
  text.
- **No non-visual alternative for the 3D phenomenon itself** (the overlay carries the
  content, which is good, but the scene has no description).
- Contrast is likely acceptable for the main text pairs (textDim on surface ≈ 5.5:1) but
  was not measured; gold-on-goldLight combinations need a check [not-verified].

---

## Technical Debt

`docs/TECH_DEBT.md` is **missing** (referenced everywhere, absent from disk). The audit
reconstructs the known ledger from ROADMAP.md / ARCHITECTURE.md / AGENTS.md references:

**Resolved (per ROADMAP):** H1/H4 (ADR-001), H3 (code splitting), M2–M9 (dead code,
requireModel, FixedGlbCamera ref), L2 (error-boundary cache eviction), L4 (Color reuse),
L5 (self-hosted fonts — **half**: subsetting remains), L6 (asset cleanup), C2
(frameloop="demand").

**New / open debt found this session:**

| ID | Item | Rank |
|---|---|---|
| V2-1 | `docs/TECH_DEBT.md` file missing — the ledger itself | P1 |
| V2-2 | Font subsetting: ~450 KB of unused cyrillic/greek/vietnamese subsets shipped | P1 |
| V2-3 | `LearningMaterial/` missing despite being the cited source of truth | P1 |
| V2-4 | In-progress Zenith feature loose ends (meta unconsumed, orphan skies, scratch files) | P1 (process) |
| V2-5 | `hotspot.anchor` dead config | P3 |
| V2-6 | `@` alias unused | P3 |
| V2-7 | AGENTS.md stale references (runtimeState: any, clsx) | P3 |
| V2-8 | ErrorFallback hardcoded hex off-palette | P3 |
| V2-9 | No reduced-motion support; small touch targets | P2 |
| V2-10 | Lesson02 reuses Lesson01Scene as placeholder | P3 |

---

## Recommended Priorities

**P0 — Critical:** none. The app builds, typechecks, lints, and serves.

**P1 — High:**
1. **Preserve and land the in-progress Zenith work** (it is the current feature; the
   audit must not disturb it). Complete the `meta` → timeline-label consumption so the
   config's stated behavior matches reality.
2. **Recreate `docs/TECH_DEBT.md`** — the debt ledger is the project's governance; its
   absence is a real gap.
3. **Font subsetting to latin-only** — measurable, low-risk performance win.
4. **Landing page redesign** toward the "digital archaeological observatory" direction
   (Phase B): retire the SaaS-template hero and gradient CTAs.

**P2 — Medium:**
5. **Lesson overlay de-densification** (Phase C): fewer simultaneous panels, editorial
   callout, restrained controls; give the Calendar topic an interactive surface.
6. **Accessibility pass** (Phase E): focus management, reduced motion, touch targets,
   skip link, text size floor.
7. **3D presentation polish** (Phase D): in-scene hotspot affordance (consume `anchor`),
   subtle justified motion only.

**P3 — Low:**
8. Dead-config cleanup (`hotspot.anchor` if unused after Phase D, `@` alias), AGENTS.md
   doc drift, ErrorFallback palette, scratch-file hygiene.

---

## What was NOT verified

- **No visual inspection was performed.** All "looks" claims are code-inferred. The
  rendered appearance of the landing page, the lesson overlay, the 3D scene, the
  crossfade quality, and responsive behavior at various viewports were **not observed**.
- The dev server boots and serves the landing HTML (HTTP 200) [runtime]; the lesson
  route and 3D scene were not exercised in a browser this session.
- Contrast ratios were not measured.
