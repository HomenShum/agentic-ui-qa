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

Through iteration 3, 2026-08-13.

Every row below names an artifact under `promotion/evidence/` and the committed
script that regenerates it — output and producer, the pair the gate requires. The
four producers are:

| Producer | Regenerate with | Writes |
|---|---|---|
| `scripts/head-check.mjs` | `node scripts/head-check.mjs --evidence` | `head-check.json`, `mobile-375-emulated.png`, `desktop-1440.png` |
| `scripts/shell-regression-proof.mjs` | `node scripts/shell-regression-proof.mjs --evidence` | `shell-regression-proof.json` |
| `scripts/wig-review.mjs` | `npm run audit:wig -- --evidence` | `wig-review.json`, `wig-desktop-1440.png`, `wig-dark-1440.png`, `wig-state-{A..E}.png` |
| `scripts/web-quality-audit.mjs` | `npm run audit:web -- --evidence` | `lighthouse.json`, `axe.json`, `web-quality-audit.json` |

Without `--evidence` they write into the gitignored `.nodekit/`, so a bare run
never rewrites the artifacts cited here. The two browser producers need a
Playwright checkout (`--repo <dir>` or `$PLAYWRIGHT_REPO`); `web-quality-audit`
additionally needs npm and a Chrome, and installs Lighthouse and the axe CLI on
demand with `npx --yes`. Neither has a source-only mode: a review of a document
that was never rendered is not a review, so both exit **2** rather than
downgrade.

`promotion/evidence/before/` holds the same two receipts produced by the same two
scripts against the **pre-fix** surface — `git stash push -- examples/trace-revamp/mockup.html`,
run with `--out-dir promotion/evidence/before`, `git stash pop`. Both exit 1
there. A check that is green on the tree it is meant to indict is guarding
nothing, and this repo has already shipped that bug once (D6).

| # | Condition | Status | Evidence / reason |
|---|-----------|--------|-------------------|
| 1 | Journeys succeed end-to-end in a real browser | PASS | All 5 journeys reached their done-when. J2 (the browser journey) is now driven by a committed producer rather than a session-local config: `wig-review.mjs` clicks every RUN state and captures `promotion/evidence/wig-state-A.png` … `wig-state-E.png`, plus `wig-desktop-1440.png` and `wig-dark-1440.png`. J1/J3/J4/J5 are CLI journeys verified by exit code (0,0,0,2-then-0) — no browser involved by design. |
| 2 | No critical or major usability defect open | PASS | Every major in the ledger is closed and each closure names its receipt: D1 and D6 (document shell, and the gate that guards it) in iterations 1–2; **D2** (320px overflow) — `head-check.json` → `overflowWidths: []`, was `[320]` with `scrollWidth` 360; **D4** (silent live region) — `wig-review.json` → Interactions/"Announce async updates" reads back `"Trace B. Completed. Model route timed out, attribution degraded — provisional receipt, no tokens billed. Detail level human."` where it read `""` before; **D5** (no loading or empty state) — `wig-state-D.png` / `wig-state-E.png` and `wig-review.json` → `perState.D.ariaBusy "true"`, `skeletonBars 6`, `perState.E.emptyBlocks 1`; **D3** (no behavioural tests) — closed by the human-ready pass at `682f56a`, re-run this pass: `npm test` → **32 pass, 0 fail, exit 0**, and the three behaviours D3 named are among them (`qa-memory` fingerprint dedupe, `qa-gate` refusing with no config and with no prior state, `live-signal` requiring a live page and a stability window). Open items are all minor and all recorded with measurements: WIG Content/"Headings & skip link" (no skip link on a single-view surface) and Content/"Semantics before ARIA" (6 rail nodes are `div[role=button]`, not `<button>`), plus the 44px mobile hit-target shortfall on the two segmented controls (`wig-review.json` → `underMobileFloor`, 9 controls). |
| 3 | Mobile and desktop both intentional | PASS | Unchanged and re-measured. `node scripts/head-check.mjs --evidence` in an `isMobile` context at 375x812 reports `window.innerWidth` **375**, `promotion/evidence/mobile-375-emulated.png` is the resulting single-column render, `desktop-1440.png` the two-column composition. Guarded, not merely claimed: `shell-regression-proof.json` records the declared proof exiting **1** with the document shell removed and **0** with it restored. |
| 4 | No horizontal overflow at supported widths | PASS | **Was FAIL.** `promotion/evidence/head-check.json` → `overflowWidths: []`; `scrollWidth == clientWidth` at 320, 375, 768, 1024, 1440, 1920. Independently at the same six widths in `wig-review.json` → Layout/"Responsive coverage". The pre-fix pair is committed: `head-check-before.json` and `before/wig-review.json` both record 320px `scrollWidth` **360** vs `clientWidth` 320. Root cause was one missing clamp, not a width: `.stage` sized its single column `1fr`, and `1fr` is `minmax(auto,1fr)` whose automatic minimum adopts the widest item's min-content — `.inspector`'s fixed `width:340px`. The two-column rule at ≥860px already wrote `minmax(0,1fr)`; the one-column rule did not. `.inspector`'s own `max-width:100%` cannot help, because it resolves against the track being sized. |
| 5 | Loading/empty/success/error/agent-running designed | PASS | **Was FAIL.** All five reachable from the one RUN control and each captured: success `wig-state-A.png`, honest degrade `wig-state-B.png`, failure `wig-state-C.png`, agent-running `wig-state-D.png`, empty `wig-state-E.png`. Read back rather than asserted (`wig-review.json` → Content/"All states designed"): D reports `aria-busy "true"`, 6 skeleton bars and the panel text `Consent · sealed / Read · sealed / Plan · sealed`; E reports 1 empty block and `No agent run on this deck yet…`. The running state shows no cost, no candidate digest and no signature line for work that has not happened — `$— · not yet billed` — which is the same honesty rule the other three states already followed. |
| 6 | Keyboard and basic accessibility pass | PASS | **Was FAIL.** Keyboard: 15 tab stops, every one with a visible `:focus-visible` ring read off the focused element (`wig-review.json` → Interactions/"Clear focus", `withoutVisibleRing: []`), and the one non-native control proves the WAI-ARIA button pattern — `aria-expanded` false → true on **Enter** → false on **Space**. Accessibility: axe-core 4.13.0 reports **0 violations, 30 passes** (`promotion/evidence/axe.json`), Lighthouse accessibility **1.00**, and the half that held this row — the `#srLive` region that never announced — now announces every trace and depth change from inside `render()`, the single funnel all of them pass through. `landmark-one-main` and `region`, both open before this pass, closed by making the narrative column a `<main>`. |
| 7 | Web Interface Guidelines: no major unresolved | PASS | **Was UNVERIFIED.** A review was performed against https://vercel.com/design/guidelines (fetched 2026-08-13), not a tool score: `node scripts/wig-review.mjs --evidence` → **28 guidelines checked, 20 pass, 2 fail (both minor), 5 requiring human eyes, 1 n/a, exit 0**, receipt `promotion/evidence/wig-review.json`. Each check carries the guideline's own title, its section, a severity, and the DOM measurement behind it. The five perceptual guidelines (optical alignment, deliberate alignment, easing, layered shadows, lockup contrast) are recorded `status: "eyes"` with the screenshots a reviewer must open, and are never auto-passed. Five majors were open before and are closed with measurements: Announce async updates, Responsive coverage, No excessive scrollbars, All states designed, Minimum contrast — `promotion/evidence/before/wig-review.json` records the same review on the pre-fix tree at **12 pass, 10 fail, exit 1**. Two minors stay open, listed in row 2. **This row is not a Lighthouse score and must never be closed by one**; condition 8's tools measure a different, mostly disjoint set. |
| 8 | Web-quality audit: no major unresolved | PASS | **Was UNVERIFIED.** `node scripts/web-quality-audit.mjs --evidence` serves the demo surface on 127.0.0.1:4913 and runs both authorities against it, exit 0. Lighthouse 13.4.1 (`promotion/evidence/lighthouse.json`): performance **1.00**, accessibility **1.00**, best-practices **1.00**, SEO **0.91**. Core Web Vitals: **LCP 1358ms, CLS 0, TBT 0ms, FCP 1071ms**. axe-core 4.13.0 (`promotion/evidence/axe.json`): **0 violations**, 30 passes, 1 `incomplete`. That incomplete is not waved through — axe leaves `color-contrast` undecided on 21 nodes because it will not composite a gradient backdrop, and `wig-review.mjs` Design/"Minimum contrast" decides exactly those 21 by resolving every gradient stop the browser reports. Two moderate violations were open before (`landmark-one-main`, `region`) and one **serious** incomplete (`aria-prohibited-attr`), all closed; `promotion/evidence/before/web-quality-audit.json` records that state at exit 1. Remaining Lighthouse failures are recorded and not major: `robots-txt` and `llms-txt` cannot exist for a single self-contained file served from a scratch origin, and `unminified-css` / `unminified-javascript` / `unused-css-rules` are deliberate — this file is a reference artifact people read. |
| 9 | No unexplained console errors or failed requests | PASS | Now resting on a committed artifact instead of a session-local one. `wig-review.json` → Review context/"Console & network hygiene": `consoleErrors: []`, `failedRequests: []` across 4 page loads, with `console`, `pageerror`, `requestfailed` and `response >= 400` listeners attached for the whole review. Lighthouse's `errors-in-console` and `best-practices` are both clean in the same pass (`lighthouse.json`, best-practices 1.00). |
| 10 | Performance does not obstruct interaction | PASS | Measured by Lighthouse rather than by a stopwatch: **TBT 0ms** (the main thread is never blocked long enough to drop an interaction), **CLS 0** (nothing moves under the pointer), LCP 1358ms, performance category **1.00** — `promotion/evidence/lighthouse.json`, regenerate with `npm run audit:web -- --evidence`. Corroborated in the review: every state change (RUN A→B→C→D→E, theme toggle, rail expand) completed inside a 350ms wait and was confirmed by re-reading the rendered DOM, so no interaction was left waiting (`wig-review.json` → Content/"All states designed", `perState`). |
| 11 | Tests and build green | FAIL | Half of this row moved and half did not, so it stays FAIL and says which half. Tests are green: `npm test` → **32 pass, 0 fail, exit 0**, measured this pass — the row's previous text (`Missing script: "test"`) went stale at commit `682f56a`, which added `test/` and the `test` script without updating this scorecard. `npm run doctor` → `PASS agentic-ui-qa self-check (21/21)`, and that pass has teeth: `shell-regression-proof.json` shows it going red when the demo surface stops being a document. **`npm run build` still exits 1, `Missing script: "build"`.** This pass declined to add a no-op `build` script to turn the row green — inventing a command that does nothing so a gate reports success is the failure this gate exists to catch. The honest resolutions are a real build step or a gate that records "no build stage" explicitly; neither is this pass's to decide. |
| 12 | Verified in the rendered app, not inferred from code | PASS | Held on a pass whose central risk was a check that looks right and measures nothing. It happened, and it is recorded rather than quietly fixed: the contrast resolver first reported "0 nodes below floor" having scored **zero** nodes, because this page is authored in oklch and neither `getComputedStyle` nor canvas `fillStyle` converts a colour — both hand back `oklch(...)` verbatim, and an rgb-only parse rejected every element. It now resolves colour by painting one pixel and reading it back, `textNodesScored` is in the receipt, and a scan that scores nothing can no longer pass. It is also checked against the authority instead of trusted: on the same tree, six nodes axe scored itself agree with this resolver to within **0.04** (axe 5.39/6.76/9.96/6.22/6.01/6.16 vs 5.39/6.73/9.97/6.26/6.01/6.20 — `before/wig-review.json` beside `before/axe.json`). Every claim in the rows above was read off a rendered document or a tool's own JSON: the state screenshots were opened and looked at, the 320px fix was confirmed to move `scrollWidth` rather than to hide overflow behind `overflow-x`, and the pre-fix receipts were produced by running the final producers against the stashed surface, not by remembering what they used to say. |

**Status: NOT PROMOTED** — 11/12 PASS (iteration 3, 2026-08-13). PASS 1, 2, 3, 4,
5, 6, 7, 8, 9, 10, 12 · FAIL 11 · UNVERIFIED none. The single open condition is
condition 11, and only its build half: there is no `build` script in this
package. Two minor Web Interface Guidelines findings and one 44px mobile
hit-target shortfall remain open and are recorded with their measurements in the
ledger; none is major.

### A coverage fact worth carrying forward

The axe CLI rendered this page with `prefers-color-scheme: dark` — readable
straight off its own receipt, where every passing node reports a backdrop like
`#111315`. So axe's clean contrast result is a statement about the **dark**
theme, and the light theme was measured by nobody until this pass. That is why
`wig-review.mjs` scores contrast in both schemes, and it is why the light theme
turned out to hold 20 nodes below the WCAG AA floor while every automated tool
was green. Two ink tokens fixed all twenty: `--ap-faint` 0.55 → 0.50, and four
text usages that had reached for `--ap-human` (the marker ink, 2.75–2.81:1 as
text) instead of `--ap-human-strong`, which is the text ink and is the one that
flips per theme. **A green tool is a green tool in the mode it happened to
render.**
