# START HERE — one pass through this repo, in the order it runs

Read this before the architecture documents. It follows a single real run from the
sentence a person types to the exit code that decides whether they may deploy, one
step per stage, in the order the code actually executes.

## What this repository is, for someone who has never heard of it

Someone has built an application where a computer assistant does work on a person's
behalf — rewrites a slide, edits a document, sends a summary. Before strangers use
it, they want to know something their unit tests cannot tell them: **does the screen
tell the truth?** The failure they are guarding against is concrete and has happened:
the app printed a green "Done — updated!" after the assistant had actually timed out
and returned a canned answer, so the person walked away believing an edit had
happened that never did.

This repository is the procedure for finding that. It is not a test framework and it
has no server. It is a set of Markdown instructions plus eleven small Node programs,
executed by whatever coding agent the person already uses (Claude Code, Codex, Cursor,
and so on). The agent reads the instructions, drives the application as a series of
personas, and is forbidden from claiming anything it cannot show: every "this works"
must point at a picture taken during that session or a command that exited zero.

Two words appear constantly below and are worth fixing now:

- a **finding** is one defect the pass discovered, written down with a severity from
  P0 (blocks a deploy) to P2 (backlog);
- the **ledger** is the append-only file of findings and passes, kept in the
  application's own repository so its QA history stays as private as its code.

Run it yourself before reading further:

    git clone https://github.com/HomenShum/agentic-ui-qa
    cd agentic-ui-qa
    npm test        # behaviour tests, no install step — this package has no dependencies
    npm run doctor  # the repo's own self-check

---

## Step 1 — A person asks an agent to QA their app, and the agent reads one file

**File:** `AGENTS.md`
**Symbol:** the numbered list under `## Your instructions, in order` (line 7)
**Called by:** a human, in chat — "QA my app with agentic-ui-qa"
**Calls next:** `SKILL.md`, then `profiles/<app>.md`

**Why this exists**
There is no HTTP route and no `main()` here — the entry point is a file an agent is
told to read. `AGENTS.md` exists so the protocol is not tied to one vendor's skill
format: any agent that can read Markdown and run a shell command starts here and is
routed to the same protocol. (Hosts that support skill discovery read the YAML
frontmatter in `SKILL.md` instead and land in the same place.)

**Core code** — this is prose, not code, and that is the point:

```markdown
1. Read `SKILL.md` in this directory — it is the complete protocol. Follow it.
...
4. Open the app's QA memory per SKILL.md §9 (`scripts/qa-memory.mjs`, default
   `<app-repo>/.qa/memory/`): run the regression sweep FIRST
```

**Input** — a request naming an application to test.
**Output** — an agent that knows which protocol to follow and which app profile to
resolve. Nothing has been measured yet and nothing has been written.
**Failure behavior** — no profile exists for the app: the agent must fill
`profiles/TEMPLATE.md` by read-only scouting before interacting. Guessing is the
failure this prevents.
**Next** — the first thing the protocol makes it *execute* is Step 2.

## Step 2 — The first executable action is remembering the last pass

**File:** `scripts/qa-memory.mjs`
**Symbol:** `case 'regressions'` (line 99)
**Called by:** the agent, per `AGENTS.md` step 4; also by `qa-gate.mjs`
**Calls next:** `lib/ledger.mjs` → `readLedger`

**Why this exists**
A QA pass that starts from a blank sheet re-discovers last month's defects and
misses the ones that quietly came back. So before any new exploration, every defect
ever marked fixed at P0 or P1 is printed as a mandatory re-verify list. The list only
grows; nothing is ever removed from it.

**Core code**

```js
case 'regressions': {
  const everFixed = new Map();
  for (const f of readLines(FINDINGS)) if (f.status === 'fixed' && /^P[01]$/.test(String(f.sev))) everFixed.set(f.fp, f);
  for (const f of everFixed.values()) console.log(`${f.sev}\t${f.fp}\t${f.area}\t${f.symptom}\tREVERIFY(...)`);
```

**Input** — `--dir <memory-dir>`, defaulting to `./.qa/memory` in the app under test.
**Output** — one line per permanent regression check, on stdout.
**Failure behavior** — no ledger yet means an empty list, which is correct for a
first pass. A ledger line that will not parse is named on stderr and skipped, never
silently dropped (Step 8).
**Next** — the agent runs the journeys, whose first job is Step 3.

## Step 3 — A claim about the app is refused unless it can be proven

**File:** `scripts/live-signal.mjs`
**Symbol:** `parseArgs` (line 35)
**Called by:** the agent directly, and by `qa-gate.mjs` as its live check
**Calls next:** `checkRawPresence`, then `checkRendered`

**Why this exists**
This is the trust boundary of the whole protocol, and it is enforced by argument
validation rather than by asking nicely. "The control I removed is gone from
production" is the easiest claim in QA to fake: a blank page, or a page that crashed
before it mounted anything, makes every absence assertion true. So an absence claim
is rejected outright unless it arrives with a positive witness that the page is alive
and a named window of time to hold that witness for.

**Core code**

```js
if (options.renderedAbsent.length > 0 && options.renderedPresent.length === 0) {
  failUsage('--rendered-absent requires --rendered-present as a positive readiness witness');
}
if (options.renderedAbsent.length > 0 && options.stabilityMs === null) {
  failUsage('--rendered-absent requires --stability-ms sized to the owning surface\'s known mount bound');
}
```

**Input** — a URL plus assertions: bare strings are searched for in the raw HTTP
response; `--rendered-present` / `--rendered-absent` are CSS selectors checked in a
real browser.
**Output** — one `FOUND`/`MISSING`/`VISIBLE`/`STABLE_ABSENT` line per assertion, and
an exit code. URLs are hashed in the output so a committed QA report does not leak a
signed preview link.
**Failure behavior** — every validation failure exits 1 with the usage text. There is
no permissive mode; an assertion that cannot be made honestly is not made.
**Next** — the checks that need a browser have to find one, which is Step 4.

## Step 4 — Every check that needs a browser borrows one, in one place

**File:** `scripts/lib/browser.mjs`
**Symbol:** `resolvePlaywright` (line 35)
**Called by:** `live-signal.mjs`, `head-check.mjs`, `pixels.cjs`,
`prettify-audit.mjs`, `clutter-audit.mjs` — all five
**Calls next:** the resolved Playwright module

**Why this exists**
This package ships **zero dependencies** on purpose: it is cloned into other people's
repositories as a skill, and a skill that drags a browser download behind it will not
be cloned. So the five checks that need a real browser borrow a Playwright that is
already installed in some other checkout on the same machine. Until this file existed
that search was written out five times and had already drifted — two copies walked six
directories up and three walked seven, so a checkout six levels up was found by some
checks and not others.

**Core code**

```js
export function resolvePlaywright(hint, { required = true } = {}) {
  const roots = [];
  if (hint) roots.push(path.resolve(hint));
  let dir = process.cwd();
  for (let i = 0; i < 7; i += 1) { roots.push(dir); /* …walk up… */ }
  roots.push(skillRoot);
  for (const root of roots) {
    const candidate = path.join(root, 'node_modules', 'playwright');
    if (fs.existsSync(candidate)) return require(candidate);
  }
```

**Input** — a directory hint from `--repo`, a config's `"repo"` field, or
`$PLAYWRIGHT_REPO`.
**Output** — the Playwright module.
**Failure behavior** — nothing found and `required` is true (four of five callers):
exit 1 with a message naming the flag to set. `head-check.mjs` alone passes
`required: false`, because it has a weaker no-browser mode to fall back to — and that
mode is required to label itself (Step 5).
**Next** — the first check to use it, `head-check.mjs`.

## Step 5 — A measurement records how it was taken, so a weak proof cannot pose as a strong one

**File:** `scripts/head-check.mjs`
**Symbol:** module top level, `record.mode` (line 137) and `failures` (line 146)
**Called by:** the agent, and by `self-check.mjs` as this repo's own gate
**Calls next:** writes a JSON receipt beside two PNGs

**Why this exists**
This check asks whether a page declares a proper document shell — a doctype, a
language, a mobile viewport tag — and whether it holds up at every supported width.
Three of those facts a file *declares* and can be read from its source. Two of them
only a browser *derives*. On a machine with no browser the derived facts are recorded
as `null` and never guessed, so a receipt from the weaker mode can never be read as
rendered proof.

**Core code**

```js
if (!s.doctype) failures.push('doctype absent — document renders in quirks mode');
if (s.compatMode !== null && s.compatMode !== 'CSS1Compat') failures.push(`compatMode ${s.compatMode} (want CSS1Compat)`);
if (!s.lang) failures.push('<html lang> absent — WCAG 3.1.1 Level A');
```

Read the `s.compatMode !== null` guard twice: `null` means *this mode did not measure
it*, never *it passed*.

**Input** — a URL (defaults to this repo's own demo page), optional `--repo`,
`--out`, `--png-mobile`, `--png-desktop`.
**Output** — a receipt whose `mode` field is `"rendered"` or `"source"`, plus two
screenshots in rendered mode.
**Failure behavior** — exit 1 naming each failed assertion. A *remote* URL with no
browser is a hard error rather than a downgrade, because there is no file to read.
**Next** — what the pass found has to be written down: Step 6.

## Step 6 — A finding is appended, and the same defect twice is still one defect

**File:** `scripts/qa-memory.mjs`
**Symbol:** `case 'add-finding'` (line 78), fingerprint at `fpOf` (line 51)
**Called by:** the agent at the end of a pass
**Calls next:** appends one line to `findings.jsonl`

**Why this exists**
This is the only place the protocol writes durable state. It is append-only: fixing a
defect does not edit its line, it appends a new line for the same defect with status
`fixed`. The state of a defect is simply its last line. Findings are fingerprinted
from the area and the symptom with digits, paths and ids stripped, so the same defect
found again next month — at a different line number, in a different deck — lands on
the same fingerprint instead of opening a duplicate.

**Core code**

```js
const fpOf = (area, symptom) =>
  crypto.createHash('sha256')
    .update((String(area) + '|' + String(symptom).replace(/[0-9]+|[A-Za-z]:\\\S+|\/\S+\.\w+|deck_\w+|ref_\w+/g, '#')).toLowerCase())
    .digest('hex').slice(0, 12);
```

**Input** — `add-finding --json '{"area":…,"symptom":…,"sev":"P0","status":"open"}'`.
**Output** — the line appended, and a message saying whether this fingerprint is new
or already known.
**Failure behavior** — a finding without an area and a symptom exits 1. History is
never rewritten, so a wrong finding is corrected by appending, not by editing.
**Next** — with the ledger written, something has to decide: Step 7.

## Step 7 — The verdict is deterministic, and the model never gets a vote

**File:** `scripts/qa-gate.mjs`
**Symbol:** the `try` block from `blocks` (line 148) to the verdict, `gateConfigured` (line 280)
**Called by:** a CI job, a Stop hook, or a person before deploying
**Calls next:** spawns `live-signal.mjs`, `qa-memory.mjs`, `prettify-audit.mjs`

**Why this exists**
A loop that scores itself can always decide it is finished. This is the out-of-process
verdict it cannot talk its way past: it never calls a model. It re-checks that
production is actually live right now, folds in the ledger, and exits on a fixed
contract — 0 passed, 1 blocked, 2 nothing-to-check, 3 internal error. Which findings
block is a policy stated in one place: any open P0, any defect that was fixed and came
back, a failed live check, a scored quality dimension that dropped. Visual-polish
scores are captured and never block.

**Core code**

```js
const gateConfigured = liveConfigured || findings.size > 0 || runs.length > 0;
let status, code;
if (!gateConfigured)      { status = 'no_gate'; code = EXIT.NO_GATE; }  // never a pass
else if (blocks.length)   { status = 'failed';  code = EXIT.BLOCKED; }
else                      { status = 'passed';  code = EXIT.PASS; }
```

**Input** — a config naming the app, the ledger directory, and the live URL plus the
strings that must be present in it.
**Output** — a human summary, and `gate-state.json` with sorted keys so a hook can
read the verdict byte-stably without re-running.
**Failure behavior** — fail-closed everywhere. No config, unreadable config, empty
ledger, or an unexpected crash all exit non-zero. An unconfigured gate is never a pass.
**Next** — what happens when the inputs themselves are damaged: Step 8.

## Step 8 — A record that cannot be read blocks, rather than disappearing

**File:** `scripts/lib/ledger.mjs`
**Symbol:** `readLedger` (line 25), the `unreadable.push` branch (line 35)
**Called by:** `qa-memory.mjs` (the human view) and `qa-gate.mjs` (the gate)
**Calls next:** nothing — this is the bottom of the stack

**Why this exists**
The ledger is appended to by whatever agent ran last, so a half-written final line is
its ordinary failure mode, not an exotic one. Both readers used to carry their own
copy of this file reader and the copies disagreed about that line: the gate dropped it
and printed **PASSED**, while the viewer died with a stack trace. A gate whose own
header promises it "never silently allows" was reporting green over a finding it could
not read. Reading happens here once now, an unreadable line is always returned rather
than dropped, and each caller acts on it deliberately — the viewer names the line
number, the gate refuses to pass.

**Core code**

```js
try {
  records.push(JSON.parse(text));
} catch {
  unreadable.push({ line: index + 1, text: text.slice(0, 120) });
}
```

and, in `qa-gate.mjs` (line 183):

```js
blocks.push({ check: 'memory-unreadable', sev: 'P0',
  reason: `unreadable ledger line — ${file} line ${entry.line} is not valid JSON, so its finding cannot be ruled out`, … });
```

**Input** — a path to a JSONL file that may or may not exist.
**Output** — `{ records, unreadable }`. A missing file is an empty ledger, which is
legitimate; a damaged one is not.
**Failure behavior** — this function does not exit or throw. It reports, and the
caller decides. That split is the whole point: a viewer and a gate should print
differently, but they must never *see* differently.
**Next** — what proves all of the above: Step 9.

## Step 9 — The tests that prove this flow

**File:** `test/ledger.test.mjs` and `test/surface.test.mjs`
**Symbol:** `a half-written ledger line is reported, never silently skipped` (line 129)
**Called by:** `npm test`, and the `proof` job in
`.github/workflows/node-platform-conformance.yml`
**Calls next:** each test spawns the real script as a child process and reads its real
exit code

**Why this exists**
Nothing here is mocked. A test that stubbed the ledger reader would have agreed with
both broken copies in Step 8. Each test writes a throwaway ledger, runs the actual
command an agent would run, and asserts on the exit code and the output a person would
see. The runner is Node's own `node --test`, so the zero-dependency promise survives.

**Core code**

```js
const gate = run('qa-gate.mjs', [gateConfig(dir, memory)]);
assert.notEqual(gate.code, 0, 'a gate that cannot read its own ledger must not report PASSED');
assert.match(gate.out, /unreadable|corrupt|parse/i);
```

**Input** — none; each test builds its own temporary workspace.
**Output** — 32 passing TAP entries: 31 named behavior tests plus one helper-file entry.
These source checks do not certify rendered layout or native clipboard behavior.
**Failure behavior** — `npm test` exits non-zero and CI goes red.
**Next** — nothing. That is the end of one pass.

---

## Stages that do not exist here, and why

The gate's reading order names nine stages. Three of them have no code in this
repository, and inventing a file to fill the slot would be worse than saying so:

- **Agent orchestration.** The orchestrator is the coding agent following `SKILL.md`
  — a prompt, not a runtime. The only orchestration written in code is `qa-gate.mjs`
  composing three sub-checks (Step 7), and it is deliberately dumb: it spawns child
  processes and never calls a model.
- **Tool registration.** There is no tool registry. The equivalent is `AGENTS.md`'s
  capability table, which maps a capability ("live-deploy proof") to a command, and
  `lib/browser.mjs` (Step 4), which acquires the one external tool anything here uses.
- **Streaming and rendering.** Nothing streams. Output is stdout plus JSON receipts.
  The one rendered surface is `examples/trace-revamp/mockup.html`, a worked example of
  a redesigned trace view that this repo uses as its own test subject — it is a
  demonstration artifact, not part of the runtime.

## Where you would add one adjacent capability

A new machine check — say, a keyboard-navigation audit — is one new file in
`scripts/`, using `resolvePlaywright` from `lib/browser.mjs`, printing a `PASS`/`FAIL`
line and writing a JSON receipt. `self-check.mjs` will syntax-check it automatically
(it reads the directory rather than a list). Add it to the capability table in
`AGENTS.md` so agents can find it, add one test in `test/`, and wire it into
`qa-gate.mjs` only if it should be able to *block* a deploy — advisory checks are
captured there but never change the verdict.
