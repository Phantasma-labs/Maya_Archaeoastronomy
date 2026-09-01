# ROADMAP

Sequencing for the project. **Authoritative design decisions** are in
`docs/DESIGN_DECISIONS.md` (ADR-001). The ranked known-issue ledger lives in
`docs/TECH_DEBT.md`. This document only tracks **phases** of work and what's next.

The V02 redesign ("Digital Archaeological Observatory") shipped to `main` on
**2026-09-01** (commit `88ce647`). All sections below §4 are historical record
of what was already done to get here.

> The V02 audit, design plan, vision review instructions, and final vision
> review report are archived under `docs/archive/v02/` — read them when you
> need to know *why* a design decision was made, not what to do next.

## Status as of 2026-09-01

| Phase | Status | Reference |
|---|---|---|
| **Batch 0** — ADR-001: remove dev panel, hardcoded keyframes, Atmosphere Timeline | ✅ Shipped (2026-08-23) | DESIGN_DECISIONS.md |
| **§1** — Must-fix (git baseline, debug residue, coming-soon guard, frameloop="demand") | ✅ Shipped | commit history |
| **§2** — Should-fix (tooling, dead code) | ✅ Shipped | commit history |
| **§3** — Nice-to-have (code splitting, token consolidation, typed registry) | ✅ Shipped | commit history |
| **§3.5** — Asset hygiene (lesson-asset cleanup, self-hosted fonts + latin subsetting) | ✅ Shipped | TECH_DEBT V2-2 |
| **V02 Phases A–F** — Foundation, Landing, Lesson UX, 3D presentation, A11y, Performance | ✅ Shipped (2026-09-01) | V02_VISION_REVIEW_REPORT.md |
| **V02 Vision Review pass** — visual audit + responsive fixes | ✅ Shipped | V02_VISION_REVIEW_REPORT.md |
| **§4** — Future architecture (when lessons 02–05 arrive) | ⏳ Open | — |

## §4 — Future architecture (open)

These become relevant when more than one real lesson exists, or when content
authoring needs to scale beyond hand-written config files.

### 4.1 — Lesson-switching state model

Currently `LessonPage` keyed-remounts on route change, which is enough for one
shippable lesson. When lessons 02–05 arrive, evaluate:

- **URL params for deep-linked slider positions** — `?step=2` is already wired
  as a dev seed, but a stable canonical URL the learner could share would
  require deciding the read/write contract and SSR-friendliness (out of scope
  today; this is a static SPA).
- **Cross-lesson preloading** — currently `useLessonAssetCleanup` evicts on
  unmount. If lessons are expected to chain (e.g. a guided tour), the eviction
  policy needs revisiting.

### 4.2 — HDR pipeline

Real `.hdr` / KTX2 skies would lift IBL fidelity (the current LDR WebP equirects
limit the directional/IBL contrast and color richness). Defer until a lesson
visibly suffers from the LDR ceiling — none does today.

### 4.3 — Content pipeline

`docs/PROJECT.md` cites `LearningMaterial/lesson_01.md` as the vetted source
text — the folder was restored byte-exact from git on 2026-09-01 (TECH_DEBT
V2-3 resolved). The goal is now unblocked: generate lesson `content` blocks from
the vetted Markdown instead of hand-duplicating facts into `config.ts`. Still
future work — no pipeline exists yet.

### 4.4 — Guardrails

- **Asset budget CI check** — GLB/texture size ceilings enforced in CI (current
  Draco compression is human-driven).
- **Smoke test for registry integrity** — every lesson resolves, every referenced
  asset exists on disk, every `SkyKeyframe` has a unique id.
- **R3F v9 / React 19 evaluation** — only when a concrete need appears (e.g. a
  v9-only feature or a breaking change in a dep we depend on).

## How to add to this file

New phases go above §4 with `⏳ Planned` status and a clear reference to the
governing design doc or audit. When a phase ships, mark it `✅ Shipped` with the
date and move the detail to commit history (don't delete it — the audit trail
is the value).
