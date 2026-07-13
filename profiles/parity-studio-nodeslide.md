# QA profile: NodeSlide (parity-studio) — REFERENCE IMPLEMENTATION

Status: Haiku-validated 2026-07-12 (J0 cold-run PASS by a Haiku agent; 4 frictions folded back).
The repo also carries a self-contained copy of this protocol at
`.claude/skills/nodeslide-qa/` (SKILL.md + JOURNEYS.md + scripts) — if you are working
INSIDE parity-studio, prefer that copy (it is the same protocol, repo-local). This profile
exists so the universal skill can drive NodeSlide from anywhere.

## Environment
| Thing | Value |
|---|---|
| Prod URL | `https://parity-studio.vercel.app/?domain=nodeslide` |
| Repo root | `D:\VSCode Projects\parity-studio` |
| Backend | Convex — prod `blissful-pig-998`, dev `secret-vulture-733` |
| Auth path | Viewing sample/shared decks: anonymous. CREATING decks: access code — `npx convex env get NODESLIDE_PREVIEW_ACCESS_CODE --prod` from repo root; never print the value |
| Typecheck gate | `pnpm typecheck` |
| Test gate | `pnpm test` (full) · `pnpm exec vitest run src/domains/nodeslide` (scoped) |
| Playwright | YES — set pixels.cjs `"repo": "D:/VSCode Projects/parity-studio"` |

## Provenance surface (ground truth)
Inspector (right rail) → **Trace tab**.
- LIVE: model `z-ai/glm-5.2` (no fallback suffix) · cost > $0.000 · tokens in/out ·
  candidate digest `candidate_validation_…` · "candidate validation passed".
- DEGRADED: "deterministic fallback" in model/summary · $0.000 · no tokens · no digest.
- FAILED: validation issues listed with severities; no green publish claim.
NOT-A-BUG: deck CREATION on the GLM path may time out → labeled deterministic fallback.
The live-model hero is the composer EDIT path (propose → validate → accept).

## First-run (U10)
Fresh sessions open the onboarding modal "From brief to a reviewable deck." with consent
copy "Deterministic by default · OpenRouter opt-in". Click **"Explore the sample"** (no
code; dismisses AND loads the sample deck) or "Create my deck" (needs access code).

## Live signals
Raw HTML (SPA shell, ~1KB): `NodeSlide`, `reviewable`. Hydration-only (pixels assert):
`Explore the sample`, `Structure, presentation, and cleanup checks passed`.

## Journeys
Full concrete J0–J6 live in the repo: `D:\VSCode Projects\parity-studio\.claude\skills\nodeslide-qa\JOURNEYS.md`
(J0 smoke · J1 deterministic create · J2 live GLM edit [HERO — per-edit consent re-arm:
expand "Web:…" disclosure → OpenRouter·GLM 5.2 radio → consent checkbox → verify via JS]
· J3 trace audit · J4 export/present · J5 themes/responsive · J6 adversarial). Use them verbatim.

## App-specific traps
- Consent is per-task and resets after every accept (U3 applies hard).
- Provider radios sit in a collapsed "Web: …" disclosure (U4).
- Shell theme is `data-ns-theme` via toolbar toggle `[aria-label="Switch to dark theme"]`;
  prefers-color-scheme is IGNORED (U11; standing P2 observation).
- V3 chrome class namespace collides easily (U6 precedent: `.ns-rail-toggle` is
  display:none ≥1100px — cost a real bug on the custody rail).
- Concurrent Codex writers are common on this tree (U7) — always re-gate.

## Last Bar score
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 2026-07-13 | **Opus full pass — 18/20** (report: `parity-studio/artifacts/nodeslide-bar-opus-2026-07-13/`; recorded in `parity-studio/.qa/memory/`). B1–B8 driven headlessly with atomic artifacts; **B9/B10 scored from evidence** on the 13th. B9=2: shell is designed-tooling-grade (three-pane discipline, terracotta-classifies ink, serif/sans/mono, honest micro-copy) — one flat surface = the trace-tab detail (redesign in flight, `REVAMP examples/trace-revamp`). B10=2: verdict-first, consent-transparent copy, `[source needed]` discipline; one blemish = F2 raw-error leak. **NEW: live GLM edit path degraded on prod** — 3 samples = 1 graceful fallback + 2 raw Convex Server Error after 70–120s; 0 clean live edits. Honesty held in all cases (P1 reliability, not P0). Consent-off egress network-verified = 0. **Revamp targets: B6, B8.** 5 findings in the ledger (F1 P1 · F2/F3/F4/trace-flat P2). |
| 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | — | — | 2026-07-12 | Baseline from live World Cup session + Trace redesign (B9/B10 predate this row). B6: create-path 30s timeout falls back. B8: first-run modal + collapsed consent disclosure cost cheap agents steps. |

## Verified prod selectors (2026-07-13, for scripted drives)
Create dialog "Shape a new story": `[data-testid=deck-title]` (input; ALSO on editor header — F3 dup), brief `textarea[placeholder*="evidence-led"]`, provider `input[type=radio][value=deterministic|openrouter_free]`, consent `[data-testid=provider-consent]`, access code `[data-testid=preview-access-code]`, submit `getByRole('button',{name:/Create deck/i})`. Composer: submit `[aria-label="Propose edit"]`, consent checkbox = enabled checkbox after openrouter radio, prod label "Web: off" (local source: "External model: off"). Tabs when inspector EXPANDED = text buttons AI/Design/Comments/Versions/Data/Trace (not `[aria-label="Open X"]`, which is the collapsed rail). Ownership is session-bound: reuse the SAME browser context for create→edit (raw deck URLs hit Safe Recovery).
