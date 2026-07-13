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
| B11 | **First-run & progressive disclosure** — the landing shows the user's intent (one composer), not the app's editor/proof machinery; complexity reveals progressively; clean routes, no leaked `?qa=`/`?domain=`/`?deck=` params |

B8 is the meta-dimension: if a Haiku-class agent can't complete the core journeys from your app's profile alone, the friction list *is* your revamp spec.

**The conditional DEPTH tier (D1–D11).** The Bar scores whether the UI is *trustworthy and operable*. [`DEPTH.md`](DEPTH.md) adds an orthogonal second tier — D1 agentic runtime depth · D2 grounded web research + claim lineage · D3 durable execution + recovery · D4 claim-level data lineage · D5 uploaded-data safety + privacy lifecycle · D6 conversation + durable memory · D7 dynamic model routing · D8 document ingestion breadth · D9 collaboration + governance · D10 output semantic quality · D11 repeat-user workflow + retention — scoring whether the thing *under* the UI is a durable, grounded, governed agent PRODUCT. It is **conditional** (applies only to data-grounded / document-producing / multi-model / long-running agentic apps; a simple bot scores the rest `N/A`) and **orthogonal** to the Bar: an app can be 22/22 on B and near-0 on D — a beautiful, honest UI over a shallow, single-shot agent. Run it via journey A7. B raises the level of the surface; D raises the level of the product.

## Detect → fix, not just detect

A low Bar score isn't the end of the pass — [`REVAMP.md`](REVAMP.md) is the fix playbook: a proven pipeline (ground in the real component → 3–4 design directions → adversarial judge → self-contained interactive mockup with every honest state → pixel-critique loop → implementation spec → gated implementation) plus per-surface checklists for trace/provenance UIs, agent chat, proposal/diff review, status & latency feel, layout, and content quality. [`examples/trace-revamp/`](examples/trace-revamp/) is the full worked case: a production trace tab taken from flat text dump to a provenance rail with a tri-signature seal and three honest states — mockup and engineer-ready spec included.

For **B9 specifically**, [`PRETTIFY.md`](PRETTIFY.md) is the presentation-only mode: it explodes visual craft into a machine-measurable **VISUAL RUBRIC (V1–V9)** scored by [`scripts/prettify-audit.mjs`](scripts/prettify-audit.mjs) (distinct font-sizes, off-grid spacing rate, palette sprawl, per-node WCAG contrast, radius/shadow variety, alignment, motion), then drives a **prettify loop** — audit → presentation-only token/CSS candidates → vision-judge against the rubric → apply the winner → re-audit + pixel-verify + **re-run B1–B10 for zero regression**. The inviolable constraint: prettification is *additive to trust, never a tradeoff* — a restyle may touch only tokens/spacing/type/color/radius/shadow/motion, and an a11y-tree-snapshot diff plus a masked honest-state pixel diff prove it never moved a testid, softened a degraded state, or hid provenance. Beauty that costs trust is a P0.

Once a fix is gate-green, [`HANDOFF.md`](HANDOFF.md) ships it: the [BetterPRHandoff](https://www.npmjs.com/package/@homenshum/easier-to-read-submissions) protocol applied to a QA finding — per-surface changelog lanes, a verified demo, a live-DOM "shipped" grep (a green CI badge is the author's layer wearing a costume), an ASCII runtime diagram for multi-layer fixes, and a QA packet for handoffs — each phase conditional on what the fix touched, with an *independent* layer required before the word "shipped." For a landed revamp or a demo deliverable, [`PROOF.md`](PROOF.md) is the heavy generator for the verified-demo phase: a storyboarded before/after narrated clip (empty → action → loading → result, animated cursor, on-screen verdicts) via [FeatureClipStudio](https://github.com/HomenShum) (Playwright → Remotion → ffmpeg → vision-judge). Same honesty floor: a before/after that shows only the happy path and hides the honest degraded state is a fake success — a P0, not a highlight reel.

## Platform

This skill is the *runner* in a larger chain — define the standard → run it → attack it →
judge its taste → give it a reference to copy → auto-gate the proof → ship and prove →
prevent regressions in the next app → learn from the corpus. [`PLATFORM.md`](PLATFORM.md)
maps the whole chain: where the Bar nests (the `agent-era-maturity-model` rubric it
instances) and how the lifecycle modules — [`REDTEAM.md`](REDTEAM.md) (attack),
[`BAR-DEFAULTS.md`](BAR-DEFAULTS.md) (prevent), [`GATING.md`](GATING.md) (auto-gate),
[`HANDOFF.md`](HANDOFF.md) / [`PROOF.md`](PROOF.md) (ship + prove), and
[`TASTE.md`](TASTE.md) (learn) — fit around it. Every layer names a first-party prior-art
implementation (see REFERENCES.md → *First-party references*); you can run the skill with
none of them and add each as you need it.

## What's inside

```
SKILL.md            the universal protocol: ground rules, journey archetypes A0–A6,
                    the Bar, 11 hard-won traps (U1–U11), finding format, revamp loop
REDTEAM.md          journey A6 as a real adversarial battery (not a checklist): typed
                    attacks per Bar dim (consent bypass, fake-success, fabricated
                    attribution, scope escape, observed-content injection, silent-mutate),
                    each with a machine PASS condition, the deterministic/LLM/manual
                    three-judge design, and confirmed-break→P0 ledger wiring
DEPTH.md            the conditional DEPTH tier (D1–D11): scores whether the agent UNDER
                    the UI is a durable, grounded, governed PRODUCT (tool-loop depth, web
                    claim lineage, durable/resumable jobs, cell-level data lineage, upload
                    safety, durable memory, model routing, doc ingestion, governance,
                    output eval, repeat-user retention) — orthogonal to B1–B11, applies
                    only to data-grounded/document/multi-model/long-running apps, run via A7
REFERENCES.md       42 link-verified references — OSS trace UIs, agentic-UX writing,
                    product mechanisms — each mapped to the Bar dimension it informs
profiles/           per-app anchors: URLs, auth, gates, provenance signals, journeys,
                    app-specific traps. TEMPLATE.md for new apps (fill first, then QA)
BAR-DEFAULTS.md     shift-left: day-one conventions that make a NEW app born scoring
                    high on B1–B11 (egress gate, receipt-only provenance, proposal-only
                    writes, testid/aria contract, clean-route scaffold, CI ui_ux_qa gate)
PLATFORM.md         where the Bar nests (agent-era-maturity-model rubric + JSON schema)
                    and the platform chain: adversary, taste-judge, auto-gate, ship+prove
GATING.md           the auto-gate: an out-of-process verdict the loop can't self-close —
                    a Stop-hook / CI check + optional deploy guard (proofloop/NodeProof lineage)
TASTE.md            the learning layer: three additive adapters over the QA ledger — taste
                    memory (calibrate the B9 judge), a learn-from-wontfix finding gate,
                    a per-pass trace→Bar-delta→repair loop; skip any and behavior is unchanged
PRETTIFY.md         the presentation-only polish subsystem: B9 exploded into the
                    VISUAL RUBRIC V1–V9 (machine-measurable), the prettify loop
                    (audit → candidates → vision-judge → apply → re-audit + re-run
                    B1–B10), and the inviolable "additive to trust, never a tradeoff"
                    guardrails (a11y-snapshot diff, masked honest-state pixel diff)
HANDOFF.md          the ship end: a §6 finding + its fix → a readable, verified PR via
                    BetterPRHandoff (per-surface changelog lanes · verified demo · live-DOM
                    "shipped" grep · ASCII runtime diagram · QA packet), an independent
                    layer required before "shipped," phases conditional on what the fix touched
PROOF.md            the narrated before/after proof clip (FeatureClipStudio: Playwright →
                    Remotion → ffmpeg → vision-judge) — the heavy generator for HANDOFF's
                    verified-demo phase; a clip that hides the honest degraded path is a P0
scripts/pixels.cjs         headless pixel capture (Playwright) — survives frozen browser
                           screenshot pipelines; reports mojibake/console/overflow/asserts
scripts/prettify-audit.mjs machine VISUAL-RUBRIC scorecard (font-sizes, off-grid spacing,
                           palette sprawl, WCAG contrast, radius/shadow, alignment,
                           motion) — advisory, always exit 0; feeds the PRETTIFY loop
scripts/live-signal.mjs    raw-HTML signal grep — never say "deployed" without it
scripts/qa-gate.mjs        the auto-gate binary (GATING.md): reads the memory ledger,
                           returns the done/needs-verification/not-done/blocked verdict,
                           fail-closed when the state file is absent
ci/qa-gate.yml             drop-in CI job wiring qa-gate.mjs as a named ui_ux_qa check
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
