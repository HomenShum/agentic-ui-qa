# agentic-ui-qa

**An agent-agnostic QA + dogfooding protocol for agentic application UIs — until any coding agent, on any model, can drive them end to end.**

Not a test framework. A *protocol*: persona journeys, artifact-only verification, a scored quality bar for agentic UX, and a bounded fix-revamp loop. It ships as a Claude Code skill but runs anywhere an agent can read markdown, run shell commands, and drive a browser or Playwright — Codex, Cursor, Gemini CLI, aider, OpenHands, your own harness (`AGENTS.md` is the generic entry point).

**It scales in both directions.** The floor: written so literally that a Haiku-class model can execute it cold — validated exactly that way (a Haiku agent ran the smoke journey against a production app with only these files as input, passed, and its friction list was folded back in). The ceiling: powerful models are explicitly told what to ADD — adversarial journey extensions, mechanism-level root-cause fixes, reference-driven revamp design with scored options, designer-grade pixel critique, and improving the protocol itself after every pass. The honesty invariants (no artifact no claim, fail closed, provenance is ground truth) never scale away at any tier — a stronger model earns wider action, never looser honesty.

## Why this exists

Agents are becoming users of your UI. Most "AI app" QA checks whether humans can click through; almost nothing checks whether an *agent* can — stable labels, deterministic selectors, honest status, inspectable provenance. And most AI-app QA takes the app's word for it ("✓ generated!") instead of demanding receipts. This skill does both:

- **No artifact, no claim.** Every "it works" needs a PNG rendered this session, a DOM signal grepped, or a gate exit code. Fail closed.
- **Provenance is ground truth.** "The live model ran" requires model id + nonzero cost/tokens + a receipt — otherwise it's the fallback wearing a costume.
- **The app gets scored, not just tested** — and the lowest score becomes the next revamp target. Loop.

## The Agentic UI Bar (B1–B8)

Each dimension scored 0–2 per pass; lowest = next revamp target:

| # | Dimension |
|---|---|
| B1 | Consent & egress honesty — private by default, per-action opt-in, egress named before it happens |
| B2 | Attribution & provenance — model id, cost, tokens, verifiable receipt on every AI action |
| B3 | Propose-before-mutate — AI changes land as reviewable diffs; nothing silent |
| B4 | Scope boundaries — what AI may READ vs WRITE is explicit and enforced |
| B5 | Honest degrade — fallback/failure labeled and visually distinct; never a fake success |
| B6 | Status & latency feel — immediate echo, staged honest progress, honest timeouts |
| B7 | Recoverability — versions/undo/restore work after AI actions |
| B8 | **Agent operability** — a cheap model can drive the UI from the docs alone |
| B9 | **Visual craft** — reads as designed tooling, not AI slop; judged on rendered pixels |
| B10 | **Conversation & content quality** — chat and copy earn trust: verdict-first, honest errors, sources marked |

B8 is the meta-dimension: if a Haiku-class agent can't complete the core journeys from your app's profile alone, the friction list *is* your revamp spec.

## Detect → fix, not just detect

A low Bar score isn't the end of the pass — [`REVAMP.md`](REVAMP.md) is the fix playbook: a proven pipeline (ground in the real component → 3–4 design directions → adversarial judge → self-contained interactive mockup with every honest state → pixel-critique loop → implementation spec → gated implementation) plus per-surface checklists for trace/provenance UIs, agent chat, proposal/diff review, status & latency feel, layout, and content quality. [`examples/trace-revamp/`](examples/trace-revamp/) is the full worked case: a production trace tab taken from flat text dump to a provenance rail with a tri-signature seal and three honest states — mockup and engineer-ready spec included.

## What's inside

```
SKILL.md            the universal protocol: ground rules, journey archetypes A0–A6,
                    the Bar, 11 hard-won traps (U1–U11), finding format, revamp loop
REFERENCES.md       42 link-verified references — OSS trace UIs, agentic-UX writing,
                    product mechanisms — each mapped to the Bar dimension it informs
profiles/           per-app anchors: URLs, auth, gates, provenance signals, journeys,
                    app-specific traps. TEMPLATE.md for new apps (fill first, then QA)
scripts/pixels.cjs      headless pixel capture (Playwright) — survives frozen browser
                        screenshot pipelines; reports mojibake/console/overflow/asserts
scripts/live-signal.mjs raw-HTML signal grep — never say "deployed" without it
```

The three included profiles (NodeSlide, NodeRoom Live, NodeBench AI) are real, working examples against production apps — read them to see what a filled profile looks like.

## Install

**Claude Code** (auto-discovered as a skill):

```bash
# user-level (all projects)
git clone https://github.com/HomenShum/agentic-ui-qa ~/.claude/skills/agentic-ui-qa

# or repo-level (one project)
git clone https://github.com/HomenShum/agentic-ui-qa .claude/skills/agentic-ui-qa
```

Then: *"QA my app with agentic-ui-qa"* — the skill resolves (or makes you create) the app profile first, runs the journeys, scores the Bar, and reports findings with evidence paths.

**Codex / Cursor / Gemini CLI / aider / anything else:** clone it anywhere and point your agent at it — `AGENTS.md` at the repo root is the entry prompt (it routes to `SKILL.md`). The YAML frontmatter in SKILL.md is Claude metadata; every other agent can ignore it — the protocol is plain markdown + two dependency-light Node scripts (Playwright resolved from any repo that has it).

`pixels.cjs` needs Playwright in any repo on disk — point the config's `"repo"` field at one.

## The loop

```
scout repo → fill profile → REGRESSION SWEEP from memory (re-verify every past fixed P0/P1)
→ run journeys A0–A6 (persona-driven, artifact-verified)
→ score the Bar → fix findings (root-cause, bounded retries, gates green)
→ revamp lowest dimension (consult REFERENCES.md) → re-run → re-score
→ append run + findings to memory → cold-run a cheap model on the skill itself;
  fold its friction list back in
```

That last step is the point: the skill dogfoods itself. A protocol a cheap model can't follow is itself a finding.

## Memory (remember every failure)

Same lineage as [proofloop](https://github.com/HomenShum/proofloop-fork)'s "remember every failure": each app keeps an **append-only QA ledger in its own repo** (`.qa/memory/` — runs.jsonl + findings.jsonl, managed by the dependency-free `scripts/qa-memory.mjs`). Findings are fingerprinted so re-discoveries dedupe across runs; every finding ever marked *fixed* at P0/P1 becomes a **permanent regression check** at the start of every future pass — the corpus only grows. `history` shows Bar-score drift across passes, honestly. Memory lives with the app, not in this skill clone, so your QA history stays as private as your repo.

## Provenance

Extracted from real QA sessions on production agentic apps — every trap in U1–U11 cost real debugging time once (frozen CDP screenshot pipelines, per-action consent resets, charset mojibake, CSS class collisions hiding entire components, concurrent agent writers, SPA-shell false negatives…). Trace-UI design vocabulary informed by [Agent Prism](https://github.com/evilmartians/agent-prism) (Evil Martians, MIT) — adopted as a reference, not a dependency.

## License

MIT © Homen Shum
