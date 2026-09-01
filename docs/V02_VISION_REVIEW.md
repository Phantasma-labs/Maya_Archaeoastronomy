# V02 Visual Review — Handoff Instructions for the Vision Agent

> **STATUS: COMPLETED 2026-09-01.** This handoff document drove the vision
> review whose findings and fixes are recorded in
> `docs/V02_VISION_REVIEW_REPORT.md`. Kept as historical record.

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
| `src/lessons/lesson01/Lesson01Overlay.tsx` | Field Guide panel, bottom instrument |
| `src/lessons/lesson01/Lesson01Scene.tsx` | 3D assembly |
| `src/core/components/AtmosphereTimeline.tsx` | The slider (step labels, markers, thumb) |
| `src/pages/LessonPage.tsx` | 16:9 frame, single `sliderPosition` writer (ADR-001) |
| `src/lessons/lesson01/config.ts` | All lesson copy, keyframes, callouts |
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

### 3b. One-command screenshot recipes (every checklist interaction)

The app ships three **URL state seeds** as a real feature — `?topic=<id>`, `?step=<n>`,
`?guide=<1|topics|monument>` — that drive the opening overlay state. Every
topic/step/panel state is therefore renderable by plain headless Chrome with **no
clicks**: each recipe below is a single deterministic command. Topic ids: `serpent-descent`
· `solar-zenith` · `solar-calendar`.

Run these in git-bash from the repo root; `PORT` must match your dev server (3000, or 3001
if you started the fallback):

```bash
#!/usr/bin/env bash
PORT=3001                        # ← CHANGE THIS if your dev server is on 3000
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"   # Windows (git-bash)
# macOS/Linux alternative:
# CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
BASE="http://localhost:$PORT"
LES="$BASE/lesson/01"
mkdir -p shots

shot() {                          # shot <name> <url> <width> <height>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size="$3,$4" --screenshot="shots/$1.png" "$2"
}
```

| Checklist | Recipe | What the shot must show |
|---|---|---|
| **L1–L2** hero + CTA | `shot 01-hero-1920 "$BASE/" 1920 1080` | Serif headline, gold CTA, sky dimmed behind text |
| **L3** catalog | `shot 02-catalog-1920 "$BASE/" 1920 2600` (tall viewport) | Expedition cards, gold badge + stone lock, whole card a link |
| **L4** rhythm | `shot 03-hero-mobile "$BASE/" 390 844` | No cramped/overflowing hero at 390 px |
| **L5** fonts | `shot 01-hero-1920 …` zoomed by eye | No clipped glyphs on "É"/"á" in Cinzel; no FOUT |
| **D1/D2/D11** entry | `shot 10-entry "$LES" 1920 1080` | Field Guide **closed**, instrument 3-col, 16:9 letterbox, vignette |
| **D3** 2-step track | `shot 11-descent-step1 "$LES?topic=serpent-descent&step=1" 1920 1080` | Thumb + both diamonds inside the track |
| **D3** 3-step track | `shot 12-calendar-step3 "$LES?topic=solar-calendar&step=3" 1920 1080` | 3 labels not clipped, thumb at extreme |
| **D5** callout | `shot 11-descent-step1 …` | Serif headline, mono sublabel, gold-border lines, prompt below timeline |
| **D6** sun data | `shot 13-descent-step2 "$LES?topic=serpent-descent&step=2" 1920 1080` | Azimuth/Altitude/Declination/Local time, gold mono values |
| **D7** Calendar topic | `shot 12-calendar-step3 …` | Instrument renders; right column shows the "Select Serpent Descent…" prompt |
| **D8** Zenith labels + shadow | `shot 14-zenith-step1 "$LES?topic=solar-zenith&step=1"`, `…step=2`, `…step=3`, each `1920 1080` | Labels read May 23 / Jun 21 / Jul 19; step 2 has the visible solstice shadow |
| **D12** Field Guide (topics) | `shot 20-guide-topics "$LES?guide=topics" 1920 1080` | Pills + selected topic content + key fact; solid surface |
| **D12** Field Guide (architecture) | `shot 21-guide-monument "$LES?guide=monument" 1920 1080` | Overview, culture/chronology, scholarly-caution box |
| **M1** stacking | `shot 40-mobile-entry "$LES" 390 844`, `shot 41-mobile-zenith "$LES?topic=solar-zenith&step=2" 390 844` | Timeline (order-1) stacks first, then callout, then astro; no horizontal scroll |
| **M2** panel on mobile | `shot 42-mobile-guide "$LES?guide=topics" 390 844` | Panel inside the viewport, scrolls internally |
| **M3 / M4** touch + chrome | `shot 41-mobile-zenith …`, `shot 43-tablet-entry "$LES" 768 1024` | Marker/knot sizes look comfortable (hit areas are 24 px — see note); header doesn't wrap/overlap |

PowerShell equivalent of one line:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1920,1080 --screenshot="shots\01-hero-1920.png" "http://localhost:3001/"
```

**One check cannot come from a static screenshot** — the D4 eased sweep's *feel* — so capture
its settled state above, then verify the *motion* with the Playwright pass (system Chrome,
no app dependency, `npm i --no-save playwright-core` keeps package.json untouched):

```mjs
// vision-interact.mjs
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome' });          // reuse installed Chrome
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const B = 'http://localhost:3001/lesson/01';                            // ← match your port

await page.goto(B);
await page.getByRole('button', { name: 'Field Guide' }).click();        // D12 toggle actually opens
await page.screenshot({ path: 'shots/20-guide-clicked.png' });
await page.getByRole('button', { name: 'Architecture' }).click();
await page.screenshot({ path: 'shots/21-guide-tab-clicked.png' });

await page.goto(B);
await page.getByRole('button', { name: 'Sweep to The descent' }).click(); // D4 eased sweep (600 ms)
await page.waitForTimeout(900);                                          // wait for it to settle
await page.screenshot({ path: 'shots/13-sweep-settled.png' });
await browser.close();
```

Report D4's mid-sweep frames and M3's hit-area feel as **"verified by interaction script,
not captured"** if you don't run this pass — never as "probably fine."

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
3. Mobile stacking (M1) — pragmatic implementation, not a true bottom sheet.
4. Vignette strength (D11) — `from-maya-bg/70` may need tuning per sky.
5. Timeline inset geometry at both extremes (D3).
6. Zenith solstice shadow visibility (D8) — the teaching exaggeration.
7. Font load: FOUT/no-font flash, glyph clipping on accented characters (L5).

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
