# Promotion log — agentic-ui-qa

Loop state lives here, in git, so any agent can resume cold. One entry per
iteration. Append; never rewrite history, because the list of things that turned
out to be wrong is more useful to the next reader than the current values alone.

Iteration cap: **10** (default). On reaching the cap without a gate pass, stop
and leave the remaining defect ledger below — a documented stop is a valid
outcome; a silent one is not.

## Entry shape

```
### Iteration N — YYYY-MM-DD
- Journey exercised: J<k> <name>
- Observed: <the defect, with its reproduction — inputs, width, state>
- Fixed: <the change, using existing components; file paths>
- Re-proved: <evidence path showing the defect gone in the rendered app>
- Tests: <command and result>
- Conditions newly PASS: <numbers, or "none">
```

---

## Baseline — 2026-08-13

Wave 1. Nothing was fixed; this is a starting line, deliberately.

- **App started:** yes, in the only two senses this repo has one.
  - Quickstart: `npm run doctor` → exit 0, `PASS agentic-ui-qa self-check (12/12)`.
    `npm run proof` → exit 0, receipt written to
    `.nodekit/agentic-ui-qa-self-check.json`.
  - Demo surface: `examples/trace-revamp/mockup.html` served over
    `python -m http.server 8811` and loaded in headless Chromium
    (Playwright resolved from `D:/VSCode Projects/cheiron-ai-take-home/web`).
    Cold load to `networkidle` 849ms.
  - There is no dev server, no build, and no application of its own — correct for
    a `reduced`-variant repo whose surface is its scripts and one HTML artifact.
- **Journeys drivable:** 5 of 5. J1 (quickstart), J3 (`pixels.cjs`),
  J4 (`prettify-audit.mjs`), J5 (`qa-memory.mjs` + `qa-gate.mjs`) drove clean on
  the CLI; J2 drove clean in a real browser and produced 8 PNGs.
- **Scorecard at baseline:** 4/12 PASS — see [PRODUCT_GOAL.md](PRODUCT_GOAL.md).
  PASS 1, 9, 10, 12 · FAIL 2, 3, 4, 5, 6, 11 · UNVERIFIED 7, 8.
- **What is UNVERIFIED and why:** conditions 7 and 8 only. The Vercel Web
  Interface Guidelines reviewer and the Addy Osmani web-quality skill named in
  SKILLS.md are not installed in this environment, and a baseline pass does not
  install authorities — so no guidelines review and no Lighthouse/axe/Core Web
  Vitals run happened. Both are unobserved, not assumed-good.
- **What made evidence possible at all:** the in-app browser pane froze — the
  screenshot tool timed out after 5s ("the Browser pane is not displayed, so the
  page is not compositing frames") and `read_page` against the live tab returned
  an empty 0x0 document. That is this repo's own documented trap U1. Every pixel
  claim above therefore comes from the repo's own `scripts/pixels.cjs` fallback,
  which is the exact contingency `AGENTS.md` prescribes. The protocol survived
  its own trap on its own repo.

### Commands run, with real exit codes

| Command | Exit | Note |
|---|---|---|
| `git clone --depth 50 https://github.com/HomenShum/agentic-ui-qa` | 0 | 49 tracked files, branch `main` |
| `node .../install-promotion-kit.mjs --variant reduced` | 0 | wrote 4 files into `promotion/` |
| `npm run doctor` | 0 | `PASS agentic-ui-qa self-check (12/12)` |
| `npm run proof` | 0 | receipt `.nodekit/agentic-ui-qa-self-check.json` |
| `npm test` | 1 | `Missing script: "test"` — no test suite exists |
| `npm run build` | 1 | `Missing script: "build"` — no build exists |
| `node scripts/qa-memory.mjs init/add-finding/open/regressions` | 0,0,0,0 | ledger created, fp `735c1c7f6506` |
| `node scripts/qa-gate.mjs` (no config) | 2 | `NO_GATE` — correctly refuses to pass |
| `node scripts/qa-gate.mjs <cfg> --check` (no prior state) | 2 | `fail-closed` — correctly refuses to pass |
| `node scripts/qa-gate.mjs <cfg>` (RUN) | 0 | `VERDICT: PASSED`, `gate-state.json` written |
| `node scripts/pixels.cjs <SCRATCH>/pixels.json` | 0 | 3 PNGs, all asserts ok |
| `node scripts/pixels.cjs <SCRATCH>/pixels-states.json` | 0 | 5 PNGs incl. B/C honest states |
| `node scripts/prettify-audit.mjs <cfg>` | 0 | `MEASURED SUBTOTAL: 10/16 (63%)` |
| `node scripts/clutter-audit.mjs <cfg>` | 0 | advisory inventory, `hOverflow false` |
| `node scripts/live-signal.mjs <url> "Countersigned"` | 0 | `FOUND` |
| `node scripts/live-signal.mjs <url> "ThisStringIsNotPresent"` | 1 | `MISSING` — fails closed, as documented |
| `node <SCRATCH>/kbd-check.mjs` | 0 | keyboard / a11y / overflow / console probe |
| `node <SCRATCH>/rail-kbd.mjs` | 0 | rail-node keyboard activation probe |

All five shipped scripts ran and behaved exactly as their headers document,
including the two that must fail closed.

## Defect ledger

Open defects, most-impactful first. A defect is only listed once it has a
reproduction; a hunch is not a defect. `<SCRATCH>` =
`C:/Users/hshum/AppData/Local/Temp/claude/D--VSCode-Projects-cheiron-ai-take-home/440ef9e9-83bb-4fe6-8676-4fdaaf332f3e/scratchpad`.

| # | Severity | Journey | Reproduction | Status |
|---|----------|---------|--------------|--------|
| D1 | major | J2 | `examples/trace-revamp/mockup.html` ships no document-head boilerplate. `grep -i 'doctype\|name="viewport"\|<html'` returns **0 hits**; the file opens straight into `<meta charset="utf-8">`. Three observable consequences, all measured at runtime by `node <SCRATCH>/kbd-check.mjs`: (a) `document.doctype` → `null` and `document.compatMode` → `"BackCompat"`, i.e. the demo renders in **quirks mode**; (b) `document.querySelector('meta[name=viewport]')` → `null`, so a real phone lays the page out at ~980px and scales down — the 375px layout in `state-C-mobile-375.png` is reachable only because Playwright sets the layout viewport directly; (c) `document.documentElement.getAttribute("lang")` → `null` (WCAG 3.1.1 Level A). One missing seam, three symptoms — fix it once at the top of the file, not three times. | open |
| D2 | major | J2 | Horizontal overflow at 320px. Load the mockup at viewport 320x900; `document.documentElement.scrollWidth` = **360** vs `clientWidth` = **320**. Clean at 375, 768, 1024, 1440, 1920. Measured by `node <SCRATCH>/kbd-check.mjs` (`overflow` map). **Untested hypothesis for Wave 2:** quirks mode (D1a) changes the box model document-wide, so D1 may be the upstream cause of D2 — do not assume it; re-measure at 320px *after* adding the doctype before writing any width CSS. | open |
| D3 | major | J1 | The package has zero behavioral tests. `npm test` → exit 1 `Missing script: "test"`. The declared proof, `npm run proof`, exits 0 with `12/12` but `scripts/self-check.mjs` only checks that 6 documents exist and runs `node --check` (syntax parse) on 6 scripts. Nothing asserts that `qa-gate.mjs` exits 2 on absent state, that `live-signal.mjs` exits 1 on a missing signal, or that `qa-memory.mjs` fingerprints dedupe — all three of which I had to verify by hand this pass. A green `proof` is compatible with every script being semantically broken. | open |
| D4 | minor | J2 | The screen-reader live region is declared but never announces the primary state change. `mockup.html:413` defines `<div id="srLive" aria-live="polite" role="status">`; the only write is at `:819`, for `'Digest copied to clipboard'`. Repro: focus `[data-trace="B"]`, press Enter — `aria-pressed` flips to `true`, the banner text changes to `Completed…deterministic fallback`, the footnote changes, and `document.getElementById('srLive').textContent` is still `""`. A screen-reader user is told nothing when the entire trace swaps, including when it swaps to the failed state. Same gap for the DEPTH and theme controls. | open |
| D5 | minor | J2 | No loading and no empty state exist anywhere in the demo surface — not styled poorly, absent. The repo's own auditor says so: `<SCRATCH>/qa-shots/prettify-audit.json` scores V8 "State polish (empty / loading / error)" as `n/a` with the note that empty+loading+error PNGs must be captured. Three of five states named by gate condition 5 are designed and captured; two are not. | open |

Two advisory items, deliberately **not** listed as defects because they are
advisory by their own tool's design and have no user-facing reproduction:
`prettify-audit` V2 spacing (off-4px rate 0.688, 22 distinct spacing values) and
V6 radius/shadow (9 radii, 4 shadows, 4 icon sizes). They are the correct next
targets for a PRETTIFY pass, not gate blockers.

## Iterations

_none yet — Wave 1 is baseline only. No product change was made._
