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

## Last Bar score (2026-07-12 baseline, from the live World Cup session + Trace redesign work)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | date | notes |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2026-07-12 | B6: create-path 30s timeout falls back (raise budget/stream). B8: first-run modal + collapsed consent disclosure cost cheap agents steps (T10/T4 now documented; UI could expose consent flatter). Next revamp targets: B6, B8. |
