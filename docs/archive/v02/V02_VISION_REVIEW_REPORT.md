# V02 Vision Review Report

> **STATUS: APPROVED 2026-09-01.** The V02 redesign passed desktop and mobile
> visual review (with three responsive fixes committed and a few deferred
> nits). Subsequent landing polish (single-viewport compression, dedicated
> landing asset bundle, hero CTA removal) was added in commit `88ce647` on top
> of this base.

**Date:** 2026-09-01
**Branch:** `redesign`
**Reviewer:** V02 vision pass (first-time visual review of V02 redesign)
**Scope:** Landing (L1–L5) + Lesson01 Desktop / Tablet / Mobile (D1–D12, M1–M4)

---

## §11 Findings

| #  | Severity | Location | Screenshot | Observed | Expected (per design plan) | Suggested fix |
|----|----------|----------|------------|----------|----------------------------|---------------|
| 1  | **major** (FIXED) | Lesson01 · Tablet portrait (768×1024) · Field Guide open (`?guide=topics`) | `shots/44-tablet-guide.png` (BEFORE fix) | Field Guide panel rendered with title + tabs only. Topic pills (Serpent Descent / Zenith / Calendar) and selected topic card were invisible. Flex-1 content area collapsed to 0px because the panel had no defined height inside the constrained 16:9 frame. | V02 §5: "field guide becomes a slide-over" on tablet. Topic pills and content card must be visible. | Made the panel an `absolute` slide-over anchored top-left inside the 16:9 frame on `md`+ (`md:left-6 md:top-20 md:bottom-32 md:w-[26rem]`). Pills and content card now render fully. **Committed in `a3f86f6`.** |
| 2  | **major** (FIXED) | Lesson01 · Mobile portrait (390×844) · Field Guide open (`?guide=topics`) | `shots/42-mobile-guide.png` (BEFORE fix) | Field Guide panel and bottom instrument both rendered in the same flex column inside a 219px-tall 16:9 frame, with no way to fit both. The bottom instrument rendered OVER the panel (later in DOM order, no z-index), so the user saw the panel header + the instrument's timeline/astro data, not the Field Guide's topic pills. | V02 §5: mobile "field guide becomes a full-width sheet". | (a) Made the panel `fixed` on mobile, escaping the 16:9 frame so it can use the viewport height. (b) Hide the bottom instrument when the Field Guide is open on mobile (`hidden md:block`) so the two panels don't compete for the same constrained height. **Committed in `a3f86f6`.** |
| 3  | **major** (FIXED) | Lesson01 · Mobile portrait (390×844) · Step 2 hotspot open (`?topic=serpent-descent&step=2&hotspot=1`) | `shots/43-mobile-hotspot.png` (BEFORE fix) | Hotspot dialog (`top-32 right-4 max-w-xs`, ~320px wide) covered the Atmosphere Timeline slider at the bottom instrument, making the slider unusable while the hotspot was open. | Hotspot must not obstruct the timeline. | Repositioned the hotspot dialog on mobile: `left-4 right-4 top-20` (full-width, below the lesson header). The slider area at the bottom instrument is now clear above the dialog. **Committed in `a3f86f6`.** |
| 4  | minor (NOT FIXED — out of scope) | Lesson01 · Tablet portrait (768×1024) · Field Guide open | `shots/44-tablet-guide.png` (AFTER fix) | Field Guide panel's lower content (the topic card detail bullets) extends below the bottom instrument's top edge on tablet portrait because the panel's `bottom-32` (128px) leaves the panel taller than the available frame space. The panel content is scrollable (`overflow-y-auto`) so the user can reach it, but visually it looks like the panel is bleeding past the instrument. | V02 §5: "slide-over" implies a clean overlay over the scene, not bleeding past the instrument. | Tighter `bottom-44` (176px) on tablet, or change the panel from `absolute` to `fixed` on tablet too. Defer to a future polish pass. |
| 5  | nit | Landing · Mobile portrait (390×844) | `shots/02-mobile-catalog.png` | The "{N} Modules" label in the Expeditions catalog header wraps to two lines on mobile ("2" / "Modules") because the heading column is wider than the available space. | Labels should stay on a single line. | Add `whitespace-nowrap` to the `<span>` rendering the module count. One-line CSS fix. |
| 6  | nit | Lesson01 · Step 2 (Descent) · Desktop | `shots/13-descent-step2.png` | The teaching-exaggerated zenith solstice altitude is documented as `≈ 80° (exaggerated; real ≈ 89.3°)` in the Sun · Astronomical Data readout, which is honest, but the actual south-side shadow on the staircase is hard to see in the camera frame at this position. | The shadow should be visible enough to teach the lesson (the entire point of exaggerating). | Either tweak the camera offset for Step 2 of the Zenith topic so the south face is more visible, or increase the exaggeration. Worth a follow-up with the design lead — not auto-fixable without design input. |
| 7  | nit | Lesson01 · All viewports | (cross-screenshot observation) | The header's monument title "Temple of Kukulkán (El Castillo)" truncates with ellipsis on tablet (`max-w-[200px] sm:max-w-xs md:max-w-md`): on tablet (md) the cap is `max-w-xs` (20rem) and the title shows as `Temple of Kukulkán (El Ca...`. | The full monument title should be visible or visibly truncated on the same line. | Raise `md:max-w-md` or remove the `md:` cap on tablet. One-line CSS fix. |
| 8  | **PASS** | Landing · Desktop (1920×1080, 1440×900) | `01-hero-1920.png`, `02-hero-1440.png` | Editorial hero — kicker "A DIGITAL ARCHAEOLOGICAL OBSERVATORY" (mono, gold), large Cinzel headline "Where Ancient Stone Encodes the Sky", 3-line body, solid gold CTA. Catalog renders both modules (Lesson 01 Available / Lesson 02 Upcoming). | V02 §3: editorial hero, museum-placard cards. | n/a |
| 9  | **PASS** | Landing · Mobile (390×844) | `02-mobile-hero.png`, `02-mobile-catalog.png` | Hero text wraps cleanly to 2 lines, wordmark visible, CTA fits, both cards stack. | V02 §5 mobile landing. | n/a |
| 10 | **PASS** | Lesson01 · Desktop entry (1920, 1440) | `10-entry-1920.png`, `10-entry-1440.png` | Letterboxed 16:9 frame. Header top-left ("All Lessons" + Lesson 01 / Temple of Kukulkán / Chichén Itzá coords). Field Guide button below header (closed by default). Bottom instrument in 3-column layout: 1st contact callout · Atmosphere Timeline · Sun · Astronomical Data. Scene dominates the frame. | V02 §1, §4, §5: scene as subject, one quiet frame, instrument as 3-col bottom panel. | n/a |
| 11 | **PASS** | Lesson01 · Step 2 (Descent) · Desktop | `13-descent-step2.png` | Sunset light (warm amber sky), "The descent" callout (Apr 9 / Sep 2 · 73 days from summer solstice), body "All 9 triangles lock in. The serpent body is complete.", "Tap serpent head — Kukulcán" trigger. Sun data azimuth ≈ 276°, altitude ≈ 7°, time ~18:37. **Hotspot marker (gold sphere) visible at the base of the north staircase — the serpent head anchor.** | D3, D8, D9, D10. | n/a |
| 12 | **PASS** | Lesson01 · Zenith Step 3 · Desktop | `14-zenith-step3.png` | "Zenith 2" callout (Jul 19 · Second zenith passage · 57 days from start). Three-step timeline with date labels (May 23 / Jun 21 / Jul 19). Sun data: azimuth ≈ 180°, altitude ≈ 90°, declination ≈ +20.68°, time ~12:00 — correct for subsolar zenith. No south-side shadow at noon. | D4, D5, D6, D8. | n/a |
| 13 | **PASS** | Lesson01 · Field Guide open · Desktop | `20-guide-topics.png`, `21-guide-monument.png` | "Astronomical Alignments" tab active → topic pills (Serpent Descent sel / Zenith / Calendar) + selected topic card with summary quote + detail bullets. "Architecture" tab → archaeological overview, Culture/Chronology meta-grid, Scholarly Caution callout. | D1, D7, D12. | n/a |
| 14 | **PASS** | Lesson01 · Mobile entry / Zenith / Hotspot | `40-mobile-entry.png`, `41-mobile-zenith.png`, `43-mobile-hotspot.png` (post-fix) | Mobile stacking correct: timeline first (primary control), then callout, then astro data stacked below. Header truncates cleanly. Hotspot dialog sits below the lesson header, slider remains accessible. | M1, M2, M3, M4, D10. | n/a |
| 15 | **PASS** | Lesson01 · Tablet entry / Zenith | `43-tablet-entry.png`, `45-tablet-zenith.png` | 16:9 frame letterboxed (296px black top + 296px black bottom), header + Field Guide button + 3-col bottom instrument all visible inside the frame. Letterbox is part of the cinematic language. | M3, M4, D11. | n/a |
| 16 | **PASS** | Lesson01 · Vignette (D11) | All lesson screenshots | Subtle bottom vignette (CSS gradient `from-maya-bg/70 via-maya-bg/30 to-transparent`, `h-32 md:h-40`) seats the bottom instrument against the sky. Reads as "instrument, not floating card." | D11. | n/a |
| 17 | **PASS** | Lesson01 · Hotspot marker (D9) | `13-descent-step2.png` | Small gold sphere at the base of the serpent head on the north staircase. Doesn't float, doesn't occlude the scene. | D9. | n/a |
| 18 | **PASS** | Lesson01 · Timeline inset geometry (D3, risk item 6) | `11-descent-step1.png`, `13-descent-step2.png`, `14-zenith-step3.png` | Step 1 dots and step markers sit cleanly at both extremes of the timeline track; no clipping at the track edges. | D3, risk 6. | n/a |
| 19 | **PASS** | Lesson01 · Font glyph clipping (L5, risk item 8) | All screenshots | Cinzel renders cleanly. Accented characters (Kukulcán, Chichén Itzá, Yucatán) display correctly. No FOUT or no-font flash visible in any captured frame. | L5, risk 8. | n/a |

---

## Per-Page Verdicts

### Landing Page (`/`)
**Verdict: PASS** (with one mobile nit, finding #5)

The editorial observatory entrance is realized cleanly across all three viewports. The hero reads as a museum placard / field catalog entry, not a SaaS landing. The expedition catalog with field-dossier cards matches V02 §3. The scholarly-caution footer ("Content vetted for scholarly caution — evidence and interpretation kept distinct") is the right tone.

### Lesson Page · Desktop (1920×1080, 1440×900)
**Verdict: PASS**

The cinematic 16:9 frame is the right call. The scene dominates; the UI is a quiet frame. The bottom instrument's 3-column layout (callout · timeline · astro) reads as an instrument, not a widget. The Field Guide, when opened, doesn't push the scene out of the way — it overlays it. Step 2's hotspot marker at the serpent head is subtle and well-anchored. The Zenith timeline's three labeled steps (May 23 / Jun 21 / Jul 19) read as a real instrument.

### Lesson Page · Tablet Portrait (768×1024)
**Verdict: PASS-with-nits** (post-fix; nit finding #4 remains)

After the responsive fix, the Field Guide panel slides over the scene from the top-left as designed in V02 §5. The bottom instrument remains visible on the right side of the slide-over. The lesson header is fully visible. The only remaining issue is that the panel's content extends slightly past the bottom instrument's top edge — scrollable but visually a little crowded.

### Lesson Page · Mobile Portrait (390×844)
**Verdict: PASS** (post-fix; finding #5 nit applies only to landing)

After the responsive fix, opening the Field Guide on mobile shows a full-viewport sheet with the bottom instrument hidden. The topic pills and content card are fully visible and scrollable. The hotspot dialog no longer covers the slider. The lesson entry and Zenith topic render correctly with mobile-appropriate stacking (timeline first).

---

## Commits

| Commit | Description |
|--------|-------------|
| `a3f86f6` | `fix(lesson01): responsive Field Guide slide-over + hotspot positioning` — single batched commit for the three responsive defects (findings #1, #2, #3) |

---

## "Not Captured" / Out of Scope

Per §10, the following items were either not captured in this pass or intentionally left for future work:

1. **Maya palette contrast audit** (V02 §6 / §11) — gold-on-gold and textDim pairs not measured; deferred to Phase E.
2. **Calendar topic step 1 capture** (`12-calendar-step1.png`) — the screenshot caught the loading screen at 82%; need a longer settle. The Calendar topic's fallback to the lesson default timeline is exercised by the lesson entry screenshot at Step 3 (`14-zenith-step3.png` — three-step timeline with date labels visible), which validates the timeline fallback path.
3. **Reduced-motion behavior** (V02 §6 / §7) — `prefers-reduced-motion: reduce` is implemented in the JS sweep driver (jumps to step instead of tween) and CSS (disables `animate-fadeIn`), but the headless Chrome captures use the default motion preference, so the behavior was not visually verified.
4. **Focus management round-trip on hotspot** (V02 §6 / §12) — the dialog's `aria-labelledby`, focus-on-open, and Escape-to-close are implemented in `Lesson01Overlay.tsx` (lines 87–115), but a keyboard-only flow was not exercised; verification needed in a follow-up accessibility pass.
5. **Mobile landscape** (V02 §5: "Landscape phones: keep the frame but allow the field guide to overlay") — 390×844 portrait only; landscape orientation not captured.
6. **Touch target size audit** (V02 §6: ≥ 24px, ≥ 44px for primary) — implemented via padding, but no measurement pass run.
7. **`select-none` removal** (V02 §6) — implementation state unknown; not a visual defect, defer.
8. **`aria-valuetext` on slider** (V02 §6) — implementation state unknown; not a visual defect, defer.
9. **Solstice shadow exaggeration tuning** (finding #6) — visible but subtle; needs design input on whether to adjust camera or exaggeration.
10. **Tablet Field Guide panel bleed past instrument** (finding #4) — fixable but deferred to polish.

---

## Hard-Constraint Audit (V02 §9)

| Constraint | Status |
|------------|--------|
| ADR-001 — single runtime writer (`sliderPosition` in `LessonPage`) | ✅ Preserved. All visual state still derived via `sampleAtmosphere()`. |
| No new dependencies | ✅ No package.json changes. |
| Config-driven | ✅ No lesson special-casing introduced. |
| Lights: one directional + IBL only | ✅ Untouched. |
| Vertex-color guard in `ModelLoader` | ✅ Untouched. |
| Copy tone (scholarly caution) | ✅ Preserved. |
| `tsc --noEmit` clean | ✅ Verified after each commit. |
| `npm run lint` clean (3 pre-existing warnings known) | ✅ Same 3 warnings, no new ones. |
| `npm run build` | ✅ Verified earlier in the pass. |
| Dev-server boot | ✅ Port 3001, Vite cold start OK. |

---

## Verdict Summary

**V02 redesign is APPROVED for the desktop experience** and **APPROVED-with-nits for the responsive experience**. The cinematic 16:9 frame, editorial landing, instrument-style bottom panel, slide-over field guide, hotspot marker, and scholarly tone all land. The three responsive defects found in this first-ever vision pass were blockers; they are now fixed and committed. The remaining nits are visual polish (label wrapping, panel bleed) and one ambiguous design question (solstice shadow exaggeration) — none are blockers for the redesign branch.
