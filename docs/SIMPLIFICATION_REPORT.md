# Simplification report

Baseline commit `7839a37`. Every row was produced by running the command beside it,
before the change and again after. Where a tool does not fit a repository that ships
zero dependencies and builds nothing, the row says so rather than sitting blank.

## Measurements

| Measure | Before | After | Change | Evidence command |
|---|---:|---:|---:|---|
| Production files | 9 | 11 | +2 | `ls scripts/*.mjs scripts/*.cjs scripts/lib/*.mjs \| wc -l` |
| Production source lines | 2428 | 2449 | +21 | `cat scripts/*.mjs scripts/*.cjs scripts/lib/*.mjs \| wc -l` |
| Production source lines, comments and blanks removed | 1928 | 1875 | **−53** | `cat scripts/*.mjs scripts/*.cjs scripts/lib/*.mjs \| sed -e 's://.*::' -e '/^\s*\*/d' -e '/^\s*\/\*/d' -e '/^\s*$/d' \| wc -l` |
| Direct dependencies | 0 | 0 | 0 | `node -e "const p=require('./package.json');console.log(Object.keys(p.dependencies\|\|{}).length+Object.keys(p.devDependencies\|\|{}).length)"` |
| Unused files | 8 | 0 | **−8** | `npx knip --no-exit-code` |
| Unused exports | 0 | 0 | 0 | `npx knip --no-exit-code` |
| Duplicate blocks | 3 | **0** | −3 | `npx jscpd scripts --min-lines 5 --min-tokens 50` |
| Duplicate percentage | 1.61% | **0.00%** | −1.61pp | same command |
| Circular dependencies | 0 (16 modules) | 0 (18 modules) | 0 | `npx dependency-cruiser --no-config --output-type err scripts` |
| Canonical workflow tests | 0 — `npm test` was `Missing script: "test"` | **31 passing** | +31 | `npm test` |
| Declared-proof checks | 15 | 18 | +3 | `npm run doctor` |
| Browser workflow passes | never run in CI or a suite | 5 of 5 browser scripts driven against a live page | +5 | see *Browser verification* below |
| Production bundle size | not applicable — no build step, no bundler; the package is Markdown plus Node scripts executed from source | | | `npm run build` → `Missing script: "build"` |
| Additions / deletions | — | 11 tracked files changed, 99 insertions(+), **163 deletions(−)**; 18 new files (2 shared modules, 4 test files, 9 documents, 3 tours) | | `git diff --shortstat` |

Two rows deserve a sentence rather than a number.

**Production source lines went up by 21 while duplicate blocks went to zero.** That is
the intended trade and it is why the third row exists. Executable code fell by 53
lines; the two new shared modules spend their length on docblocks explaining *why*
they exist, which is the humanization half of this pass. Compressing those comments
would improve the second row and make the repository worse.

**Unused files 8 → 0 is a measurement fix, not a deletion.** knip previously saw only
`self-check.mjs` as reachable — the other eight scripts are command-line entry points
an agent invokes by path, and nothing imports them, so knip called every one of them
dead. A `knip` block in `package.json` now declares the entry points, and the tool
reports what is actually unreferenced. No file was deleted on the strength of that
finding, because none of them was really unused.

## What was deleted

| Deleted | Was in | Replaced by |
|---|---|---|
| Five copies of the Playwright resolver (~85 lines) | `pixels.cjs`, `head-check.mjs`, `prettify-audit.mjs`, `live-signal.mjs`, `clutter-audit.mjs` | one `resolvePlaywright` in `scripts/lib/browser.mjs` |
| Two copies of the ledger reader and its "latest line wins" reducer | `qa-memory.mjs`, `qa-gate.mjs` (whose copy carried the comment *"same reducer as qa-memory.mjs"*) | `scripts/lib/ledger.mjs` |
| A second copy of the element-visibility rule, inlined in a `waitForFunction` | `live-signal.mjs` | the existing `countVisible`, polled |
| Two copies of the URL-redacting error formatter | `clutter-audit.mjs`, `live-signal.mjs` | `safeErrorMessage` in `scripts/lib/browser.mjs` |
| A hand-maintained list of eight script paths | `self-check.mjs` | `readdirSync` over `scripts/` and `scripts/lib/` |
| Two pointless `async` markers on a synchronous function | `prettify-audit.mjs`, `clutter-audit.mjs` | — |

Concepts removed: **five** implementations of "find a browser" become one, **two**
implementations of "what is the current state of this defect" become one, and a
directory listing replaces a list a human had to remember to edit — it had already
fallen behind, since `scripts/lib/` existed and was checked by nothing.

## Custom code replaced by an existing capability

| Custom code | Existing capability that replaced it |
|---|---|
| No test runner at all; `npm test` failed with `Missing script` | Node's built-in `node --test` (Node ≥ 20). No test framework was added, and the zero-dependency promise survives. |
| A hand-maintained script inventory in `self-check.mjs` | `fs.readdirSync` |
| Duplicate `require('playwright')` searches in five files | one module, using `node:module`'s `createRequire` |

The ladder was applied before writing anything and stopped early most of the time.
Three things it explicitly refused to add: a test framework (Node ships one), a
documentation site (Markdown and CodeTour are enough), and a shared argument parser
(see below).

## The one behavior that changed, and why it is a fix not a regression

Everything else in this pass preserves observable behavior. This does not, and the
justification is a measurement taken before the change.

A ledger line that will not parse is the ordinary result of an append that was
interrupted — the file is JSONL, appended to by whatever agent ran last. The two
readers disagreed about such a line. Reproduced on the baseline tree, with a ledger
whose last line is a truncated open P0:

    qa-gate.mjs   → VERDICT: PASSED  ->  exit 0     (line silently dropped)
    qa-memory.mjs → SyntaxError stack trace, exit 1  (unhandled crash)

`qa-gate.mjs`'s own header promises *"fail-closed; never silently allows"*. It was
allowing. Both now read through `scripts/lib/ledger.mjs`, which returns damaged lines
instead of dropping them; the viewer names the line number, the gate raises a P0 block.
Pinned by `test/ledger.test.mjs` line 129, which was written first and failed on the
old code.

## Browser verification

Five scripts drive a real browser and none of them was covered by a suite, so each was
run by hand against this repo's own demo surface served on `http://localhost:4513/`,
with Playwright resolved from an unrelated checkout — the exact borrowing arrangement
`lib/browser.mjs` exists to support.

| Script | Result |
|---|---|
| `head-check.mjs --repo <dir>` | exit 0, `mode: "rendered"`; both regenerated PNGs **byte-identical** to the committed evidence (`0ddb46c8…`, `1cf36037…`), proving the shared resolver did not disturb rendering |
| `pixels.cjs <config>` | exit 0, PNG written, `mojibake:0 consoleErrors:0 asserts:ok` |
| `prettify-audit.mjs <config>` | exit 0, `MEASURED SUBTOTAL: 10/16 (63%)` — the same score the scorecard records |
| `clutter-audit.mjs <config>` | exit 0, protected selector 1/1, charset UTF-8 |
| `live-signal.mjs` | three scenarios: true absence → 0; false absence claim → 1; missing readiness witness → 1 (no vacuous pass) |
| `qa-gate.mjs` end to end | spawned all three sub-checks; blocked on a failed live signal (exit 1), passed on a satisfied one (exit 0), and `--check` read the stored verdict back |
| `shell-regression-proof.mjs` | exit 0 — deleting the demo surface's document shell still turns the declared proof red |

## Findings left unresolved

| Finding | Why it was left |
|---|---|
| knip reports one **unlisted dependency**: `playwright` at `scripts/lib/browser.mjs:52` | True in form, intentional in substance — the package deliberately declares no dependencies and borrows Playwright from another checkout. Left visible rather than silenced with `ignoreDependencies`, because a configured-away finding is invisible to the next reader and this one is explained here and in the module's docblock. It is newly *visible*, not newly *created*: the same `require('playwright')` existed five times before, in files knip never analyzed. |
| Four hand-rolled `--flag value` scanners remain (`head-check.mjs`, `qa-memory.mjs`, `self-check.mjs`, `shell-regression-proof.mjs`) | Each is about three lines. Replacing them with `node:util.parseArgs` or a shared helper trades three lines of obvious code for an option schema plus an import, in four files. That is the low-value compression the stop rule names. `live-signal.mjs` keeps its own richer parser because it does range validation and repeatable flags that a trivial helper cannot express. |
| Two URL-redaction helpers remain: `safeUrlLabel` (`live-signal.mjs`) and `safeUrl` (`clutter-audit.mjs`) | They return different shapes for different receipts and one carries a raw-path opt-in. Merging them needs a switch to select the shape, which adds a config knob to remove a duplicate — the wrong direction. |
| `npm run proof` still does not run `npm test` | The declared proof is the promotion loop's gate, and changing what it asserts is that loop's decision, not a structural one. The suite is wired into CI instead: the `proof` job now runs `npm test` before `npm run proof`, so a regression turns a check red. |
| The demo surface still overflows horizontally at 320px, and its `aria-live` region still says nothing when the trace switches | Open defects D2 and D6-adjacent in `promotion/PROMOTION_LOG.md`. They are product defects on the demo surface, not codebase structure; fixing them here would mix feature work into a structural pass. |
| The declared-proof count moved 15 → 18 | `self-check.mjs` now discovers scripts instead of listing them, so it also checks `scripts/lib/`. The dated scorecard in `promotion/PRODUCT_GOAL.md` still quotes 15/15, which was true when it was written; it is an append-only historical record and was not rewritten. |

## Reproducing this report

    git clone https://github.com/HomenShum/agentic-ui-qa && cd agentic-ui-qa
    npm test && npm run doctor
    npx knip --no-exit-code
    npx jscpd scripts --min-lines 5 --min-tokens 50
    npx dependency-cruiser --no-config --output-type err scripts

No install step. The three `npx` tools download on demand and are not dependencies of
this package.
