# V02 Visual Review — Handoff Instructions for the Vision Agent

You are the **vision review pass** for the V02 redesign of the Maya Archaeoastronomy
platform. The code work is complete, committed on the `redesign` branch, and validated
(typecheck / lint / build / dev-server boot) — but **no human or model has ever seen the
result visually**. Your job is to look, judge against the design contract, and report
findings with screenshots. Then, if fixes are warranted, make them.

Start by reading this file and `docs/V02_DESIGN_PLAN.md` (the authoritative design spec).
Everything below is the operational checklist.

---

## 1. What this project is

A config-driven 3D learning platform (React 18 + Vite + three/R3F/drei + Tailwind,
deployed on Cloudflare Pages). One lesson is available: **Lesson 01 — The Temple of
Kukulkán at Chichén Itzá**. The V02 direction is a **"Digital Archaeological
Observatory"**: editorial, scholarly, atmospheric. Explicitly NOT a SaaS dashboard, a
game HUD, or cyberpunk.

The previous pass made six phased commits (A–F) changing the landing page, the lesson
overlay, the atmosphere timeline, and accessibility. You are the first set of eyes on
the result.

## 2. Quick orientation (files that matter)

| Path | Role |
|---|---|
| `src/pages/LandingPage.tsx` | Editorial landing + expedition catalog |
| `src/lessons/lesson01/Lesson01Overlay.tsx` | Field Guide panel, bottom instrument, hotspot dialog |
| `src/lessons/lesson01/Lesson01Scene.tsx` | 3D assembly + in-scene hotspot marker |
| `src/core/components/AtmosphereTimeline.tsx` | The slider (step labels, markers, thumb) |
| `src/pages/LessonPage.tsx` | 16:9 frame, single `sliderPosition` writer (ADR-001) |
| `src/lessons/lesson01/config.ts` | All lesson copy, keyframes, callouts, hotspots |
| `docs/V02_DESIGN_PLAN.md` | **The design authority** — judge against this |
| `src/styles/index.css` + `tailwind.config.js` | Palette tokens (`maya.*`), animation policy |

## 3. Run the app

```bash
npm run dev                 # ← do this; serves on http://localhost:3000
npm run dev -- --port 3001  # only if 3000 is taken (it often is)
```

Visit and capture screenshots at minimum these viewports: **Desktop 1920×1080**,
**Desktop 1440×900**, **Tablet 768×1024**, **Mobile 390×844**. Capture every item on the
checklists below at each relevant viewport. Name files meaningfully
(e.g. `01-landing-hero-1920.png`).

## 4. The design contract (what you are judging against)

Condensed from `docs/V02_DESIGN_PLAN.md` §2 — read the full section before judging:

- **Atmosphere:** editorial observatory. Generous whitespace, restraint, scholarly tone.
  Subtle transitions. Nothing decorative-animated (no pulse/ping/bounce).
- **Typography:** Cinzel (serif, display/labels) + Plus Jakarta Sans (body) + JetBrains
  Mono (data/labels). Enforce the **text-size floor**: no reading text below 11px;
  body copy should read at ≥12px. Mono labels at 11px are fine.
- **Palette (authoritative hex):** bg `#090b10`, surface `#121622`, surfaceHover
  `#1b2133`, gold `#d4af37`, goldLight `#f3e5ab`, goldDark `#8b6b23`, text `#e6dfd3`,
  textDim `#a39e93`, cream `#f5ecd7`. Flag any stray hexes (other than Tailwind's
  emerald/stone/red status colors, which are sanctioned).
- **Surfaces:** mostly solid, hairline gold borders. `backdrop-blur` is permitted only
  on the floating top chrome (header/toggle) and the field guide — the instrument and
  cards should read as solid. Excessive glassmorphism is a defect.
- **No** gradient CTAs (solid gold), no neon, no gradient "hero washes" beyond the
  sanctioned sky-scrim + bottom vignette, no rounded-corner excess (rounded-xl is the
  ceiling; rounded-2xl only for the field guide panel + instrument).
- **Copy tone:** scholarly caution — evidence vs. interpretation kept distinct. Flag
  anything that sounds like pop-science certainty.

## 5. Landing page checklist (`/`)

| # | Check | Pass looks like |
|---|---|---|
| L1 | Hero composition | Serif headline ("Where Ancient Stone Encodes the Sky") prominent, ~5–7 words per line, cream on dark. Sky backdrop visible but dimmed (opacity-25) and faded into the page ground — text stays legible over it. |
| L2 | Kicker + CTA | Gold mono kicker "A DIGITAL ARCHAEOLOGICAL OBSERVATORY". CTA "Begin the Investigation" is solid gold (`bg-maya-gold`), no gradient, serif, uppercase. |
| L3 | Expedition catalog | Cards: thumbnail + bottom scrim, "Expedition 01" gold badge + difficulty badge, Available/Upcoming state clearly distinct (gold vs. stone-lock). Whole card is the link — hover raises the gold border. |
| L4 | Rhythm | Generous vertical whitespace; hero not cramped; footer quiet with the scholarly-caution line. No card grid overflow at each viewport. |
| L5 | Fonts | Cinzel rendering clean at every size (check for metric clipping on "É" and "á" glyphs in titles); no FOUT flash on load. |

## 6. Lesson page checklist (`/lesson/01`)

The lesson opens on the **Serpent Descent** topic by default (slider position 1).

| # | Check | Pass looks like |
|---|---|---|
| D1 | Entry state | **Field Guide is CLOSED** — scene unobstructed. Bottom instrument visible with 3 columns: callout (left) · timeline (center) · sun data (right). 16:9 letterboxed frame centered on wide screens. |
| D2 | Header chrome | Back link, "Lesson 01" badge, monument name, location line. Reads as a slim instrument bar, not a bulky HUD. |
| D3 | Timeline geometry | Thumb + step markers fully inside the track at both extremes; the Step-2 marker is clickable on the 2-step Serpent timeline (this was a past bug). Step labels legible, not clipped. |
| D4 | Drag / step interaction | Dragging crossfades sky A↔B and rotates the sun visibly. Clicking a step marker runs a ~0.6 s eased sweep that passes through intermediate states (unless `prefers-reduced-motion`). On a monitor at the 3-step default timeline all steps behave identically. |
| D5 | Callout quality | Left column: serif headline, mono sublabel, gold-bordered field-note lines, gold prompt ("→ Drag to Step 2…") beneath the timeline. Updates as you move between keyframes. |
| D6 | Sun data | Right column shows Azimuth / Altitude / Declination / Local time (mono, gold values). Only on steps that carry `astro` data. |
| D7 | **Calendar topic** | Select "Calendar" in the Field Guide → **the instrument still renders** (lesson-default 3-step timeline), right column shows the prompt text "Select Serpent Descent or Zenith…" instead of astro data. A dead/empty panel here is a regression. |
| D8 | **Zenith topic** | Select "Zenith" → timeline step labels read **"May 23 / Jun 21 / Jul 19"** (the dates — the `meta.dateLabel` change). Step 1 and 3 are both zenith passes (same sky, sun overhead, "No shadow at noon"), Step 2 the solstice with a visible south-side shadow (exaggerated ~80°, intended). Astro values match the callout on each step. |
| D9 | **Hotspot marker** | On Serpent Descent, drag to Step 2 → a small **gold sphere marker** is visible in the 3D scene at the base of the near-face staircase (the carved serpent head area; authored at `[4.03, 2.8, −33.78]`). It should read as a cue, not a blemish; **flag if it floats, occludes the head, or is invisible**. |
| D10 | Hotspot dialog | The "Tap serpent head — Kukulcán" link opens a small card (top-right). Escape closes it. Keyboard focus moves into the card on open and returns to the link on close. |
| D11 | Vignette | Subtle darkening behind the instrument at the frame's bottom edge — it must ground the UI, not appear as a visible band or fog the middle of the frame. |
| D12 | Field Guide panel | Toggle opens a scrollable panel: "Astronomical Alignments" (topic pills + selected topic content + key fact) and "Architecture" (overview, culture/chronology, scholarly caution). Solid surface, gold hairline, closes with X or the toggle. |

## 7. Mobile / responsiveness (390×844 and 768×1024)

| # | Check | Pass looks like |
|---|---|---|
| M1 | Instrument stacking | Bottom instrument stacks **timeline first, then callout, then astro data** (`order-*`). No horizontal overflow anywhere. |
| M2 | Field Guide on mobile | Panel fits the viewport and scrolls internally; the instrument is not permanently buried. |
| M3 | Touch targets | Step markers and slider thumb feel grabbable (hit areas are now 24px). Dragging works without text selection fighting you. |
| M4 | Chrome | Header/back/toggle don't wrap badly at 390px; nothing overlaps. |

## 8. Known-risk items (the previous pass explicitly could not verify these — they are why you exist)

1. Landing hero composition (L1) — first pair of eyes ever.
2. Field-guide-defaults-closed + instrument-on-every-topic (D1, D7) — behavior change with no visual confirmation.
3. Hotspot marker position (D9) — measured from the GLB mesh data, never seen.
4. Mobile stacking (M1) — pragmatic implementation, not a true bottom sheet.
5. Vignette strength (D11) — `from-maya-bg/70` may need tuning per sky.
6. Timeline inset geometry at both extremes (D3).
7. Zenith solstice shadow visibility (D8) — the teaching exaggeration.
8. Font load: FOUT/no-font flash, glyph clipping on accented characters (L5).

## 9. Hard constraints — if something is wrong, report it; do not "fix" it by violating these

- **ADR-001:** exactly one runtime state writer (`sliderPosition` in `LessonPage`); everything visual is derived via `sampleAtmosphere()`. Do NOT introduce a dev panel, store, or per-axis state. Do NOT add `useFrame` / switch `frameloop` off `"demand"` for animation.
- **No new dependencies** — Tailwind + R3F/drei + lucide already cover everything.
- **Config-driven:** never special-case a lesson in `core/` or `pages/`; content copy belongs in `src/lessons/lesson01/config.ts`.
- **Lights:** one directional light + IBL only. No ambient/hemisphere additions.
- **3D invariants:** preserve the `ModelLoader` vertex-color guard; don't commit `dist/`; no `any`; `tsc --noEmit` must pass.
- **Copy:** preserve the scholarly-caution tone of the vetted lesson text.
- **Git:** work on the `redesign` branch; commit in small, described units; the validation loop is `npx tsc --noEmit` → `npm run lint` (3 pre-existing warnings are known and unrelated) → `npm run build` → dev-server boot.

## 10. Evidence discipline

- **You DO have eyes — use them.** But report only what a captured screenshot actually
  shows. If you couldn't capture an item, mark it **"not captured"** — never infer or
  extrapolate "probably fine."
- One screenshot per checklist item at the relevant viewport; embed the filename in the
  finding.
- If a screenshot contradicts an expectation, the screenshot is the evidence; quote the
  exact visual difference, not a vibe.

## 11. Reporting format

Produce a findings table:

| # | Severity | Location | Screenshot | Observed | Expected (per design plan) | Suggested fix |
|---|---|---|---|---|---|---|
| … | blocker / major / minor / nit | page + viewport + topic/step | filename | what the image shows | what it should show | concrete, constraint-respecting fix |

Then a per-page verdict — **PASS**, **PASS-with-nits**, or **NEEDS-CHANGES** — and a
closing list of anything left "not captured."

**Rule of thumb:** fix blockers and majors immediately (validate + commit after each);
collect minors/nits into one follow-up commit; open a question on anything where the
design contract is ambiguous rather than guessing.
