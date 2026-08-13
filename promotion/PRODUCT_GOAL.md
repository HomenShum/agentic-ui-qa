# Product goal — agentic-ui-qa

## Who opens this, and what they are trying to finish

Someone has built an app where a computer assistant does work on a person's
behalf — rewrites a slide, edits a document, sends a summary — and they are
about to let strangers use it. Their automated tests are green, and that is
exactly the problem: the tests never checked whether the screen tells the truth.
A real failure they have already seen once is the app printing a green
"Done — updated!" after the assistant actually timed out and fell back to a
canned result, so the person walks away believing an edit happened that never
did. They also cannot answer simple questions a careful user asks: what did the
assistant read, what did it change, what did it cost, and can I undo it. They
arrive wanting a repeatable procedure someone else can re-run and disagree with,
not a one-off opinion. This repository is that procedure (a QA and dogfooding
*protocol*, written as plain Markdown plus a few Node scripts, executed by
whatever coding agent they already use). What they walk away holding is a scored
report in which every "this works" points at a picture captured in that session
or a command that exited zero, a ranked list of what to fix first, and an
append-only record so the same defect is re-checked in every future pass instead
of being rediscovered. **In one sentence for a stranger: it is a checklist plus
a handful of scripts that force an honest, evidence-backed answer to "can a
person, or another program, actually trust and operate this screen?"**

## The gate

This repo is judged by the twelve-condition PROMOTION gate, which lives in one
place and is not restated here:

**https://github.com/HomenShum/NodeKit/blob/main/templates/promotion/GATE.md**

Gate variant: `reduced` <!-- reduced = library/CLI judged on its demo
surface and quickstart; see the GATE's reduced-gate section -->

Scoring vocabulary is PASS / FAIL / **UNVERIFIED**, and UNVERIFIED is never PASS.

The demo surface under judgement is `examples/trace-revamp/mockup.html` — the
repo's only rendered browser artifact. The quickstart under judgement is
`git clone` plus `npm run doctor`.

## Canonical journeys

The work queue lives in [PRODUCT_JOURNEYS.md](PRODUCT_JOURNEYS.md). A journey
without browser evidence is unfinished, however green the tests are.

## Loop state

Every iteration is recorded in [PROMOTION_LOG.md](PROMOTION_LOG.md) — journey
exercised, defect fixed, evidence path, conditions newly passing. Loop state
lives in git, never in an agent's memory, so any agent can resume the loop cold.

## Current scorecard

Baseline pass, 2026-08-13. Evidence paths are session-local absolute paths in the
capture directory `<SCRATCH>/qa-shots/`, where
`<SCRATCH>` is
`C:/Users/hshum/AppData/Local/Temp/claude/D--VSCode-Projects-cheiron-ai-take-home/440ef9e9-83bb-4fe6-8676-4fdaaf332f3e/scratchpad`.
Every one is regenerable by the command named beside it; the commands, not the
temp files, are the durable evidence.

| # | Condition | Status | Evidence / reason |
|---|-----------|--------|-------------------|
| 1 | Journeys succeed end-to-end in a real browser | PASS | All 5 journeys reached their done-when. J2 (the browser journey) driven in headless Chromium via `scripts/pixels.cjs` and Playwright: 8 PNGs in `<SCRATCH>/qa-shots/` incl. `mockup-desktop-light.png`, `state-B-fallback.png`, `state-C-failed.png`; all three RUN states render their documented seal. J1/J3/J4/J5 are CLI journeys verified by exit code (0,0,0,2-then-0) — no browser involved by design. |
| 2 | No critical or major usability defect open | FAIL | 2 majors open, see ledger D1/D2 in PROMOTION_LOG.md. D1: no `<meta name="viewport">` in `examples/trace-revamp/mockup.html` (grep returns 0 hits; runtime `document.querySelector('meta[name=viewport]')` → null), so a real phone lays the page out at ~980px and scales down. D2: horizontal overflow at 320px. |
| 3 | Mobile and desktop both intentional | FAIL | The CSS *does* reflow — `mockup-mobile-375.png` shows a correct single-column layout at 375px. But that layout is unreachable on a real device: no viewport meta tag (D1), so mobile is accidental. Playwright reaches it only because `setViewportSize` sets the layout viewport directly. |
| 4 | No horizontal overflow at supported widths | FAIL | Measured at 6 widths via `node <SCRATCH>/kbd-check.mjs`. 320px: `scrollWidth` 360 > `clientWidth` 320 → overflows. 375/768/1024/1440/1920: no overflow. `pixels.cjs` also reports `hOverflow:false` at 1440 and 375. |
| 5 | Loading/empty/success/error/agent-running designed | FAIL | Three states are designed and captured — success (`mockup-desktop-light.png`, live GLM run, real cost/tokens), honest degrade (`state-B-fallback.png`, dashed-amber rail break, $0.000, provisional seal, no invented hash), failure (`state-C-failed.png`, red seal, 2 real validation issues, "blocked — not signable"). Loading and empty do not exist in the DOM at all. The repo's own rubric flags this: `prettify-audit.json` scores V8 "State polish (empty / loading / error)" as `n/a`. |
| 6 | Keyboard and basic accessibility pass | FAIL | Keyboard half passes: 13 tab stops, every one with `outline: 2px solid`, all 6 rail nodes `role="button"` + `aria-expanded`, Enter AND Space both expand (height 104→283.25→104), RUN buttons keep `aria-pressed` in sync. Accessibility half fails: `document.documentElement.getAttribute("lang")` → `null` (WCAG 3.1.1 Level A), and the `#srLive` `aria-live="polite"` region is declared at mockup.html:413 but written only at :819 for "Digest copied" — after keyboard-switching RUN to B its text is still `""`, so a screen-reader user is told nothing when the whole trace changes. |
| 7 | Web Interface Guidelines: no major unresolved | UNVERIFIED | The Vercel Web Interface Guidelines review named in SKILLS.md was not run this pass — that reviewer is not installed in this environment and a baseline does not install authorities. Nothing about this condition was observed; the viewport/quirks findings under 2–4 come from my own runtime probes, not from that review. |
| 8 | Web-quality audit: no major unresolved | UNVERIFIED | No Lighthouse, axe, or Core Web Vitals run this pass. Partial signal only, from the repo's own advisory auditor: `node scripts/prettify-audit.mjs` → 10/16, V5 contrast "0 text nodes below WCAG floor", focus styles present; V2 spacing (off-4px rate 0.688) and V6 radius/shadow (9 radii, 4 shadows) score 0. Advisory by design (exit 0), and it does not cover CWV — so this condition stays unobserved. |
| 9 | No unexplained console errors or failed requests | PASS | Zero across 9 page loads. `pixels.cjs` reported `consoleErrors:0` on all 8 shots; `kbd-check.mjs` attached `console`/`pageerror`/`requestfailed`/`response>=400` listeners and returned `consoleErrors: []`, `failedRequests: []`. `clutter-audit.json`: `console errors 0 | mojibake 0 | charset UTF-8`. |
| 10 | Performance does not obstruct interaction | PASS | Observed, not modelled: cold load to `networkidle` 849ms (`kbd-check.mjs` → `loadMs`). Every state change (RUN A→B, theme toggle, rail expand) completed inside a 350–400ms wait and was confirmed by a re-read of the rendered DOM, so no interaction was left waiting. `prettify-audit.json` V9 = 2: 0 transitions >400ms, 0 infinite animations. |
| 11 | Tests and build green | FAIL | There is nothing to be green. `npm test` → exit 1 `Missing script: "test"`. `npm run build` → exit 1 `Missing script: "build"`. The declared proof does pass — `npm run proof` → exit 0, `PASS agentic-ui-qa self-check (12/12)`, receipt at `.nodekit/agentic-ui-qa-self-check.json` — but read `scripts/self-check.mjs`: it checks 6 files exist and runs `node --check` on 6 scripts. Zero behavioral tests exist for the 5 shipped scripts, all of which I had to exercise by hand to learn they work. |
| 12 | Verified in the rendered app, not inferred from code | PASS | No improvements were made this pass — it is a baseline, so the claim is about the observations themselves. Every scorecard row above that concerns the demo surface traces to a rendered-app artifact: 8 PNGs I opened and looked at, plus two Playwright DOM probes (`kbd-check.mjs`, `rail-kbd.mjs`). Nothing was scored from reading source alone; where source is cited (mockup.html:413/:819) it is a second confirmation of a runtime observation, never the first. |

**Status: NOT PROMOTED** — 4/12 PASS.
