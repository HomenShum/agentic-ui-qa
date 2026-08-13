# Architecture

## The shape

There is no application. There is a protocol an agent reads, a set of small programs
it runs, an append-only file it writes, and a gate that reads that file and decides.

    a person: "QA my app"
          |
          v
    AGENTS.md ──> SKILL.md ──> profiles/<app>.md          (read: what to do, and to what)
          |
          v
    scripts/qa-memory.mjs regressions                     (first executable step: remember)
          |
          v
    the journeys ── live-signal ─┐
                 ├─ head-check   │  each one: measure, write a receipt, exit 0 or 1
                 ├─ pixels       ├──> lib/browser.mjs ──> a borrowed Playwright
                 ├─ prettify     │
                 └─ clutter     ─┘
          |
          v
    scripts/qa-memory.mjs add-finding / add-run           (write: .qa/memory/*.jsonl
          |                                                in the APP's repo, not here)
          v
    scripts/qa-gate.mjs  ──> lib/ledger.mjs               (decide: exit 0 / 1 / 2 / 3)
          |
          v
    gate-state.json, read later by `qa-gate.mjs --check`

## The four rules everything else follows from

**1. No artifact, no claim.** A check may only report what it observed. This is
enforced by argument validation, not convention: `live-signal.mjs` refuses an absence
assertion that has no positive witness that the page is alive, because a blank page
makes every absence true. See `scripts/live-signal.mjs` line 91.

**2. Fail closed.** Every ambiguous state exits non-zero. `qa-gate.mjs` publishes a
four-value exit contract in its header — 0 passed, 1 blocked, 2 nothing to check, 3
internal error — and *nothing to check is never a pass* (`scripts/qa-gate.mjs` line
280). A missing config, an unparseable config, an empty ledger, and a crash inside the
gate itself all refuse.

**3. A measurement records how it was taken.** `head-check.mjs` runs in one of two
modes and writes which. In `source` mode the two facts only a browser can derive are
recorded as `null` — never guessed — so a receipt from a machine with no browser
cannot be mistaken for rendered proof (`scripts/head-check.mjs` lines 129 and 138).

**4. Deterministic checks decide; a model only explains.** `qa-gate.mjs` never calls a
model. It runs child processes, reads a file, and compares numbers. A loop that scores
itself can always decide it is finished, so the verdict is taken out of process.

## The two boundaries worth knowing

**The browser boundary** — `scripts/lib/browser.mjs`. Everything that needs a real
browser goes through one function. This package installs nothing, so the browser is
borrowed from another checkout on the same machine; four callers treat "not found" as
fatal, and `head-check.mjs` alone asks for `required: false` because it has a weaker
mode to fall back to.

**The state boundary** — `scripts/lib/ledger.mjs`. The ledger is two append-only JSONL
files. Nothing is ever edited or deleted; the state of a defect is its last line. Both
readers — the human view and the gate — reduce it through this one module, because
when they each had their own copy they disagreed about a half-written line and the gate
printed PASSED over a finding it could not read.

## Where state lives, and where it deliberately does not

The ledger lives in **the application under test**, defaulting to
`<app-repo>/.qa/memory/`, never in this clone. Two reasons: a team's QA history stays
as private as their code, and any agent can resume the loop cold by reading git rather
than by remembering anything.

The only state this repository keeps about itself is `promotion/` — its own scorecard
and defect log, treated the same way: append-only, dated, not rewritten.

## What is intentionally missing

No database, no server, no queue, no dependency-injection container, no plugin system,
no configuration file for values that never change. Adding any of them would be adding
a moving part to a package whose whole value proposition is that it clones into someone
else's repository and runs.
