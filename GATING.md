# GATING.md — run agentic-ui-qa UNATTENDED as a deploy gate

*(proofloop-fork + NodeProof lineage. `SKILL.md` is the attended protocol — a human/agent
drives the personas. This file is the **unattended** face: a deterministic gate that decides
ship / block with no model in the decision path, so it can sit on a Stop hook, a deploy
command, or a CI job and never lie.)*

The one locked invariant, inherited from both upstream tools:

> **Deterministic checks DECIDE. The LLM only EXPLAINS.**

Nothing a model says ever flips the verdict. The QA agent (running `SKILL.md`), the
PRETTIFY vision-judge, an advisory reviewer — all of them *explain* already-decided failures
and *propose* fixes. The pass/fail and the exit code are computed by
[`scripts/qa-gate.mjs`](scripts/qa-gate.mjs) from evidence only: a live-HTML signal grep, the
append-only memory ledger, and recorded Bar scores. Offline, with every model unplugged, the
verdict is byte-identical.

---

## 1. Where the gate intercepts (three composable layers)

The `agentic-ui-qa` verdict becomes a gate the moment it **exits non-zero on failure**.
`scripts/qa-gate.mjs` is that exit code. Wire it at whichever interception point you own —
they stack:

| Layer | Interception point | Mechanism | Blocks what |
|---|---|---|---|
| **A · NodeProof gate check** (primary) | the agent's **Stop event** + **CI** | `qa-gate.mjs` is a named check whose exit code is the verdict; persisted to `gate-state.json`; a Stop hook reads it and refuses "done" | fake completion — the agent can't declare success while the gate is red |
| **B · proofloop-fork deploy guard** (optional) | **the deploy command itself** (`proofloop guard deploy -- <cmd>`) | the guarded child never spawns if the gate blocked (exit 2 = BLOCKED) | a real `vercel --prod` / `./deploy.sh` reaching production |
| **C · CI backstop** (always) | `push` / `pull_request` | [`ci/qa-gate.yml`](ci/qa-gate.yml) re-runs `qa-gate.mjs` from a **clean checkout** | anything the agent bypassed via raw shell — CI is the agent-neutral floor |

Recommended: **A + C**. Add **B** only when you also want to block the literal deploy binary.

---

## 2. Deterministic decides / model explains — the split, enforced by ORDER

`qa-gate.mjs` computes the verdict in this order, and the exit code is fixed **before** any
prose is generated (mirrors proofloop-fork `run_gate` §1c):

1. **Deterministic checks** produce `blocks[]` — live-signal exit code, memory ledger state
   (open P0 / regressed fixed-finding), Bar-floor comparison. `status = blocks.length ?
   'failed' : 'passed'` and the exit code are **fully determined here.**
2. **Persist** the schema-versioned `gate-state.json` (sorted keys → byte-stable CAS).
3. **Explain** (this is where a model MAY be invoked, *outside* `qa-gate.mjs`): a Stop hook
   hands the failing check names + evidence back to the agent; the QA agent root-causes and
   proposes the smallest fix per `SKILL.md §6`; the PRETTIFY vision-judge critiques pixels.
   None of this touches `status`, `blocks`, or the exit code.

`qa-gate.mjs` itself **never calls a model** — it is pure `fs` + `child_process`. The advisory
surface (prettify V1–V9, open P1/P2, the sweep reminder) can *surface* a problem a human then
promotes to a deterministic check (proofloop's "graduation"); it never gates on its own.

---

## 3. What blocks a deploy vs. what is advisory

### Blocks (exit 1) — deterministic, decides the verdict

| Check | Blocks when | Toggle (default) |
|---|---|---|
| `live-signal` | the configured prod signals are **not** all present in raw HTML right now (or the check errored — fail-closed) | `gate.blockOnLiveSignal` (true) |
| `memory-open-p0` | any finding whose **latest** status is `open`/`regressed` at **P0** | `gate.blockOnOpenP0` (true) |
| `memory-regression` | any finding ever `fixed` at **P0/P1** whose latest status is now `regressed` | `gate.blockOnRegressed` (true) |
| `bar-drop` | the latest recorded run scored a Bar dim (B1–B11) **below** the sanctioned floor | `gate.blockOnBarDrop` (true) |

Bar floor = `gate.barFloor` in the config (the *sanctioned* floor — the honest way, so a
legitimate stricter re-score updates the floor deliberately) **or**, absent that, the previous
run's `bar` from `runs.jsonl`. A drop below the floor blocks; an *honest* re-score that lowers
a dim on purpose is expressed by moving `barFloor`, not by the gate silently accepting it.

### Advisory (never blocks) — reported so a human/agent acts, verdict untouched

- **prettify-audit V1–V9** — the full VISUAL RUBRIC scorecard. `prettify-audit.mjs` always
  exits 0; `qa-gate.mjs` ignores its exit code entirely and captures the report into
  `gate-state.json.prettify`. *Beauty is additive to trust, never a gate* (`PRETTIFY.md`).
- **Open P1/P2 findings** — backlog context, printed as advisories.
- **The regression sweep list** (`qa-memory.mjs regressions`) — the mandatory re-verify manifest
  for the *next attended pass*. The gate runs it and captures it; the *block* only fires once a
  re-verify has actually appended a `regressed` event.

Rationale for the P0-vs-P1 line: a P0 is dishonesty / crash / dead-core-flow — never shippable.
An open P1 has a workaround; it belongs in the backlog, not on the deploy brake. Any **regressed**
fixed-finding (P0 *or* P1) blocks, because a fix that came undone is a broken promise.

---

## 4. Exit-code contract (fail-closed; never silently allows)

| Exit | Meaning | Notes |
|---|---|---|
| `0` | **PASSED** | every deterministic check green; nothing in a blocking state |
| `1` | **BLOCKED** | ≥1 deterministic block; reasons + evidence in `gate-state.json.blocks` |
| `2` | **NO_GATE** | misconfigured / nothing to check (no config, invalid JSON, empty ledger + no live check). **An unconfigured gate is never a pass** |
| `3` | **INTERNAL** | unexpected error inside the gate — still safe, never allows |

`--check` mode reads the last `gate-state.json` and re-exits on its status **without re-running**
(NodeProof `gate --check` analog); a missing state file returns 2 (fail-closed). This is what a
Stop hook uses for a zero-cost, offline, deterministic read.

Map to the interception layers:
- **Stop hook** (Layer A): `status==="passed"` → allow stop · `"failed"` → **block stop**, feed
  failing check names back to keep the agent working · `"no_gate"` → allow with an honest note (a
  fresh repo is never bricked).
- **proofloop guard** (Layer B): run `qa-gate.mjs` as a stamped pre-deploy check; its exit 1/2
  becomes the guard's BLOCKED (child deploy never spawns).
- **CI** (Layer C): a non-zero exit is a red check; `gate-state.json` is uploaded as an artifact.

---

## 5. `gate-state.json` — the persisted verdict

Written to `<outDir>/gate-state.json` (default `<memoryDir>/../gate/`). Schema-versioned,
sorted-key (deterministic CAS), so a Stop hook / CI reads it without re-running:

```json
{
  "schema": "agentic-ui-qa-gate-v1",
  "status": "passed | failed | no_gate",
  "ts": "2026-07-13T…Z",
  "app": "NodeSlide / parity-studio",
  "executor": "claude-code | codex | ci | local",
  "blocks":    [{ "check": "memory-open-p0", "sev": "P0", "reason": "…", "evidence": "…" }],
  "advisories":[{ "check": "prettify-audit", "note": "VISUAL RUBRIC 12/16 (75%) — advisory" }],
  "checks":    [{ "name": "live-signal", "command": "…", "pass": true, "ms": 412, "exitCode": 0 }],
  "prettify":  { "aggregate": { "score": 12, "max": 16, "pct": 75 }, "targets": [ … ] },
  "barFloorSource": "config.gate.barFloor",
  "latestRun": { "ts": "…", "bar": { "B1": 2, "B6": 1 }, "executor": "opus" },
  "sweep": "…qa-memory regressions output…",
  "inputsHash": "73fea6178fce10c5"
}
```

The **memory ledger is the persisted verdict of the last attended pass**; `qa-gate.mjs` reads it
and adds two fresh deterministic re-checks (live-signal now, Bar-floor now). Unattended, that is a
coherent question: *"given the last recorded pass, is anything in a blocking state right now?"*

---

## 6. Cross-agent neutrality

Same gate, same checks, same memory, regardless of which agent runs it. The agent is **detected
and recorded** (`gate-state.json.executor`, from `CLAUDECODE` / `CODEX_*` / `CI`, overridable via
`PROOFLOOP_AGENT_SOURCE`) — never used to change gate behavior. A P0 first recorded under Claude
Code blocks a Codex run in CI identically: same repo, same ledger, same fingerprint.

Hook wiring (deep-merge into the agent's settings; never clobber; idempotent):

| Agent | Event | File | Command |
|---|---|---|---|
| Claude Code | `Stop` | `.claude/settings.json` | `node <skill>/scripts/qa-gate.mjs <config.json> --check` |
| Claude Code | `PreToolUse` matcher `Edit\|Write\|MultiEdit` | `.claude/settings.json` | guard that refuses edits to the gate config / `.qa/` (the gate def is not the agent's to move) |
| Codex | `Stop` (flat `hooks[]`) | `.codex/hooks.json` | `node <skill>/scripts/qa-gate.mjs <config.json> --check` |
| Cursor / others | — | rules doc | enforcement is Claude-Code/Codex-only today; **CI is the agent-neutral backstop** |

Use `--check` (not a full run) on the Stop hook: it is deterministic, offline, and zero-cost —
it reads the verdict the last full run persisted. Schedule the full `qa-gate.mjs <config.json>`
(which does the live-signal + prettify + sweep) in CI and/or a pre-deploy step.

---

## 7. Wiring (concrete)

**Config** — `qa-gate.config.json` in the target repo (see the header of `scripts/qa-gate.mjs`
for every field). Minimal NodeSlide example:

```json
{
  "app": "NodeSlide / parity-studio",
  "repo": "D:/VSCode Projects/parity-studio",
  "memoryDir": "D:/VSCode Projects/parity-studio/.qa/memory",
  "outDir":    "D:/VSCode Projects/parity-studio/.qa/gate",
  "live": { "url": "https://parity-studio.vercel.app/?domain=nodeslide",
            "signals": ["NodeSlide", "reviewable"] },
  "prettify": { "url": "https://parity-studio.vercel.app/?domain=nodeslide", "scheme": "light" },
  "gate": { "barFloor": { "B1":2,"B2":2,"B3":2,"B4":2,"B5":2,"B6":1,"B7":2,"B8":1,"B9":2,"B10":2 } }
}
```

**Local / pre-deploy:**
```bash
node ~/.claude/skills/agentic-ui-qa/scripts/qa-gate.mjs ./qa-gate.config.json
echo "exit $?"    # 0 ship · 1 block · 2 misconfigured · 3 internal
```

**Stop hook (Claude Code)** — deep-merge into `.claude/settings.json`:
```json
{ "hooks": { "Stop": [ { "hooks": [ { "type": "command",
  "command": "node ~/.claude/skills/agentic-ui-qa/scripts/qa-gate.mjs ./qa-gate.config.json --check" } ] } ] } }
```
`--check` reads the persisted verdict; a full `qa-gate.mjs` run (in CI or a pre-deploy step)
refreshes it.

**proofloop-fork deploy guard (optional):**
```bash
proofloop guard deploy -- bash -c 'node ~/.claude/skills/agentic-ui-qa/scripts/qa-gate.mjs ./qa-gate.config.json && vercel --prod'
```

**CI:** copy [`ci/qa-gate.yml`](ci/qa-gate.yml) to `.github/workflows/` and set the config path.

---

## 8. Unattended-safety (fail-closed where it counts, fail-open only where a bug must not trap a human)

- **Fail-closed on the decision path.** No config / invalid JSON / empty ledger → exit 2, never a
  pass. live-signal unreachable or erroring → BLOCK (you cannot prove prod is live). `--check` with
  no state file → exit 2. An internal error → exit 3. **Nothing silently allows.**
- **Advisory failures never block.** `prettify-audit.mjs` exit code is ignored; a missing Playwright
  or a nav failure downgrades prettify to an advisory note, not a block.
- **No secrets in artifacts.** `qa-gate.mjs` prints/persists only finding *symptoms*, evidence
  strings, check names, and exit codes — never env-var values. The profile names access codes as env
  vars; keep it that way (`SKILL.md §1.6`).
- **Determinism / CAS.** `gate-state.json` is sorted-key JSON with an `inputsHash` (sha256 of the
  sorted decision inputs) so the same tree yields the same verdict, byte for byte.

---

## Invariants that never bend (identical to `SKILL.md`, at every tier)

No artifact, no claim · fail closed · provenance is ground truth · scope discipline · never print
secrets · the memory corpus only grows · **deterministic decides, the model only explains.**
A stronger model earns wider action, never looser honesty.
