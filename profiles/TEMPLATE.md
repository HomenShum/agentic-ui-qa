# QA profile: <APP NAME>  (copy this file to profiles/<app>.md and fill EVERY row)

Fill by scouting the repo READ-ONLY (package.json, README/docs, src layout, deps).
Mark unknowns as `UNKNOWN — <how to find out>`; never leave a row silently blank.
A row you cannot fill is itself a finding (the app is under-documented for agents → B8).

## Environment
| Thing | Value |
|---|---|
| Prod URL | |
| Repo root | |
| Dev command + port | |
| Backend / deployments | |
| Auth path for a QA agent (anonymous? access code — WHICH env var + retrieval command? login?) | |
| Typecheck gate | |
| Test gate | |
| Playwright available in repo? (pixels.cjs `repo` field) | |
| Evidence dir convention | `<scratchpad>/qa-<app>-<YYYYMMDD-HHmm>/` |

## Provenance surface (ground truth for AI claims — SKILL §1.2)
| Question | Answer |
|---|---|
| Where does the app show what AI did? (trace tab, activity log, receipts…) | |
| LIVE run signals (model id shown where; cost/tokens where; receipt/digest format) | |
| DEGRADED/fallback signals (exact label text; what is zeroed) | |
| FAILED signals (where issues render) | |

## First-run behavior (trap U10)
What a fresh anonymous session sees first, and the exact click(s) to reach the main shell:

## Live signals (for live-signal.mjs)
3–5 strings expected in prod (note which are raw-HTML vs hydration-only):

## Journey mapping (archetypes A0–A6 → concrete steps)
For each: numbered steps, exact selectors/labels, VERIFY signals, evidence names.
- A0 Smoke:
- A1 Core creation (no AI egress):
- A2 Live AI action (consent → propose → provenance → accept):
- A3 Provenance audit:
- A4 Output & sharing:
- A5 Themes & access (incl. how dark mode is actually set — trap U11):
- A6 Adversarial:

## App-specific traps (beyond universal U1–U11)
- 

## Known product behaviors that are NOT bugs
- 

## Last Bar score (update each pass; lowest = next revamp target)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | date | notes |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |
