# V02 DESIGN PLAN — Maya Archaeoastronomy

> **STATUS: SHIPPED 2026-09-01.** Phases A–F all landed on `main` via commit
> `88ce647`. This document is the design spec the implementation followed —
> kept as historical record, not active planning. See `docs/ROADMAP.md` for
> what's next and `docs/V02_VISION_REVIEW_REPORT.md` for the visual review.

Direction: **Digital Archaeological Observatory.**

The application should feel like an intersection of *Maya archaeology + archaeoastronomy +
observation + education + atmosphere* — closer to an interactive museum, a digital
archaeological observatory, a research visualization, an immersive educational
installation — than to a SaaS dashboard, a generic landing page, a game HUD, a
template-built educational app, or a cyberpunk interface.

This plan defines the intended V02 experience. It is the spec for the implementation
phases (A–F) that follow; it is not itself an implementation.

---

## 1. Design language

### 1.1 Typography hierarchy

Keep the existing three-family system (Cinzel / Plus Jakarta Sans / JetBrains Mono) — it
is already the right editorial voice. Refine the *scale and role*:

| Role | Family | Notes |
|---|---|---|
| Display / monument names | Cinzel (serif) | Large, letter-spaced, used sparingly — the "inscription" voice |
| Section headings | Cinzel | Smaller than display; never bold-heavy |
| Body / UI | Plus Jakarta Sans | The working voice; comfortable sizes (≥ 12–13 px) |
| Metadata / labels / data | JetBrains Mono | Uppercase, letter-spaced, small — the "field catalog" voice |

Rules:
- **Raise the text-size floor.** No `text-[9px]`/`text-[10px]` for anything a learner
  must read. Metadata may stay small (11–12 px) but must remain legible.
- **Editorial scale on the landing**: one large display statement, not a badge + heading
  + paragraph stack.
- **Metadata reads like a catalog entry**: `LESSON 01 · EL CASTILLO · CHICHÉN ITZÁ ·
  20.68° N` — mono, uppercase, gold, letter-spaced.

### 1.2 Spacing system

- **Generous.** The current UI is dense (p-4/p-5, stacked panels). V02 gives the scene
  room: larger gutters, fewer simultaneous panels, more whitespace between UI regions.
- Use a small spacing scale (4/6/8/12/16/24/32) consistently; no ad-hoc values.
- **One primary panel at a time** on the lesson page. The scene is the subject; the UI is
  a quiet frame around it.

### 1.3 Control language

- **Restrained.** The Atmosphere Timeline is the hero control; everything else is
  secondary.
- Buttons: flat, hairline-bordered, gold-accented on hover. **Retire the gradient-filled
  CTA buttons** ("Launch 3D Experience", the slider fill, the loading bar) — replace with
  solid gold on dark or bordered gold, no gradients.
- The slider keeps its current interaction model (drag = live, step click = eased sweep)
  — that is the product's signature interaction and must not change.

### 1.4 Panel language

- **Solid surfaces, not glass.** Reduce `backdrop-blur` to a minimum (a single top bar
  may keep a subtle blur; content panels use solid `maya-surface` with hairline
  `maya-gold/20–30` borders).
- Panels should read as **museum placards / field notebooks**: solid dark surface, thin
  gold rule, mono metadata header, serif title, body text. Not glass cards.
- **Reduce rounded-corner excess**: `rounded-xl`/`rounded-2xl` reserved for large panels;
  small elements (badges, buttons, markers) use `rounded`/`rounded-md` or none.

### 1.5 Button language

- Primary action: solid `maya-gold` text on dark, or bordered gold — one per view.
- Secondary: bordered, dim text, gold on hover.
- No gradients, no glow shadows, no `animate-pulse`.

### 1.6 Metadata language

- Mono, uppercase, letter-spaced, gold — the "field catalog" voice.
- Used for: lesson numbers, coordinates, dates, durations, status, astro data.
- The astro readout (azimuth/altitude/declination/time) is already in this voice — keep
  and refine it as an "observation log".

### 1.7 Visual density

- **Low.** The lesson page shows: slim top bar + one field-guide panel (collapsible) +
  the bottom timeline instrument. The hotspot popup appears only on demand.
- The landing shows: wordmark + one hero statement + the expedition catalog + footer.

---

## 2. Navigation

- **Keep the two-route structure** (`/` catalog, `/lesson/:id` experience). It is correct
  and the route-level code splitting depends on it.
- **In-lesson**: a slim top bar with back-to-catalog, lesson title + location, and (when
  a second lesson exists) prev/next. Today only "All Lessons" is needed.
- **Topic navigation** stays in the field-guide panel (pills), but the panel is
  collapsible and defaults to a state that does not cover the scene.
- No new routes, no URL params (deep-linked slider positions remain a future candidate,
  per ROADMAP 4.1).

---

## 3. Landing experience

The landing is the **observatory entrance**, not a SaaS hero.

- **Hero**: a large editorial statement in Cinzel ("Where Ancient Stone Encodes the Sky"
  is good — keep the line, change the staging). A quiet backdrop (the existing sky
  panorama, dimmed) instead of a blur-glow. One clear entry action ("Begin the
  investigation") rather than a badge + pills row.
- **Introductory content**: a short, calm paragraph on what the platform is — an
  interactive archaeological observatory for Maya celestial architecture. No feature
  pills.
- **Lesson discovery**: the catalog becomes an **expedition list** — numbered
  ("Expedition 01"), monument name in Cinzel, location + coordinates in mono, a
  one-line brief, status. Cards may remain but styled as field dossiers: solid surface,
  hairline border, no gradient CTA; the whole card is the entry point.
- **Visual hierarchy**: wordmark → statement → expeditions → footer. The footer's
  decorative spans become real links or are removed.

---

## 4. Lesson experience

The scene dominates; the UI is a quiet instrument panel.

- **Top bar** (slim): back, lesson number + monument name + location (mono metadata),
  and a single "Field Guide" toggle. No second header row.
- **Field Guide panel** (replaces the drawer + tabs): one collapsible panel with the
  topic pills and the selected topic's content (summary, details, key fact, scholarly
  caution). Defaults **closed** on entry so the scene is unobstructed; the timeline's
  callout carries the immediate pedagogy.
- **Bottom instrument** (the footer dashboard, refined): the three-part structure
  (callout · Atmosphere Timeline · astro data) is sound and stays, but:
  - The callout becomes more editorial: serif label, mono sublabel, the lines as a
    "field note" block.
  - The timeline step labels use `meta.dateLabel` when present (completing the
    in-progress Zenith work) — dates read as the primary label.
  - The astro data is a compact "observation log" (mono, right-aligned, gold values).
  - On the Calendar topic (no focused timeline), give the learner *something*: either a
    static observation readout or a gentle prompt to explore the other topics — never a
    dead panel.
- **Hotspot**: the "tap the serpent head" affordance gains an **in-scene marker** (a
  subtle, non-animated indicator at the `anchor` position) so the learner knows where to
  look. The popup keeps its user-opened behavior and gains focus management.
- **Loading**: the overlay should not pop in after the scene; coordinate a single
  loading state for scene + overlay.

---

## 5. Responsive experience

Intentional mobile behavior, not a shrink.

- **Desktop / widescreen**: the 16:9 cinematic frame stays; UI as a quiet frame.
- **Tablet**: field guide becomes a slide-over; the bottom instrument compresses to
  callout + timeline (astro data moves into the field guide or a second row).
- **Mobile (portrait)**: the 16:9 frame is too small to be the primary surface. Treat
  the scene as a **backdrop** and the UI as a **bottom sheet**: the timeline stays
  pinned as the primary control; the field guide becomes a full-width sheet; the astro
  data collapses into the sheet. The scene remains visible above the sheet.
- **Touch targets** ≥ 24 px (ideally 44 px for primary controls); the slider thumb and
  step markers grow.
- **Landscape phones**: keep the frame but allow the field guide to overlay.

---

## 6. Accessibility

- **Focus management**: the hotspot dialog traps focus, closes on Escape, restores focus
  on close. The field guide manages focus when it opens/closes.
- **`prefers-reduced-motion`**: disable the eased sweep's animation (jump to the step)
  and the fade-in animations.
- **Skip link** to the main content on both pages.
- **Touch targets** ≥ 24 px (WCAG 2.5.8); primary controls ≥ 44 px.
- **Text-size floor**: no sub-11 px reading text; metadata may stay small but legible.
- **Contrast audit** of gold-on-gold and textDim pairs; adjust tokens if any pair fails.
- **Remove `select-none` from the lesson page root** so learners can select/copy the
  educational text (keep it on the slider/controls only).
- **`aria-valuetext`** on the slider should use the same label the learner sees
  (callout label / date), not the raw keyframe name.
- Keep the existing good ARIA (slider role, live regions, dialog labelling).

---

## 7. Motion

Motion only where it adds meaning:

- **The eased step sweep** — the signature interaction; keep exactly as is.
- **Panel fade-in** (existing `animate-fadeIn`) — keep, subtle.
- **Remove** `animate-pulse` (status dot) and `animate-ping` (loading ring) — decorative.
- **Candidate (Phase D, only if it can be done without render-loop work)**: a one-time
  eased camera settle on lesson entry, or a very slow demand-driven sky drift. If either
  requires `useFrame` or per-frame React work, it is dropped — the static scene is a
  feature.
- All motion respects `prefers-reduced-motion`.

---

## 8. 3D / UI relationship

- **The interface frames the scene; it never competes with it.** Fewer panels, solid
  surfaces, generous spacing.
- **The timeline is the bridge**: it is the instrument that moves the sun and sky. It
  should look like an instrument — a ruled track with gold markers — not a widget.
- **A subtle bottom vignette** (CSS gradient over the scene's lower edge) can seat the
  bottom instrument without covering the monument.
- **In-scene affordances** (the hotspot marker) are the only 3D additions; they must be
  subtle, non-animated, and config-driven (consume `hotspot.anchor`).
- The 16:9 frame stays; on ultrawide, the letterbox is part of the cinematic language.

---

## 9. Component strategy

Only components with a demonstrated second use:

- **`FieldGuide`** (core): the collapsible panel shell — used by any lesson overlay.
- **`MetadataLabel`** (core): mono/uppercase/gold label — used across landing + lesson.
- **`Panel`** (core): solid-surface placard shell with hairline border — used by field
  guide, callout, astro log.
- **`PrimaryButton` / `GhostButton`** (core): the two button styles.
- **`AtmosphereTimeline`** (core): already exists; gains `meta.dateLabel` consumption and
  larger touch targets.
- **`LoadingScreen` / `ErrorFallback`** (core): already exist; ErrorFallback moves onto
  the palette.
- **`InSceneMarker`** (core, Phase D): the hotspot anchor indicator — only if the anchor
  field is consumed.

No new dependencies. No state library. No new abstractions beyond these.

---

## 10. Performance constraints

V02 must not regress:

- **Landing page stays free of the 3D stack** — route-level splitting preserved.
- **Bundle budget ≈ 400 KB gzip** total; the three.js chunk warning is a tripwire, not
  noise.
- **DPR stays `[1, 2]`**; shadow policy unchanged (one 2048² map, ±120 ortho).
- **No `useFrame`**; `frameloop="demand"` preserved; no render-loop/GPU state in React.
- **Panorama memory** stays a concern: no new skies without an owner; the preload +
  eviction model (L6) is preserved.
- **Font subsetting to latin-only** is a planned *improvement* (~450 KB → ~150 KB raw).
- **No new dependencies** unless an existing one is demonstrated incapable.
- **Build warnings remain a tripwire**: the three.js chunk warning is accepted; nothing
  new may be added.

---

## Implementation phasing (post-approval)

Organized into small, reviewable phases per the master instruction:

- **Phase A — Foundation**: design tokens/patterns (spacing scale, panel/button/metadata
  language, text-size floor), font subsetting, ErrorFallback palette, remove decorative
  animation.
- **Phase B — Landing**: editorial hero, expedition-list catalog, footer cleanup,
  responsive behavior.
- **Phase C — Lesson UX**: field-guide panel (replaces drawer+tabs), refined bottom
  instrument, Calendar-topic surface, `meta` label consumption, overlay loading state.
- **Phase D — 3D presentation**: in-scene hotspot marker (consume `anchor`), optional
  justified motion (only if demand-rendering is preserved), bottom vignette.
- **Phase E — Responsive + Accessibility**: bottom-sheet mobile behavior, focus
  management, reduced motion, touch targets, skip link, contrast audit.
- **Phase F — Performance**: re-measure and compare with the V01 baseline in this audit.

Each phase ends with the validation loop (`tsc`, `lint`, `build`, dev-server check) and
a regression check against the V01 invariants.

---

## Open questions for the owner

1. **Developer panel**: the master instruction's "DEV PANEL CLARIFICATION" describes a
   developer/debug panel, but ADR-001 (the locked decision in `docs/DESIGN_DECISIONS.md`)
   **removed** the Leva dev panel and forbids reintroducing it. This plan treats the
   repo's documented decision as authoritative: the development capability is the
   **config-driven authoring surface** (keyframes, camera, lighting in lesson configs) +
   the dev tooling (`dev`/`typecheck`/`lint`/`build`). No runtime panel is planned. If a
   runtime authoring panel is actually wanted, that is a deliberate reversal of ADR-001
   and should be decided explicitly.
2. **In-progress Zenith work**: the uncommitted feature (Zenith topic, `meta`,
   `directionalIntensity`, new skies) is treated as baseline. Should it be committed
   before Phase A begins, or folded into the V02 work?
3. **`LearningMaterial/` and `docs/TECH_DEBT.md`** are referenced but missing. Recreate
   the debt ledger (P1); confirm whether the vetted lesson copy exists elsewhere.
