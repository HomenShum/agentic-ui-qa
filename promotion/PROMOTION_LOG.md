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
| D1 | major | J2 | **FIXED — iteration 1.** `examples/trace-revamp/mockup.html` ships no document-head boilerplate. `grep -i 'doctype\|name="viewport"\|<html'` returns **0 hits**; the file opens straight into `<meta charset="utf-8">`. Three observable consequences, all measured at runtime by `node <SCRATCH>/kbd-check.mjs`: (a) `document.doctype` → `null` and `document.compatMode` → `"BackCompat"`, i.e. the demo renders in **quirks mode**; (b) `document.querySelector('meta[name=viewport]')` → `null`, so a real phone lays the page out at ~980px and scales down — the 375px layout in `state-C-mobile-375.png` is reachable only because Playwright sets the layout viewport directly; (c) `document.documentElement.getAttribute("lang")` → `null` (WCAG 3.1.1 Level A). One missing seam, three symptoms — fix it once at the top of the file, not three times. Fixed at the top of the file **and** at the instruction that produced it (`REVAMP.md` step 4 specified the head as exactly one tag). Re-proved: `promotion/evidence/head-check.json` → `doctype html · CSS1Compat · lang en · viewport width=device-width · mobileLayoutViewport 375`. **Iteration 2 correction:** the root-cause half was one copy short. `REVAMP.md` carried the same directive a THIRD time at :165, in "Non-negotiables at every tier" — *"charset first line"*, verbatim and scoped more broadly than the step-4 text. An agent following the non-negotiables checklist would still have authored a fragment. Rewritten there too. | **closed** |
| D2 | major | J2 | Horizontal overflow at 320px. Load the mockup at viewport 320x900; `document.documentElement.scrollWidth` = **360** vs `clientWidth` = **320**. Clean at 375, 768, 1024, 1440, 1920. Measured by `node <SCRATCH>/kbd-check.mjs` (`overflow` map). ~~**Untested hypothesis for Wave 2:** quirks mode (D1a) changes the box model document-wide, so D1 may be the upstream cause of D2 — do not assume it; re-measure at 320px *after* adding the doctype before writing any width CSS.~~ **Hypothesis tested and FALSE (iteration 1).** Measured with only the doctype added and no CSS touched: 320px `scrollWidth` is **360 both before and after** — identical. `promotion/evidence/head-check-before.json` and `head-check.json` both record `overflow["320"] = {scrollWidth: 360, clientWidth: 320}`. Quirks mode was never the cause; D2 is an independent CSS width defect and still needs a width fix. Corroborating: `desktop-1440-before.png` and `desktop-1440.png` are byte-identical (sha256 `1cf36037…`), so the box-model switch changed no layout at all. **FIXED — iteration 3.** Root cause is a missing clamp, not a width. `.stage` sized its single column `1fr`, and `1fr` is `minmax(auto,1fr)` whose automatic minimum adopts the widest item's min-content contribution — which is `.inspector`'s fixed `width:340px`. `.inspector`'s own `max-width:100%` cannot rescue it, because a percentage max-width resolves against the track currently being sized. The two-column rule at `@media(min-width:860px)` already wrote `minmax(0,1fr)` for exactly this reason; the one-column rule was one clamp short — the same one-copy-short shape as D1 and D6. One token changed: `1fr` -> `minmax(0,1fr)`. Re-proved: `promotion/evidence/head-check.json` -> `overflowWidths: []`, and independently `promotion/evidence/wig-review.json` -> Layout/"Responsive coverage" clean at 320/375/768/1024/1440/1920. Checked that it moves layout rather than hiding it: with the clamp applied no element's `right` exceeds `clientWidth` and no element reports `scrollWidth > clientWidth`, so nothing is being clipped behind the body's `overflow-x:hidden`. | **closed** |
| D3 | major | J1 | The package has zero behavioral tests. `npm test` → exit 1 `Missing script: "test"`. The declared proof, `npm run proof`, exits 0 with `12/12` but `scripts/self-check.mjs` only checks that 6 documents exist and runs `node --check` (syntax parse) on 6 scripts. Nothing asserts that `qa-gate.mjs` exits 2 on absent state, that `live-signal.mjs` exits 1 on a missing signal, or that `qa-memory.mjs` fingerprints dedupe — all three of which I had to verify by hand this pass. A green `proof` is compatible with every script being semantically broken. **Narrowed, not closed, in iteration 2:** `npm run proof` now runs `head-check.mjs` for real against the demo surface (13/13 → 15/15) and a green proof is no longer compatible with a broken document shell — see D6. The other three behaviours above are still hand-checked only. **CLOSED — by commit `682f56a`, confirmed by re-running it in iteration 3.** The human-ready pass added `test/` and a `test` script; this ledger and the scorecard never caught up, which is why the row read `Missing script: "test"` long after it stopped being true. Measured this pass: `npm test` -> **32 pass, 0 fail, exit 0**, and the three behaviours this defect named are among the 32 by name — `qa-memory` giving one fingerprint to the same defect found twice, `qa-gate` refusing with no config and refusing with no prior state, and `live-signal` requiring both a live page and a stability window before it will call something absent. What remains is condition 11's other half, `npm run build`, which is not a test defect. | **closed** |
| D6 | major | J1 | **FIXED — iteration 2.** D1's fix had no automated regression gate, so the repository could lose it again silently. `scripts/self-check.mjs` listed `head-check.mjs` but only spawned `node --check` on it — a **syntax parse**, not a run — and `.github/workflows/node-platform-conformance.yml` delegated entirely to NodeKit `repo check`, which asserts only that `nodekit.yaml`'s `proof.command` *references* an existing npm script and never executes it. Decisive reproduction, run on a fresh clone of `5134a04`: delete the four-line document shell out of `examples/trace-revamp/mockup.html` → `npm run doctor` **exit 0 `PASS (13/13)`** and `npm run proof` **exit 0 `PASS (13/13)`**. The producer worked; nothing ran it. Fixed at the seam: self-check now *runs* head-check against the demo surface (13/13 → 15/15), head-check gained a browserless source mode so it can gate where no browser is installed, and CI gained a job that actually executes `npm run proof`. Re-proved: `promotion/evidence/shell-regression-proof.json` → same command, **exit 1** without the shell, exit 0 with it. | **closed** |
| D4 | minor | J2 | The screen-reader live region is declared but never announces the primary state change. `mockup.html:413` defines `<div id="srLive" aria-live="polite" role="status">`; the only write is at `:819`, for `'Digest copied to clipboard'`. Repro: focus `[data-trace="B"]`, press Enter — `aria-pressed` flips to `true`, the banner text changes to `Completed…deterministic fallback`, the footnote changes, and `document.getElementById('srLive').textContent` is still `""`. A screen-reader user is told nothing when the entire trace swaps, including when it swaps to the failed state. Same gap for the DEPTH and theme controls. **FIXED — iteration 3.** The announcement went into `render()`, the single funnel every trace and depth change already passes through, rather than into each control's handler — one place, all callers, and the next control added inherits it. The text is derived from the same trace fields the banner renders, so it cannot say something the screen does not; the theme toggle announces from its own click handler because it does not route through `render()`. Re-proved by driving it: `promotion/evidence/wig-review.json` -> Interactions/"Announce async updates" focuses `[data-trace="B"]`, activates it and reads the region back — `"Trace B. Completed. Model route timed out, attribution degraded — provisional receipt, no tokens billed. Detail level human."` where `promotion/evidence/before/wig-review.json` records `""`. | **closed** |
| D5 | minor | J2 | No loading and no empty state exist anywhere in the demo surface — not styled poorly, absent. The repo's own auditor says so: `<SCRATCH>/qa-shots/prettify-audit.json` scores V8 "State polish (empty / loading / error)" as `n/a` with the note that empty+loading+error PNGs must be captured. Three of five states named by gate condition 5 are designed and captured; two are not. **FIXED — iteration 3.** Both states are reachable from the RUN control that already existed, as `D · running` and `E · empty`, rather than behind a timer — a state you cannot select is a state nobody can screenshot or argue with, and arguing with screenshots is this repo's entire product. `D` shows three hops sealed and three not, `aria-busy="true"`, and `$— · not yet billed`: no cost, no candidate digest and no signature line for work that has not happened, which is the rule A/B/C already followed. `E` says what is absent and what the person would do to make something appear. Re-proved: `promotion/evidence/wig-state-D.png`, `wig-state-E.png`, and `wig-review.json` -> Content/"All states designed" reads back `perState.D.ariaBusy "true"`, `skeletonBars 6`, `perState.E.emptyBlocks 1`. | **closed** |
| D7 | minor | J1 | **FIXED — iteration 2.** `examples/trace-revamp/implementation-spec.md:3` declared *"Proven mockup: `trace-tab-merged.html`"*. No such file exists — the directory holds `README.md`, `implementation-spec.md`, `mockup.html`. A reader following the spec to its proven artifact lands on nothing. Pre-existing, and pointed at by an iteration-1 edit to that same line, which is how it surfaced. Now names `mockup.html`, beside it. | **closed** |

Two advisory items, deliberately **not** listed as defects because they are
advisory by their own tool's design and have no user-facing reproduction:
`prettify-audit` V2 spacing (off-4px rate 0.688, 22 distinct spacing values) and
V6 radius/shadow (9 radii, 4 shadows, 4 icon sizes). They are the correct next
targets for a PRETTIFY pass, not gate blockers.

## Iterations

### Iteration 1 — 2026-08-13 — the demo surface was a fragment, not a document

- **Journey exercised:** J2 "Show me what an honest agent-trace screen looks like
  before I redesign mine" — the one journey that renders in a browser.

- **Observed (D1, major).** Open `examples/trace-revamp/mockup.html` in a
  mobile-emulated Chromium context at 375x812 (`isMobile: true`) and read the
  document back. Pre-fix, all four shell values are wrong at once:
  `document.doctype` → `null`, `document.compatMode` → `"BackCompat"`,
  `document.documentElement.lang` → `null`,
  `document.querySelector('meta[name=viewport]')` → `null`. The consequence is
  visible, not theoretical: `window.innerWidth` reports **981px** on a 375px
  device, so the phone lays out the desktop two-column composition and scales it
  down — `promotion/evidence/mobile-375-emulated-before.png` is that render, and
  its body copy is roughly 5px tall. Wave 1 inferred this from the missing tag;
  this pass measured it. Reproduce: `node scripts/head-check.mjs` on the pre-fix
  tree → exit 1, five named failures.

- **Root cause — the file was obeying the instructions.** Not "someone forgot the
  boilerplate". `REVAMP.md` step 4, the instruction that produces every mockup this
  protocol ships, specified the document head as exactly one tag: *"single HTML,
  `<meta charset="utf-8">` FIRST line"*. It named charset because charset is the
  only head-level trap the protocol had ever measured (`SKILL.md` U5, mojibake).
  A mockup built to that instruction is a fragment the browser silently repairs,
  and it repairs it wrong three ways at once. `mockup.html` opens at
  `<meta charset="utf-8">` because it did what it was told. So the fix had to land
  in two places or it would come straight back on the next mockup: the file, and
  the sentence that produced the file.

- **Fixed:**
  - `examples/trace-revamp/mockup.html` — four lines at the top:
    `<!doctype html>`, `<html lang="en">`, the existing charset meta,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`.
    No CSS touched.
  - `REVAMP.md` step 4 — now specifies the four-line shell as a block, states the
    three failures a fragment causes, and names the check that proves it rendered.
    This is the root-cause half; without it every future mockup inherits D1.
  - `examples/trace-revamp/implementation-spec.md:3` — the "proven mockup"
    description said charset-first; it now describes the full shell.
  - `scripts/head-check.mjs` — **new**, the committed producer. Reads the four
    shell values off a real rendered document (mobile-emulated, because that is
    the only context where a missing viewport meta is observable), captures the
    375 and 1440 renders, records `scrollWidth`/`clientWidth` at six widths, exits
    1 on any shell failure.
  - `scripts/self-check.mjs` — added `head-check.mjs` to the script list, so the
    new producer cannot be deleted behind a green `npm run doctor`. Count moves
    12/12 → 13/13.

- **Re-proved in the rendered app:** `node scripts/head-check.mjs` → exit 0,
  `doctype html · CSS1Compat · lang en · viewport width=device-width ·
  mobileLayoutViewport 375px`. Receipt `promotion/evidence/head-check.json`,
  renders `promotion/evidence/mobile-375-emulated.png` (single column, readable
  body copy at phone size — I opened it and looked) and
  `promotion/evidence/desktop-1440.png`. The pre-fix pair is committed beside it
  as `*-before.*`, produced by the same script against the stashed tree.

- **Blast radius, measured rather than argued:** switching quirks → standards
  changes the box model document-wide, so the desktop composition was re-rendered
  rather than assumed intact. `desktop-1440-before.png` and `desktop-1440.png` are
  **byte-identical** (sha256 `1cf3603725d355519d2c9d555dcca518fd09060e466b6ce44e8a4f279afe440f`).
  All three honest RUN states were also re-captured post-fix through the repo's own
  `scripts/pixels.cjs` — A live, B fallback, C failed, plus dark and 375 — five
  shots, every one `mojibake:0 | consoleErrors:0 | hOverflow:false | asserts:ok`,
  exit 0. The red VALIDATION FAILED seal, its two real validation issues and the
  `Blocked — not signable` human line all still render. That run used a session-local
  config, reproduced here so it is not a dangling claim (`<SCRATCH>` and the
  `repo` path are the only machine-specific values):

  ```json
  { "repo": "<any checkout with node_modules/playwright>",
    "url": "file:///<clone>/examples/trace-revamp/mockup.html",
    "outDir": "<SCRATCH>/qa-shots", "viewport": { "width": 1440, "height": 900 },
    "assert": ["Countersigned"],
    "shots": [
      { "name": "postfix-desktop-light", "scheme": "light", "fullPage": true },
      { "name": "postfix-desktop-dark", "scheme": "dark", "fullPage": true },
      { "name": "postfix-state-B-fallback", "clicks": ["[data-trace=\"B\"]"], "waitMs": 500, "fullPage": true },
      { "name": "postfix-state-C-failed", "clicks": ["[data-trace=\"C\"]"], "waitMs": 500, "fullPage": true },
      { "name": "postfix-mobile-375", "viewport": { "width": 375, "height": 812 }, "fullPage": true }
    ] }
  ```

- **A Wave 1 hypothesis died here.** The D2 row asked Wave 2 to re-measure the
  320px overflow after adding the doctype, on the theory that quirks mode was its
  upstream cause. It is not. With the doctype added and no CSS touched, 320px
  `scrollWidth` is **360 — exactly what it was before**. D2 is independent and
  stays open. Recorded in the ledger rather than quietly dropped.

- **Regression check:** `node scripts/head-check.mjs` exits 1 if any of doctype,
  standards mode, `lang`, `width=device-width`, or a 375px mobile layout viewport
  regresses, naming which. **Confirmed failing on the pre-fix tree** — the final
  version of the script was run against `git stash push -- examples/trace-revamp/mockup.html`
  and exited 1 with all five failures, then the change was restored and it exited 0.
  A check that had passed before the fix would have been testing nothing.

- **Tests:** `npm run doctor` → exit 0, `PASS agentic-ui-qa self-check (13/13)`.
  `npm run proof` → exit 0, receipt written. `node scripts/pixels.cjs <cfg>` →
  exit 0, 5/5 shots clean. `npm test` and `npm run build` still exit 1
  (`Missing script`) — D3 is untouched and condition 11 stays FAIL.

- **Conditions newly PASS:** **3** (mobile and desktop both intentional). 4/12 → 5/12.
  Not 4: 320px still overflows. Not 2: D2, D3, D4, D5 remain open. Not 6: the
  `lang` half is now fixed but D4 (the silent `aria-live` region) still fails it.

### Iteration 2 — 2026-08-13 — the gate that guarded iteration 1 was decorative

- **Journey exercised:** J1 "Get this onto my machine and tell me it isn't already
  broken" — the quickstart, which is also this repo's only gate.

- **Observed (D6, major).** An adversarial verifier judged iteration 1
  VERIFIED_WITH_CAVEATS and named the caveat: D1 had no automated regression gate.
  Reproduced here on a fresh clone of `5134a04`, exactly as described. Delete the
  four-line document shell out of `examples/trace-revamp/mockup.html` — the whole
  iteration-1 fix — and the repository still says it is fine:

  ```
  npm run doctor  -> exit 0   PASS agentic-ui-qa self-check (13/13)
  npm run proof   -> exit 0   PASS agentic-ui-qa self-check (13/13)
  ```

  Two mechanisms both failed open. `scripts/self-check.mjs` listed
  `head-check.mjs` in its `scripts[]` array, but everything in that array gets
  `spawnSync(node, ["--check", file])` — a **syntax parse**. It proved the producer
  still parses, never that the surface still passes. And
  `.github/workflows/node-platform-conformance.yml` delegates wholly to NodeKit
  `repo check`, which (confirmed by reading `src/lib/repo-check.mjs:204`) asserts
  only that `nodekit.yaml`'s `proof.command` *references an existing npm script*.
  It never executes it. So CI has never once run this repo's declared proof.

- **Root cause — the same shape as D1, one level up.** Iteration 1 wrote a
  behavioral check and then registered it in the one place that cannot run
  behavior. `self-check.mjs` had exactly one idea of what a check is, "does this
  file parse", and adding a runnable check to that list silently downgraded it to
  a parse. The fix is not another entry in that array; it is giving the file a
  second, honest kind of check.

  The same one-copy-short mistake showed up in the docs half. Iteration 1 fixed
  `REVAMP.md` step 4 and stopped. `REVAMP.md:165`, under **"Non-negotiables at
  every tier"**, still read *"charset first line"* — the same directive, scoped
  more broadly than the one that was fixed. An agent working the non-negotiables
  checklist would have authored a fragment and been right to.

- **Fixed:**
  - `scripts/self-check.mjs` — **runs** `head-check.mjs` against the demo surface
    and folds its exit code in as a `shell:` check, alongside (not instead of) the
    syntax family. Artifacts are directed at the gitignored `.nodekit/`, so a
    doctor run never rewrites the committed evidence. 13/13 → 15/15.
  - `scripts/head-check.mjs` — a browserless **source mode**. It was
    `FATAL: playwright not found → exit 1`, which would have made a zero-dependency
    CI permanently red. Now: `mode: "rendered"` when Playwright resolves (unchanged
    behaviour, all five assertions), `mode: "source"` when it does not — the three
    facts a document *declares* are read from its own head and still gate the exit
    code, while `compatMode` and `mobileLayoutViewport` are recorded `null`, never
    guessed, so a source receipt cannot be misread as rendered proof. A remote URL
    with no browser stays a hard error, verified against a local server on :4402.
  - `.github/workflows/node-platform-conformance.yml` — a `proof` job that actually
    runs `npm run proof`. Without it, "wired into the gate CI runs" would still have
    been false however good self-check got.
  - `REVAMP.md:165` — the third copy of the directive, now the full four-line shell
    with the check that gates it.
  - `examples/trace-revamp/implementation-spec.md:3` (**D7**, minor) — "Proven
    mockup: `trace-tab-merged.html`" named a file that does not exist in that
    directory. Now `mockup.html`.
  - `scripts/shell-regression-proof.mjs` — **new**, the committed producer for the
    claim this iteration is actually making.

- **Re-proved — the gate goes red, which is the whole point.**
  `node scripts/shell-regression-proof.mjs` deletes the shell, runs the declared
  proof, restores the file, runs it again, and demands opposite outcomes:

  ```
  without shell -> exit 1   FAIL shell:examples/trace-revamp/mockup.html
  with shell    -> exit 0   PASS agentic-ui-qa self-check (15/15)
  ```

  Receipt: `promotion/evidence/shell-regression-proof.json`. Run in both modes:
  source mode names 3 failures (doctype, lang, viewport), rendered mode names 4
  including `mobile layout viewport 981px at a 375px device`. Neither passes.

  **Confirmed failing on the pre-fix tree**, directly rather than by argument. The
  final version of the check was dropped into a checkout of `5134a04` — iteration 1,
  with nothing else from iteration 2 — and run there:

  ```
  git checkout 5134a04 && cp <this-tree>/scripts/shell-regression-proof.mjs scripts/
  node scripts/shell-regression-proof.mjs
    without shell -> exit 0   PASS agentic-ui-qa self-check (13/13)
    with shell    -> exit 0   PASS agentic-ui-qa self-check (13/13)
    FAIL shell-regression-proof — the gate does not go red when the document shell
    is deleted.                                                          exit 1
  ```

  That receipt is committed beside the passing one as
  `promotion/evidence/shell-regression-proof-before.json`, `"passed": false`. The
  check fails on the tree it is meant to indict and passes on the tree that fixed
  it; a check that had been green on both would have been guarding nothing.

- **Deliberately not changed, and why.** `ci/qa-gate.yml` and `scripts/qa-gate.mjs`
  also carry no head-check reference. They are the **consumer** gate — the workflow
  a target app copies into its own repo — and they judge a live deployed URL, not a
  file. Wiring head-check there means a new config knob, a Playwright requirement in
  every consumer's CI, and a new blocking check that would turn existing consumers'
  gates red on adoption. That is a redesign of the consumer gate, not this defect.
  The defect reproduced above was in *this* repo's own gate, and that is what was
  fixed. Recorded here rather than silently skipped; it is the correct next target
  if the shell is to be enforced for consumers too.

- **Blast radius, measured rather than argued:** `head-check.mjs` was restructured,
  so its rendered output was re-generated rather than assumed intact.
  `promotion/evidence/mobile-375-emulated.png` and `desktop-1440.png` came back
  **byte-identical** to the ones iteration 1 committed (sha256 `0ddb46c8…` and
  `1cf36037…`). The only change to `head-check.json` is the new `mode` field. No
  CSS, HTML, or rendered surface was touched this pass, so J2 was not re-driven —
  the identical renders are the evidence for that, not an assumption.

- **Tests:** `npm run doctor` → exit 0 `PASS (15/15)` with no Playwright resolvable
  (what CI does) and again with `PLAYWRIGHT_REPO` set (`mode: "rendered"`).
  `npm run proof` → exit 0, receipt written, `checks.length` 15.
  `node scripts/shell-regression-proof.mjs` → exit 0, both modes.
  `node scripts/head-check.mjs` → exit 0 rendered, exit 0 source, exit 1 on a
  remote URL with no browser. `npm test` and `npm run build` still exit 1
  (`Missing script`) — D3 is narrowed, not closed, and condition 11 stays FAIL.

- **Conditions newly PASS: none. Still 5/12.** This iteration fixed a defect in the
  gate, not on the surface the gate scores, and no condition may move without
  evidence. What it changes is the standing of the conditions already claimed:
  condition 3's PASS was, until now, guarded by nothing. Condition 11 stays FAIL
  and its wording is updated — `npm test` and `npm run build` still do not exist,
  and D3's substance survives: `npm run proof` now exercises exactly one script's
  real behaviour (`head-check.mjs`, via the demo surface). That
  `live-signal.mjs` exits 1 on a missing signal, that `qa-gate.mjs` exits 2 with no
  prior state, and that `qa-memory.mjs` fingerprints dedupe are still things a human
  has to check by hand, as the baseline did. D3 narrows; it does not close.

### Iteration 3 — 2026-08-13 — the two conditions nobody had ever measured

- **Journey exercised:** J2 "Show me what an honest agent-trace screen looks like
  before I redesign mine" — the only journey that renders in a browser, and the
  surface conditions 7 and 8 are about.

- **Why this iteration exists.** Conditions 7 and 8 had been UNVERIFIED since the
  baseline, with the reason "those authorities are not installed in this
  environment". That reason was wrong, and it is worth naming the mistake rather
  than the fix: both authorities install from npm on demand. Nothing needed
  vendoring, nothing needed a licence, and neither condition was ever blocked by
  the environment — they were blocked by nobody having typed the command.

      npx --yes lighthouse@13.4.1 <url> --output=json --output-path=<f> --chrome-flags="--headless"
      npx --yes @axe-core/cli@4.13.0 <url> --save <f>

  Both are now wrapped in a committed producer, so the next wave types
  `npm run audit:web` instead of rediscovering the incantation.

- **The two are not interchangeable, and this is the trap the whole iteration was
  built to avoid.** A Lighthouse accessibility score is axe-core run over a
  smaller rule subset in a throttled mobile emulation. The Web Interface
  Guidelines are a different and much larger list, most of which no tool checks:
  whether async updates are announced, whether `<button>` was reached for before
  `role="button"`, whether the browser chrome follows the page into dark mode.
  **Recording a Lighthouse number against condition 7 would satisfy the row and
  measure nothing it asks about.** So conditions 7 and 8 have separate producers
  writing separate receipts, and `wig-review.mjs` says so in its own header.

- **Condition 8 — `scripts/web-quality-audit.mjs`, new.** Serves the demo surface
  on 127.0.0.1:4913 (Lighthouse refuses a `file://` URL and axe's driver will not
  navigate one), runs both tools, and writes `lighthouse.json`, `axe.json` and a
  summary receipt. Result on the fixed tree: Lighthouse 13.4.1 performance
  **1.00**, accessibility **1.00**, best-practices **1.00**, SEO 0.91; **LCP
  1358ms, CLS 0, TBT 0ms, FCP 1071ms**; axe-core 4.13.0 **0 violations**, 30
  passes, 1 incomplete. Exit 0.

  Two things this producer had to learn the hard way, both recorded because both
  are the kind of bug that produces a confident wrong number:

  1. **The rig authored a defect and then reported it.** The first version sent
     `cache-control: no-store` out of habit, and Lighthouse correctly failed the
     page on `bf-cache` — "Page prevented back/forward cache restoration". The
     finding was real and the fault was the harness's. `scripts/lib/serve.mjs`
     now sends content-type and nothing else, and `bf-cache` scores 1.
  2. **The rig deadlocked against its own server.** `spawnSync` blocks the event
     loop, including the Node HTTP server two lines above it that was serving the
     page under audit. Lighthouse requested the URL, Node could not answer while
     it waited for Lighthouse, and the run hung until timeout. Async `spawn`.

- **Condition 7 — `scripts/wig-review.mjs`, new.** A review, performed against
  https://vercel.com/design/guidelines as fetched on 2026-08-13, with the
  guideline's own title and section on every check and a DOM measurement behind
  every verdict. **28 checked, 20 pass, 2 fail (both minor), 5 requiring human
  eyes, 1 n/a, exit 0.** The five perceptual guidelines — optical alignment,
  deliberate alignment, easing that fits the subject, layered shadows, lockup
  contrast — are recorded `status: "eyes"` with the screenshots a reviewer must
  open. They are never auto-passed, because a script that silently marks them
  green is how a 28-row receipt starts lying.

  On the pre-fix tree the same review is **12 pass, 10 fail, 5 major, exit 1**
  (`promotion/evidence/before/wig-review.json`). The five majors it found:

  | Guideline | Measurement before | After |
  |---|---|---|
  | Interactions/"Announce async updates" | `#srLive` reads `""` after activating RUN B | reads the full trace status |
  | Layout/"Responsive coverage" | 320px `scrollWidth` 360 vs `clientWidth` 320 | clean at all six widths |
  | Layout/"No excessive scrollbars" | same measurement | clean |
  | Content/"All states designed" | no loading and no empty state exist in the DOM | five states, each captured |
  | Design/"Minimum contrast" | 20 text nodes below the WCAG AA floor, **light theme** | 0, both themes |

- **The finding that mattered most was one no tool reported.** The axe CLI
  rendered this page with `prefers-color-scheme: dark` — that is readable
  straight off its own receipt, where every passing node reports a backdrop like
  `#111315`. Its clean contrast result is therefore a statement about the **dark**
  theme. The light theme had been measured by nobody, and it held **20 nodes
  below the WCAG AA floor** while every automated tool was green. Two ink tokens
  account for all twenty:

  - `--ap-faint` at lightness 0.55 gives 3.98–4.48:1 on the light surfaces — a
    family of near-misses, none of them visible to the eye as a defect. 0.50.
  - `--ap-human` is the **marker** ink; `--ap-human-strong` is the **text** ink,
    and it is the one that flips per theme (0.553 light, 0.775 dark) precisely so
    that it can be read in both. Four text usages had reached for the marker,
    measuring 2.75–2.81:1. Swapped, and `--ap-human-strong` nudged 0.553 → 0.530
    so it also clears the floor as badge ink on `--ap-human-soft`.

  **A green tool is a green tool in the mode it happened to render.** That belongs
  in this repo's own protocol, not just in this log.

- **The check that measured nothing, and how it was caught.** The contrast
  resolver's first version reported "0 nodes below floor" — and had scored
  **zero** nodes. This page is authored in oklch, and neither `getComputedStyle`
  nor canvas `fillStyle` converts: both hand back `oklch(0.21 0.034 264.665)`
  verbatim. An rgb-only parse rejected every element, the loop `continue`d on all
  of them, and the empty result serialised as a clean pass. It was caught by
  reading the receipt rather than the exit code: `worstNode.ratio` was `null`,
  which is what `Infinity` becomes in JSON, and an untouched sentinel is a
  measurement that never happened. Colours are now resolved by **painting one
  pixel and reading it back**, `textNodesScored` is in the receipt, and the check
  fails when it scores nothing.

  Two more corrections in the same file, both false positives that would have
  shipped findings that are not real:

  - `transition-property` computes to `all` on **every** element including
    `<head>` and `<meta>`, because that is its initial value. The check reported
    206 violations on a page with none. It now also requires a non-zero duration.
  - A `border-radius: 50%` dot inside a 5px chip is the intended shape, not a
    nested-radius violation; comparing `50%` to `5px` with `parseFloat` said
    otherwise. Percentage radii are excluded.

- **The resolver is checked against the authority, not trusted.** On the same
  tree, six nodes axe scored itself agree with this resolver to within **0.04**:
  axe 5.39 / 6.76 / 9.96 / 6.22 / 6.01 / 6.16 against 5.39 / 6.73 / 9.97 / 6.26 /
  6.01 / 6.20 (`promotion/evidence/before/wig-review.json` beside
  `before/axe.json`). No expected value is hard-coded in the script — a number
  frozen in a check is the stale measurement this repo keeps catching in its own
  reports; the receipt names where to read axe's side instead.

- **Fixed, all in `examples/trace-revamp/mockup.html` unless noted:**
  - `.stage` grid track `1fr` → `minmax(0,1fr)` — **D2**, the 320px overflow.
    One clamp, and the desktop rule had already written it.
  - `render()` now announces into `#srLive` — **D4**. One funnel, all controls.
  - `D · running` and `E · empty` added to the RUN switch, with `.skelrow` /
    `.emptystate` styles — **D5**. Selectable, not timed, so they can be captured.
  - `<div class="frame-note">` → `<main>` — closes axe `landmark-one-main` and
    `region` in one edit, because both were the same absence.
  - `role="group"` on `.insp-tabs` — `aria-label` is prohibited on an implicit
    generic role, so the label was being dropped. This is axe's
    `aria-prohibited-attr` incomplete, and it is why that incomplete is gone.
  - `min-height:24px` on the segmented controls — they measured 21–23px tall.
  - `color-scheme` on `:root` and both theme blocks; `<meta name="theme-color">`
    for light and dark; `<meta name="description">`.
  - `--ap-faint` and `--ap-human-strong` retuned, four `--ap-human` text usages
    swapped — the contrast family above.
  - `package.json` — `audit:wig` and `audit:web` targets.

- **Blast radius, measured rather than argued.** Colour tokens were changed, so
  every state was re-rendered and opened rather than assumed intact: A, B, C, D
  and E at 1440 plus the dark composition, all committed. The red VALIDATION
  FAILED seal still lists its two real validation issues and still reads
  `blocked — not signable`; the dashed-amber provisional stamp still reports
  `$0.000 · no tokens billed` and invents no hash. `npm test` → 32 pass,
  `npm run doctor` → 21/21, `node scripts/head-check.mjs --evidence` → exit 0
  rendered, `node scripts/shell-regression-proof.mjs` unchanged.

- **Deliberately not done, and why.** No `build` script was added. Condition 11
  asks for tests and build green; tests are green and there is no build stage in
  a zero-dependency package. Adding a no-op `build` to turn the row green is
  inventing a command that does nothing so a gate reports success, which is the
  precise failure this gate exists to catch. The row stays FAIL and says which
  half is which.

- **Tests:** `npm test` → **32 pass, 0 fail, exit 0**. `npm run doctor` → exit 0,
  `PASS agentic-ui-qa self-check (21/21)`. `npm run build` → exit 1,
  `Missing script: "build"`. `node scripts/wig-review.mjs --evidence` → exit 0.
  `node scripts/web-quality-audit.mjs --evidence` → exit 0. Both → exit 1 on the
  stashed pre-fix surface, receipts under `promotion/evidence/before/`.

- **Conditions newly PASS: 2, 4, 5, 6, 7, 8.** 5/12 → **11/12**. Conditions 9 and
  10 were already PASS and did not move, but both stopped resting on session-local
  temp files: 9 now cites `wig-review.json` (`consoleErrors: []`,
  `failedRequests: []` across 4 page loads) and 10 cites `lighthouse.json`
  (TBT 0ms, CLS 0, performance 1.00). Condition 11 stays FAIL on the build half.

## Open ledger after iteration 3

| # | Severity | Journey | Reproduction | Status |
|---|----------|---------|--------------|--------|
| D8 | minor | J2 | No skip link. `wig-review.json` → Content/"Headings & skip link": `hasSkipLink false`, `headingLevelSkips 0`. Minor on a single-view surface with 15 tab stops and no repeated navigation to skip past; it becomes real the moment this composition gains a second view. | open |
| D9 | minor | J2 | The six rail nodes are `div[role="button"][tabindex="0"]`, not `<button>` — WIG Content/"Semantics before ARIA". `wig-review.json` → `roleButtonOnNonButtonElements: 6`. Not fixed deliberately: each node is a two-column grid whose rail segments position against its own box, so a native button needs a full UA-style reset before the layout returns to where it started. The ARIA pattern is complete and measured — Enter and Space both activate, `aria-expanded` tracks — so this is standing debt, not a broken control. | open |
| D10 | minor | J2 | Nine controls are under the guideline's 44px **mobile** hit-target floor (they clear the 24px base floor). `wig-review.json` → Interactions/"Match visual & hit targets", `underMobileFloor`. Raising the segmented controls to 44px re-proportions the whole control bar, which is a redesign rather than a defect closure. | open |
| D11 | minor | J1 | `npm run build` exits 1, `Missing script: "build"` — the only half of condition 11 still open. Recorded as a defect rather than left in the scorecard alone, so the next wave decides it deliberately: add a real build stage, or have the gate record "no build stage" explicitly. Do not add a no-op. | open |
