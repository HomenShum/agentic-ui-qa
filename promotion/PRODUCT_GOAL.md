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

Through iteration 2, 2026-08-13.

Rows citing `promotion/evidence/…` point at artifacts committed in this repo,
produced by `scripts/head-check.mjs` and `scripts/shell-regression-proof.mjs`,
which are committed too — output and producer, the pair the gate requires. Re-run
them with `node scripts/head-check.mjs` and `node scripts/shell-regression-proof.mjs`.
head-check measures a live document when a Playwright checkout resolves (pass
`--repo <dir with node_modules/playwright>`, the same dependency `scripts/pixels.cjs`
already documents) and falls back to reading the file's own head when none does;
its receipt records which, and a source-mode receipt is never rendered proof.

Rows still citing `<SCRATCH>/qa-shots/` are Wave 1 baseline observations whose
capture files were session-local, where `<SCRATCH>` is
`C:/Users/hshum/AppData/Local/Temp/claude/D--VSCode-Projects-cheiron-ai-take-home/440ef9e9-83bb-4fe6-8676-4fdaaf332f3e/scratchpad`.
For those the command named beside the row, not the temp file, is the durable half.

| # | Condition | Status | Evidence / reason |
|---|-----------|--------|-------------------|
| 1 | Journeys succeed end-to-end in a real browser | PASS | All 5 journeys reached their done-when. J2 (the browser journey) driven in headless Chromium via `scripts/pixels.cjs` and Playwright: 8 PNGs in `<SCRATCH>/qa-shots/` incl. `mockup-desktop-light.png`, `state-B-fallback.png`, `state-C-failed.png`; all three RUN states render their documented seal. J1/J3/J4/J5 are CLI journeys verified by exit code (0,0,0,2-then-0) — no browser involved by design. |
| 2 | No critical or major usability defect open | FAIL | D1 closed in iteration 1, D6 (its gate) and D7 closed in iteration 2. **2 majors still open**: D2 (horizontal overflow at 320px — `promotion/evidence/head-check.json` → `overflowWidths: [320]`, `scrollWidth` 360 vs `clientWidth` 320) and D3 (zero behavioral tests). Minors D4/D5 also open. See the ledger in PROMOTION_LOG.md. |
| 3 | Mobile and desktop both intentional | PASS | Both halves observed in one run of a committed producer, `node scripts/head-check.mjs`. Mobile: measured the way a phone measures it, in an `isMobile` context at 375x812 — `window.innerWidth` is **375**, not the 981 it reported before the fix, and `promotion/evidence/mobile-375-emulated.png` is the resulting render: one column, full-size body copy. The before/after pair is committed (`mobile-375-emulated-before.png` is the same page at 981px scaled onto the phone). Desktop: `promotion/evidence/desktop-1440.png`, the two-column composition at 1440, byte-identical to its pre-fix twin (sha256 `1cf36037…`) — the shell fix moved mobile without disturbing desktop. Caveat, and it belongs to condition 4 not this one: 320px still overflows (D2). Iteration 2 note: this row's PASS was, until iteration 2, guarded by nothing — deleting the shell left `npm run doctor` green at 13/13. It is now guarded, and that is proven rather than asserted: `promotion/evidence/shell-regression-proof.json` records the declared proof exiting **1** with the shell removed and **0** with it restored. Both PNGs above were also re-generated after `head-check.mjs` was restructured and came back byte-identical (`0ddb46c8…`, `1cf36037…`). |
| 4 | No horizontal overflow at supported widths | FAIL | Unchanged, and now proven independent of D1. `promotion/evidence/head-check.json` → 320px `scrollWidth` 360 > `clientWidth` 320; clean at 375/768/1024/1440/1920. `head-check-before.json` records **the same 360** on the pre-fix tree, which kills Wave 1's hypothesis that quirks mode caused it. Regenerate: `node scripts/head-check.mjs`. |
| 5 | Loading/empty/success/error/agent-running designed | FAIL | Three states are designed and captured — success (`mockup-desktop-light.png`, live GLM run, real cost/tokens), honest degrade (`state-B-fallback.png`, dashed-amber rail break, $0.000, provisional seal, no invented hash), failure (`state-C-failed.png`, red seal, 2 real validation issues, "blocked — not signable"). Loading and empty do not exist in the DOM at all. The repo's own rubric flags this: `prettify-audit.json` scores V8 "State polish (empty / loading / error)" as `n/a`. |
| 6 | Keyboard and basic accessibility pass | FAIL | Keyboard half passes: 13 tab stops, every one with `outline: 2px solid`, all 6 rail nodes `role="button"` + `aria-expanded`, Enter AND Space both expand (height 104→283.25→104), RUN buttons keep `aria-pressed` in sync. Accessibility half fails on one count now instead of two: `lang` was fixed in iteration 1 (`promotion/evidence/head-check.json` → `"lang": "en"`), but the `#srLive` `aria-live="polite"` region is declared at mockup.html:413 but written only at :819 for "Digest copied" — after keyboard-switching RUN to B its text is still `""`, so a screen-reader user is told nothing when the whole trace changes. |
| 7 | Web Interface Guidelines: no major unresolved | UNVERIFIED | The Vercel Web Interface Guidelines review named in SKILLS.md was not run this pass — that reviewer is not installed in this environment and a baseline does not install authorities. Nothing about this condition was observed; the viewport/quirks findings under 2–4 come from my own runtime probes, not from that review. |
| 8 | Web-quality audit: no major unresolved | UNVERIFIED | No Lighthouse, axe, or Core Web Vitals run this pass. Partial signal only, from the repo's own advisory auditor: `node scripts/prettify-audit.mjs` → 10/16, V5 contrast "0 text nodes below WCAG floor", focus styles present; V2 spacing (off-4px rate 0.688) and V6 radius/shadow (9 radii, 4 shadows) score 0. Advisory by design (exit 0), and it does not cover CWV — so this condition stays unobserved. |
| 9 | No unexplained console errors or failed requests | PASS | Zero across 9 page loads. `pixels.cjs` reported `consoleErrors:0` on all 8 shots; `kbd-check.mjs` attached `console`/`pageerror`/`requestfailed`/`response>=400` listeners and returned `consoleErrors: []`, `failedRequests: []`. `clutter-audit.json`: `console errors 0 | mojibake 0 | charset UTF-8`. |
| 10 | Performance does not obstruct interaction | PASS | Observed, not modelled: cold load to `networkidle` 849ms (`kbd-check.mjs` → `loadMs`). Every state change (RUN A→B, theme toggle, rail expand) completed inside a 350–400ms wait and was confirmed by a re-read of the rendered DOM, so no interaction was left waiting. `prettify-audit.json` V9 = 2: 0 transitions >400ms, 0 infinite animations. |
| 11 | Tests and build green | FAIL | There is nothing to be green. `npm test` → exit 1 `Missing script: "test"`. `npm run build` → exit 1 `Missing script: "build"`. The declared proof does pass — `npm run proof` → exit 0, `PASS agentic-ui-qa self-check (15/15)`, receipt at `.nodekit/agentic-ui-qa-self-check.json` — and as of iteration 2 that pass means something: the count moved 13→15 because self-check stopped merely `node --check`-ing `head-check.mjs` and started **running** it against the demo surface. Iteration 1's claim on this row was wrong in a way worth recording: it said `head-check.mjs` "exits 1 on a broken shell, confirmed against the pre-fix tree", which was true of the script and false of the gate — nothing invoked it, so deleting the whole document shell still returned `exit 0, 13/13` from both `doctor` and `proof`. That is D6, closed in iteration 2 and evidenced by `promotion/evidence/shell-regression-proof.json`. Still FAIL: no `test` script, no `build` script, and `proof` exercises the real behaviour of exactly one of the eight scripts. `live-signal.mjs` failing closed, `qa-gate.mjs` returning 2 with no prior state, and `qa-memory.mjs` deduping fingerprints remain hand-checked. D3 narrows and stands. |
| 12 | Verified in the rendered app, not inferred from code | PASS | Iteration 2 held to the same standard on a change that was mostly plumbing: `head-check.mjs` was restructured, so it was re-run against a live document (`mode: "rendered"`, `compatMode CSS1Compat`, `mobileLayoutViewport 375`) and against a local HTTP server on :4402, and both committed PNGs were re-generated and compared by sha256 rather than assumed unchanged. The central claim — that the gate goes red — was produced by executing the deletion and reading two exit codes, not by reading the new code and believing it: `promotion/evidence/shell-regression-proof.json`. Iteration 1's single improvement was verified by rendering it, not by re-reading the file: the shell values in `promotion/evidence/head-check.json` are read off a live document via `page.evaluate`, and both PNGs beside it were opened and looked at. The claim that the fix did not disturb desktop is a sha256 comparison of two renders, not an argument. Baseline note follows. No improvements were made in the baseline pass — it is a starting line, so that claim is about the observations themselves. Every scorecard row above that concerns the demo surface traces to a rendered-app artifact: 8 PNGs I opened and looked at, plus two Playwright DOM probes (`kbd-check.mjs`, `rail-kbd.mjs`). Nothing was scored from reading source alone; where source is cited (mockup.html:413/:819) it is a second confirmation of a runtime observation, never the first. |

**Status: NOT PROMOTED** — 5/12 PASS (iteration 2, 2026-08-13). PASS 1, 3, 9, 10, 12 ·
FAIL 2, 4, 5, 6, 11 · UNVERIFIED 7, 8. Unchanged from iteration 1 by design:
iteration 2 fixed a defect in the gate, not on the surface the gate scores, so no
condition moved. What changed is that condition 3's PASS is now guarded — see D6.
