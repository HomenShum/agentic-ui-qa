# agentic-ui-qa

**A Claude Code skill that QA-tests and dogfoods agentic application UIs until any coding agent — including cheap models — can drive them end to end.**

Not a test framework. A *protocol*: persona journeys, artifact-only verification, a scored quality bar for agentic UX, and a bounded fix-revamp loop — written so literally that a Haiku-class model can execute it cold. Validated exactly that way: a Haiku agent ran the smoke journey against a production app with only these files as input, passed, and its friction list was folded back in.

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

B8 is the meta-dimension: if a Haiku-class agent can't complete the core journeys from your app's profile alone, the friction list *is* your revamp spec.

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

```bash
# user-level (all projects)
git clone https://github.com/HomenShum/agentic-ui-qa ~/.claude/skills/agentic-ui-qa

# or repo-level (one project)
git clone https://github.com/HomenShum/agentic-ui-qa .claude/skills/agentic-ui-qa
```

Then in Claude Code: *"QA my app with agentic-ui-qa"* — the skill resolves (or makes you create) the app profile first, runs the journeys, scores the Bar, and reports findings with evidence paths.

`pixels.cjs` needs Playwright in any repo on disk — point the config's `"repo"` field at one.

## The loop

```
scout repo → fill profile → run journeys A0–A6 (persona-driven, artifact-verified)
→ score the Bar → fix findings (root-cause, bounded retries, gates green)
→ revamp lowest dimension (consult REFERENCES.md) → re-run → re-score
→ cold-run a cheap model on the skill itself; fold its friction list back in
```

That last step is the point: the skill dogfoods itself. A protocol a cheap model can't follow is itself a finding.

## Provenance

Extracted from real QA sessions on production agentic apps — every trap in U1–U11 cost real debugging time once (frozen CDP screenshot pipelines, per-action consent resets, charset mojibake, CSS class collisions hiding entire components, concurrent agent writers, SPA-shell false negatives…). Trace-UI design vocabulary informed by [Agent Prism](https://github.com/evilmartians/agent-prism) (Evil Martians, MIT) — adopted as a reference, not a dependency.

## License

MIT © Homen Shum
