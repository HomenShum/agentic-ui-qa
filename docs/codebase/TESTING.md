# Testing

    npm test        # 31 tests, node --test, no install step
    npm run doctor  # this repo's own self-check, 18/18

## What is tested, and what is deliberately not

The suite covers the three things that decide outcomes: the ledger's reduction rule,
the gate's exit contract, and the input validation that stops a claim being made
dishonestly. It does **not** test the browser-driving scripts' rendering behaviour,
because a machine running the suite may have no browser at all — those are verified by
hand against a live page and the run is recorded in
[`docs/SIMPLIFICATION_REPORT.md`](../SIMPLIFICATION_REPORT.md).

| File | Covers |
|---|---|
| `test/ledger.test.mjs` | fingerprint stability, the open/fixed/regressed lifecycle, the permanent re-verify sweep, and the whole `qa-gate.mjs` exit contract |
| `test/surface.test.mjs` | `head-check.mjs` in source mode, `live-signal.mjs` argument validation, and `self-check.mjs` |
| `test/tours.test.mjs` | that every `.tours/` step resolves to a real file and a real, non-blank line, and that `docs/START_HERE.md` cites files that exist |
| `test/helpers.mjs` | not a test — spawns scripts as child processes and hands out throwaway workspaces |

`tours.test.mjs` is there because documentation rots silently. A tour step that lands
on the wrong line after somebody inserts a function above it teaches a newcomer
something false, and nothing else would notice.

## Nothing is mocked, and that is the point

Every test spawns the real script as a child process and asserts on its real exit code
and the output a person would actually see:

```js
const gate = run('qa-gate.mjs', [gateConfig(dir, memory)]);
assert.notEqual(gate.code, 0, 'a gate that cannot read its own ledger must not report PASSED');
```

A test that stubbed the ledger reader would have agreed with both of the broken copies
this pass deleted. Each test builds its own temporary directory and deletes it on exit,
so tests can run in any order and none of them touches the repository.

Two tests force `PLAYWRIGHT_REPO` at a path that does not exist, so `head-check.mjs`
takes its source-mode branch regardless of what happens to be installed on the machine.
Without that, the suite would assert different things on different developers' laptops.

## Writing a new test

Name it after the behaviour a person cares about, not the function:

    test('proving something is absent requires proving the page is alive', …)

not `test('parseArgs rejects renderedAbsent without renderedPresent')`. The first
survives a refactor and explains itself in a CI log; the second does neither.

Use the helpers:

```js
import { run, workspace, writeLedger, gateConfig } from './helpers.mjs';
const dir = workspace('my-scenario');
const memory = writeLedger(dir, [ /* raw JSONL lines, malformed ones welcome */ ]);
```

`writeLedger` takes raw strings rather than objects specifically so a test can write a
half-written line, which is the failure mode that matters.

## The other three proofs

**`npm run doctor` / `npm run proof`** — checks that the required documents exist, that
every file in `scripts/` and `scripts/lib/` parses, and that the demo surface still has
a document shell. `proof` also writes a receipt to `.nodekit/`. The script list is read
from the directory, so a new script is covered the moment it is added.

**`node scripts/shell-regression-proof.mjs`** — asks whether the gate has teeth. It
deletes the document shell out of the demo page, runs the declared proof, expects
non-zero, restores the file, and runs it again expecting zero. It refuses to start if
that file has uncommitted changes, because it edits your working tree. This exists
because the gate was once decorative: `self-check.mjs` only syntax-checked
`head-check.mjs`, so deleting the whole shell left `npm run doctor` green.

**CI** — the `proof` job in `.github/workflows/node-platform-conformance.yml` runs
`npm test` then `npm run proof` on every push and pull request.

## Before you refactor something with no test

Add the characterization test first, watch it pass against the *old* code, then change
the code. That order is what makes the test evidence rather than decoration — and it is
how the one behaviour change in this pass was justified: the corrupt-ledger test was
written first and failed on the baseline tree.
