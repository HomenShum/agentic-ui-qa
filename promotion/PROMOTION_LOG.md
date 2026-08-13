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
| D2 | major | J2 | Horizontal overflow at 320px. Load the mockup at viewport 320x900; `document.documentElement.scrollWidth` = **360** vs `clientWidth` = **320**. Clean at 375, 768, 1024, 1440, 1920. Measured by `node <SCRATCH>/kbd-check.mjs` (`overflow` map). ~~**Untested hypothesis for Wave 2:** quirks mode (D1a) changes the box model document-wide, so D1 may be the upstream cause of D2 — do not assume it; re-measure at 320px *after* adding the doctype before writing any width CSS.~~ **Hypothesis tested and FALSE (iteration 1).** Measured with only the doctype added and no CSS touched: 320px `scrollWidth` is **360 both before and after** — identical. `promotion/evidence/head-check-before.json` and `head-check.json` both record `overflow["320"] = {scrollWidth: 360, clientWidth: 320}`. Quirks mode was never the cause; D2 is an independent CSS width defect and still needs a width fix. Corroborating: `desktop-1440-before.png` and `desktop-1440.png` are byte-identical (sha256 `1cf36037…`), so the box-model switch changed no layout at all. | open |
| D3 | major | J1 | The package has zero behavioral tests. `npm test` → exit 1 `Missing script: "test"`. The declared proof, `npm run proof`, exits 0 with `12/12` but `scripts/self-check.mjs` only checks that 6 documents exist and runs `node --check` (syntax parse) on 6 scripts. Nothing asserts that `qa-gate.mjs` exits 2 on absent state, that `live-signal.mjs` exits 1 on a missing signal, or that `qa-memory.mjs` fingerprints dedupe — all three of which I had to verify by hand this pass. A green `proof` is compatible with every script being semantically broken. **Narrowed, not closed, in iteration 2:** `npm run proof` now runs `head-check.mjs` for real against the demo surface (13/13 → 15/15) and a green proof is no longer compatible with a broken document shell — see D6. The other three behaviours above are still hand-checked only. | open |
| D6 | major | J1 | **FIXED — iteration 2.** D1's fix had no automated regression gate, so the repository could lose it again silently. `scripts/self-check.mjs` listed `head-check.mjs` but only spawned `node --check` on it — a **syntax parse**, not a run — and `.github/workflows/node-platform-conformance.yml` delegated entirely to NodeKit `repo check`, which asserts only that `nodekit.yaml`'s `proof.command` *references* an existing npm script and never executes it. Decisive reproduction, run on a fresh clone of `5134a04`: delete the four-line document shell out of `examples/trace-revamp/mockup.html` → `npm run doctor` **exit 0 `PASS (13/13)`** and `npm run proof` **exit 0 `PASS (13/13)`**. The producer worked; nothing ran it. Fixed at the seam: self-check now *runs* head-check against the demo surface (13/13 → 15/15), head-check gained a browserless source mode so it can gate where no browser is installed, and CI gained a job that actually executes `npm run proof`. Re-proved: `promotion/evidence/shell-regression-proof.json` → same command, **exit 1** without the shell, exit 0 with it. | **closed** |
| D4 | minor | J2 | The screen-reader live region is declared but never announces the primary state change. `mockup.html:413` defines `<div id="srLive" aria-live="polite" role="status">`; the only write is at `:819`, for `'Digest copied to clipboard'`. Repro: focus `[data-trace="B"]`, press Enter — `aria-pressed` flips to `true`, the banner text changes to `Completed…deterministic fallback`, the footnote changes, and `document.getElementById('srLive').textContent` is still `""`. A screen-reader user is told nothing when the entire trace swaps, including when it swaps to the failed state. Same gap for the DEPTH and theme controls. | open |
| D5 | minor | J2 | No loading and no empty state exist anywhere in the demo surface — not styled poorly, absent. The repo's own auditor says so: `<SCRATCH>/qa-shots/prettify-audit.json` scores V8 "State polish (empty / loading / error)" as `n/a` with the note that empty+loading+error PNGs must be captured. Three of five states named by gate condition 5 are designed and captured; two are not. | open |
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
