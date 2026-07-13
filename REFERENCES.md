# REFERENCES.md — Agentic UI Bar reference library

Reference library backing the Agentic UI Bar (SKILL.md §4). Consulted during the revamp
step (SKILL.md §7): after scoring, look up the lowest dimension's section below to find
the strongest prior art before designing the smallest change that raises it. All URLs
swept + verified alive 2026-07 (corrected URLs applied where the original moved).

**Adopted decision:** agent-prism is already the Trace-tab design reference for NodeSlide
— reference-not-dependency (steal the span-tree/badge patterns, do not add the package).

---

## Scalable trace waterfalls and LLM observability

- [Tinybird templates](https://www.tinybird.co/templates/) — OpenTelemetry template reference for a compact observability starting point. Maps to B2, B8, B9 and `TRACE-WATERFALL.md`.
- [Tinybird observability](https://www.tinybird.co/observability) — OpenTelemetry ingestion and real-time observability mechanism reference. Maps to B2, D1, D3.
- [Grafana: traces in Grafana](https://grafana.com/docs/grafana/latest/datasources/tempo/traces-in-grafana/) — trace drilldown, latency/error investigation, and cross-signal navigation. Maps to B2, B8, B9.
- [Grafana: trace integration](https://grafana.com/docs/grafana/latest/visualizations/explore/trace-integration/) — trace detail anatomy including spans, attributes, events, links, and filters. Maps to B2 and `TRACE-WATERFALL.md`.
- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/) — semantic ground truth for spans, events, links, kinds, and status. Maps to B2, B5, D1, D3.
- [OpenTelemetry Generative AI attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/) — provider/model/token/tool telemetry and sensitive-content considerations. Maps to B1, B2, B5, D7.
- [Langfuse observability overview](https://langfuse.com/docs/observability/overview) — LLM trace reference for nested generations, tool calls, retrievals, and evaluation. Maps to B2, B8, D1, D2.
- [Langfuse data model](https://langfuse.com/docs/observability/data-model) — observation hierarchy, timing, input/output, token, and cost model. Maps to B2, D1, D3.

---

## Per-dimension: strongest references

### B1 — Consent & egress honesty

- **Claude Code — permissions** (https://code.claude.com/docs/en/permissions) — Consent as an inspectable ruleset: every side-effectful call gated by a prompt showing the exact command, graduated escalation (allow once → always-allow rule → mode change), rules in a diffable settings file.
- **Claude in Chrome — read/write split** (https://code.claude.com/docs/en/chrome) — Same agent, same session, different consent per action class: reads silent, writes prompted; per-origin approval before first contact. Cleanest published template for the mechanical boundary.
- **Agentic UX Patterns** (https://agenticuxpatterns.com/) — Consent granularity: one-time vs session-scoped vs standing permission as three distinct UI states with different visual weight; never let one "allow" silently generalize.
- **OpenHands** (https://github.com/OpenHands/OpenHands) — Confirmation mode toggle + risk-tiered ConfirmRisky policy: auto-pass routine actions, pause only on destructive ones — scope boundaries that don't nag.

### B2 — Attribution & provenance

- **Langfuse** (https://github.com/langfuse/langfuse) — Session → trace → observation tree with model id, tokens, USD cost rolled up at every level; shareable public trace links as handable receipts.
- **AgentPrism** (https://github.com/evilmartians/agent-prism + chronicle https://evilmartians.com/chronicles/debug-ai-fast-agent-prism-open-source-library-visualize-agent-traces) — Embeddable span-tree: per-span kind badges (llm/tool/agent/retrieval), collapsible SpanCard with raw payloads, token+cost chips per node; adapter interface renders any trace JSON. **Already adopted as NodeSlide Trace-tab design reference.**
- **Perplexity — streaming citations** (https://docs.perplexity.ai/docs/cookbook/articles/streaming-citations/README) — Claim-level (not answer-level) provenance: numbered chips per sentence with hover source cards, attached progressively during streaming.
- **GitHub Copilot coding agent** (https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents) — Receipt-grade traceability: every commit co-authored and linked to the session log that produced it; all output lands as a draft PR.

### B3 — Propose-before-mutate

- **Notion AI — suggested edits** (https://www.notion.com/help/suggested-edits) — AI output never mutates directly: pending suggestion layer, per-edit check/x controls plus whole-response Accept/Discard/Try-again. Direct fit for agent slide edits as pending canvas suggestions.
- **assistant-ui** (https://github.com/assistant-ui/assistant-ui) — makeAssistantToolUI: typed tool-call components showing args before execution, result after, with a human-approval variant pausing execution for inline accept/deny. Cleanest OSS propose-before-mutate in a chat thread.
- **Cursor — diff review + Find Issues** (https://cursor.com/learn/reviewing-testing) — Live diff hunks so you can Stop mid-run; one-click agent self-review pass over its own diff before accept.
- **E2B Fragments** (https://github.com/e2b-dev/fragments) — Streamed structured-object generation renders the code pane BEFORE sandbox execution — user sees exactly what will run, then flips to live Preview.

### B4 — Scope boundaries (AI read vs write)

- **Claude in Chrome — read/write split** (https://code.claude.com/docs/en/chrome) — Tool-call-level read/write boundary, publicly enumerated. NodeRoom analog: AI reads room state freely, any shared-canvas mutation prompts.
- **Figma Make — point-and-edit** (https://help.figma.com/hc/en-us/articles/31304485164695-Create-and-edit-a-Figma-Make-file) — Spatial scope control: user clicks the exact element the AI may touch; simple properties get direct-manipulation controls, bigger asks go to prompt. NodeSlide analog: click-a-slide-element to constrain write scope.
- **Linear — Agents in Linear** (https://linear.app/docs/agents-in-linear) — Delegation-vs-accountability split: agent is a swappable "delegate" field while a human stays assignee; agent access scoped per-team by admin.
- **NN/g — The UX Reckoning** (https://www.nngroup.com/articles/ux-reset-2025/) — Constraint-first delegation: user sets explicit boundaries (scope, budget, touchables) before the run; UI reports outcomes against declared constraints.

### B5 — Honest degrade

- **Vercel AI Elements** (https://github.com/vercel/ai-elements) — `<Tool>` state machine as status chips: input-streaming → input-available → output-available / output-error — tool progress never faked.
- **OpenLIT** (https://github.com/openlit/openlit) — Separate exceptions/failed-generation tab keeps errors from polluting averages — honest degrade at the analytics layer.
- **Helicone** (https://github.com/Helicone/helicone) — Failed requests keep the provider's actual error body visible instead of blending into success metrics.
- **Anthropic — Writing Effective Tools** (https://www.anthropic.com/engineering/writing-tools-for-agents) — Error messages that tell the agent what to do next; every NodeSlide MCP error string should be actionable by a cheap model.

### B6 — Status & latency feel

- **Gradio agent chat (ChatMessage metadata)** (https://gradio.app/guides/agents-and-tool-usage) — Minimal honest-progress protocol: `metadata={title, id, parent_id, status, duration}` → nested collapsible thought accordions, spinner while pending, "(Ns)" labels. Dict-level contract trivially emittable and testable.
- **Vercel AI Elements** (https://github.com/vercel/ai-elements) — `<Reasoning>` auto-opens while streaming, auto-closes on completion, prints "thought for Ns".
- **Linear — Agent Interaction SDK** (https://linear.app/changelog/2025-07-30-agent-interaction-guidelines-and-sdk) — Platform-level status contract: acknowledged → working → done/error rendered consistently regardless of vendor. Define ONE agent-session status schema all AI features render through, not per-feature spinners.
- **Devin — multi-pane workspace** (https://docs.devin.ai/get-started/devin-intro) — Every agent action watchable live (terminal, browser, plan panes); "what is it doing right now" is never a mystery. Take-over mechanic: human grabs the same workspace mid-run, then hands back.

### B7 — Recoverability

- **Cursor — Checkpoints** (https://cursor.com/docs/agent/overview#checkpoints) — Pre-edit snapshot per agent turn, restore affordance pinned to the chat message that caused the mutation; explicitly separate from git so undo is cheap. NodeSlide: snapshot the deck before every agent patch.
- **v0 — versions** (https://v0.app/docs/versions) — Version boundary = AI generation event (not manual edits); restore creates a NEW head version instead of truncating — restore is itself audited and undoable.
- **Replit Agent — effort-based checkpoints** (https://replit.com/blog/effort-based-pricing) — Fuses recoverability with cost attribution: each checkpoint shows what was done and what it cost next to its rollback affordance. (Rollback/DB-restore details live in Replit's checkpoint docs, not this pricing post — cite docs.replit.com for that claim.)
- **ChatGPT — Canvas versions** (https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it) — Back/forward version stepper embedded in the artifact itself + change-highlighting of last-touched spans. Cautionary tale: community threads document canvas overwriting work — the failure mode NodeSlide must avoid.

### B8 — Agent operability

- **NN/g — AI Agents as Users** (https://www.nngroup.com/articles/ai-agents-as-users/) — The B8 test protocol: audit each screen by asking "could an agent complete this task from the accessibility tree alone?" Design dual-audience: stable semantic labels + machine-readable structure.
- **OpenLLMetry** (https://github.com/traceloop/openllmetry) — Not a UI: the gen_ai.* attribute vocabulary. Emit compliant spans and every OSS trace UI renders your runs for free; stable span names make traces machine-drivable for QA agents.
- **assistant-ui** (https://github.com/assistant-ui/assistant-ui) — Composable primitives with stable roles (Thread, Message, Composer, ActionBar) make the chat surface agent-drivable.
- **LlamaIndex chat-ui** (https://github.com/run-llama/chat-ui) — Annotation-typed message parts: backend event types map 1:1 to UI widgets via a stable annotation schema — deterministic rendering an agent can rely on.

---

## First-party (Homen) references

The prior art authored by the same hand as this skill — MIT, safe to cite as own prior art,
no third-party license risk. These are the concrete implementations the `PLATFORM.md`
platform chain names; consult them when the lowest Bar dim (or the lifecycle phase around a
fix) has a first-party mechanism to steal rather than re-derive.

- **NodeTrace** — B2 trace UI. https://github.com/HomenShum/NodeTrace (MIT,
  `@homenshum/nodetrace`). *Steal:* a portable React "Trace Lens" — Cmd/Ctrl-click any DOM
  surface tagged `data-nodetrace-surface="<id>"` opens a panel with that surface's
  business-proof cards, a **bounded** runtime trace window (tool calls, receipts, verifier
  status), and server-gated code-ownership receipts. Client sees only opaque surface ids +
  labels; Review is default, Builder is server-verified. Mechanism: one capture-phase
  Cmd/Ctrl-click listener → `resolveTraceHit()` → `SurfaceHit{surfaceId, artifactId?, …}`.
  (Dims: B2 B5 B8.)
- **VisualJudge** — B9 vision judge. https://github.com/HomenShum/VisualJudge (MIT,
  `@homenshum/visual-judge`, bin `visual-judge`). *Steal:* a Gemini-backed stdio CLI in three
  composable steps — `capture` (Playwright drives a scenario, emits screenshots + `.webm` +
  deterministic P0/P1/P2 findings), `judge` (Gemini scores the media on 8 dims 0–2 with a
  hard rule: **judge only what is visibly rendered, never infer backend success from UI
  text**), `scorecard` (merge deterministic + model → pass/fix/rework, P0→rework precedence,
  degrades without an API key). Agents gate on the printed `verdict=/p0=/p1=` line. Backs the
  PRETTIFY vision-judge loop. (Dims: B9 B5.)
- **agent-era-maturity-model** — the Bar's parent rubric.
  https://github.com/HomenShum/agent-era-maturity-model (MIT). *Steal:* the container standard
  the Agentic UI Bar is a UI-scoped instance of — `scoreScale` 0–5, six levels L0–L5, a 12-dim
  assessment JSON schema, "build a repo scanner that emits this assessment JSON." Per-domain
  instances (the Bar) are the intended extension. (Dims: all — the rubric family.)
- **AgentRedteam** (`redteam_eval_lab`) — A6 adversary.
  https://github.com/HomenShum/AgentRedteam (MIT). *Steal:* the typed-attack battery shape
  `REDTEAM.md` is grounded in — five transforms (control, consent-bypass, forced-fake-success,
  fabricated-attribution, scope-escape, injection-via-observed-content) each with a
  machine-checkable PASS condition and the deterministic/LLM/manual three-tier judge; the
  "attack your own gates" doctrine (a gate that trusts agent-supplied operands is
  trust-laundering). (Dims: B1 B2 B3 B4 B5 — the whole honesty column.)
- **proofloop / NodeProof** — the auto-gate.
  https://github.com/HomenShum/proofloop-fork + https://github.com/HomenShum/NodeProof (MIT).
  *Steal:* the honest-verification lineage this skill's memory inherits ("remember every
  failure") and the out-of-process gate the loop cannot self-close — `qa-gate.mjs` persists the
  verdict to `gate-state.json` (absent = fail-closed 2), a Stop hook refuses "done" while red,
  a `proofloop guard deploy -- <cmd>` never spawns the child if blocked. A build-green does not
  close it; a rendered DOM signal + receipt does. (Dims: B2 B5 B8.)
- **BetterPRHandoff** (easier-to-read-submissions) — ship.
  https://www.npmjs.com/package/@homenshum/easier-to-read-submissions (MIT). *Steal:* a
  gate-green finding → a readable, verified PR — per-surface changelog lanes (one append-only
  file per page/component/server-module/table/integration, not one git log), a verified demo
  with BOTH DOM checks and video analysis, a live-DOM "shipped" grep, an ASCII runtime diagram,
  a QA packet — an independent layer required before the word "shipped." Drives `HANDOFF.md`.
  (Dims: B2 B3 B7.)
- **FeatureClipStudio** — prove. https://github.com/HomenShum/FeatureClipStudio (MIT).
  *Steal:* the narrated before/after verified-demo clip that proves a journey through product
  code (empty → action → loading → result, animated cursor, on-screen verdicts) via Playwright
  → Remotion → ffmpeg → vision-judge; a clip that hides the honest degraded path is a fake
  success (P0). The heavy generator for `HANDOFF.md`'s verified-demo phase / `PROOF.md`.
  (Dims: B5 B6 B9.)
- **NodeBenchBoilerplate** — prevent. https://github.com/HomenShum/NodeBenchBoilerplate (MIT).
  *Steal:* the GitHub template a new app is scaffolded from so it's *born* scoring high —
  `BAR-DEFAULTS.md` is the bridge that maps each B1–B11 dim to a copyable default (egress gate,
  receipt-only provenance badge, proposal-only write path, clean-route scaffold, testid/aria
  contract, CI `ui_ux_qa` gate). Prevent is cheaper than detect. (Dims: B1–B11 substrate.)
- **harness4visuals / NodeMem / NodeRL** — learn. https://github.com/HomenShum/harness4visuals
  + https://github.com/HomenShum/NodeMem + https://github.com/HomenShum/NodeRL (MIT). *Steal:*
  the three learning adapters `TASTE.md` layers over the QA ledger — harness4visuals mines
  accept/decline/ship events into provenanced **taste memory** (reject-on-write without
  provenance) that calibrates the B9 judge; NodeMem gives the findings ledger a
  notice→gate→learn-from-`wontfix`→dedup brain that surfaces finding **classes** instead of
  re-nagging line-items; NodeRL makes each pass a trace→**reward(Bar-delta)**→memory→repair
  loop that compounds. Same honest-memory invariants (append-only, provenance,
  unscored-not-floored). (Dims: B9 B8 + the compounding loop.)

---

## Full catalog

| Name | Category | URL | License / maturity | Steal | Dims |
|---|---|---|---|---|---|
| AgentPrism (Evil Martians) | oss-trace-ui | https://github.com/evilmartians/agent-prism (chronicle: https://evilmartians.com/chronicles/debug-ai-fast-agent-prism-open-source-library-visualize-agent-traces) | MIT / active-oss | Span-tree with per-span kind badges, SpanCard raw payloads, token+cost chips, uniform data-adapter interface; ship-only-what-serves-the-workflow discipline (12 built, 4 shipped). Adopted as Trace-tab design reference. | B2 B5 B6 B8 |
| Langfuse | oss-trace-ui | https://github.com/langfuse/langfuse | MIT core (/ee enterprise; GitHub NOASSERTION) / production | Hierarchy-wide model/token/cost rollups; shareable trace links; prompt versioning with rollback | B2 B6 B7 |
| Arize Phoenix | oss-trace-ui | https://github.com/Arize-ai/phoenix | Elastic v2 (NOASSERTION — verify before code reuse) / production | Tabbed span detail (formatted vs raw), latency waterfall, cumulative subtree token/cost, OpenInference span-kind color coding | B2 B6 |
| Helicone | oss-trace-ui | https://github.com/Helicone/helicone | Apache-2.0 / production | Hierarchical session paths grouping multi-step runs; failed requests keep provider error body visible | B2 B5 B6 |
| AgentOps | oss-trace-ui | https://github.com/AgentOps-AI/agentops | MIT / active-oss | Session waterfall with color-banded event lanes; time-travel session replay reconstructing agent state at any step | B2 B6 B7 |
| OpenLIT | oss-trace-ui | https://github.com/openlit/openlit | Apache-2.0 / active-oss | Purest OTel GenAI semconv UI — panels render straight from gen_ai.* attributes; separate exceptions tab | B2 B5 |
| Opik (Comet) | oss-trace-ui | https://github.com/comet-ml/opik | Apache-2.0 / production | Inline eval verdicts stamped on trace rows (trace + quality receipt in one row); threads view for multi-turn runs | B2 B5 B6 |
| OpenLLMetry (Traceloop) | pattern-library | https://github.com/traceloop/openllmetry | Apache-2.0 / active-oss | gen_ai.* span vocabulary (execute_tool child spans, token usage metrics, content-capture opt-in) — emit once, render everywhere | B1 B2 B8 |
| assistant-ui | oss-agent-ui-kit | https://github.com/assistant-ui/assistant-ui | MIT / active-oss | makeAssistantToolUI typed tool components with args-before/result-after and human-approval pause variant | B1 B3 B6 B8 |
| Vercel AI Elements | oss-agent-ui-kit | https://github.com/vercel/ai-elements | NOASSERTION (shadcn-registry source; check LICENSE before wholesale copy) / active-oss | Tool state-machine status chips; Reasoning collapsible with streamed-open/done-closed + duration; Context token-usage component | B2 B5 B6 |
| CopilotKit | oss-agent-ui-kit | https://github.com/CopilotKit/CopilotKit | MIT / production | renderAndWaitForResponse human-in-the-loop; AG-UI typed event stream for canvas-state/agent-belief sync (NodeRoom) | B1 B3 B4 B6 |
| Chainlit | oss-agent-ui-kit | https://github.com/Chainlit/chainlit | Apache-2.0 / active-oss (community-maintained) | @cl.step nested step accordions (type, streamed output, duration); AskActionMessage blocking on explicit button consent | B1 B2 B6 |
| Gradio agent chat | oss-agent-ui-kit | https://gradio.app/guides/agents-and-tool-usage | Apache-2.0 / production | metadata-dict honest-progress protocol: pending/done status, nesting via parent_id, duration labels | B5 B6 B8 |
| E2B Fragments | oss-agent-ui-kit | https://github.com/e2b-dev/fragments | Apache-2.0 / active-oss | Stream the spec into view BEFORE execution, then flip to live Preview — NodeSlide deck-generation flow | B3 B6 |
| LlamaIndex chat-ui | oss-agent-ui-kit | https://github.com/run-llama/chat-ui | MIT / active-oss (slower cadence) | Annotation-typed message parts; per-document provenance chips keyed by stable schema (NodeBench citations) | B2 B8 |
| OpenHands | product-reference | https://github.com/OpenHands/OpenHands | NOASSERTION (historically MIT — verify) / production | Confirmation mode + risk-tiered ConfirmRisky; multi-pane workspace making every side-effect visible in a labeled pane | B1 B3 B4 B6 |
| Shape of AI (Emily Campbell) | pattern-library | https://www.shapeof.ai/ | concept/writing | Governors (inspectable plan with pause/override), Footprints (per-claim source chips), Identifiers (mark AI-authored content everywhere) | B1 B2 B3 B4 B5 |
| Smashing — Designing for Agentic AI | design-writing | https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/ | concept/writing | Action ledger + undo pairing: append-only record of every agent action, each entry with a visible undo affordance; trust as auditable infrastructure | B1 B2 B3 B7 |
| NN/g — AI Agents as Users | design-writing | https://www.nngroup.com/articles/ai-agents-as-users/ | concept/writing | Dual-audience design; per-screen audit: can an agent complete this from the a11y tree alone? | B8 |
| NN/g — The UX Reckoning | design-writing | https://www.nngroup.com/articles/ux-reset-2025/ | concept/writing | Constraint-first delegation UI: declared boundaries before run, outcomes reported against them | B1 B4 |
| Anthropic — Building Effective AI Agents | design-writing | https://www.anthropic.com/engineering/building-effective-agents | concept/writing | Human checkpoints as architecture: every mutating step a reviewable proposal card; failures halt honestly, no stale-belief continuation | B3 B4 B5 |
| Anthropic — Writing Effective Tools | design-writing | https://www.anthropic.com/engineering/writing-tools-for-agents | concept/writing | Tools are the new UX: unambiguous names, token-efficient responses, errors that tell the agent what to do next | B5 B8 |
| Linear — Design for the AI age | design-writing | https://linear.app/now/design-for-the-ai-age | production | Workbench model: agents as assignable teammates in the existing workflow surface, output in the same review/approval flow — no separate AI panel | B3 B4 B6 |
| LukeW — Agent Management Interface Patterns | design-writing | https://lukew.com/ff/entry.asp?2106 | concept/writing | 5-S lifecycle (start/schedule/scrutinize/steer/stop) as IA for an agent-runs inbox: status, scrutinize view, steer affordance, stop control per row | B3 B6 B7 |
| Wattenberger — Why Chatbots Are Not the Future | design-writing | https://wattenberger.com/thoughts/boo-chatbots/ | concept/writing | Bounded affordances over open text boxes: sliders/toggles on named dimensions applying as previewable edits; chat as fallback | B3 B6 |
| Ink & Switch — Malleable Software | design-writing | https://www.inkandswitch.com/essay/malleable-software/ | concept/writing | Gentle slope: every AI change lands as an editable artifact the user owns — visible path from accept to modify to author | B4 B7 |
| Vercel — AI SDK 3.0 Generative UI | design-writing | https://vercel.com/blog/ai-sdk-3-generative-ui | Apache-2.0 / production | Per-tool-invocation state machines: loading → partial → result components; latency rendered as honest staged progress | B5 B6 |
| Agentic UX Patterns | pattern-library | https://agenticuxpatterns.com/ | concept/writing | One-time vs session-scoped vs standing permission as three distinct UI states with different visual weight | B1 B4 |
| Linear — Agents in Linear | product-reference | https://linear.app/docs/agents-in-linear | Proprietary (public docs) / production | Delegation-vs-accountability split (agent = swappable delegate, human stays assignee); agent activity in the same issue timeline | B4 B2 B6 |
| Linear — Agent Interaction SDK | product-reference | https://linear.app/changelog/2025-07-30-agent-interaction-guidelines-and-sdk | Proprietary (public docs) / production | Platform contract for agent status (acknowledged → working → done/error) rendered consistently regardless of vendor | B6 B5 B2 |
| Cursor — Checkpoints | product-reference | https://cursor.com/docs/agent/overview#checkpoints | Proprietary (public docs) / production | Checkpoint per agent turn anchored to the chat message; restore resets all files then continue; explicitly not-git so undo is cheap | B7 B3 |
| Cursor — diff review + Find Issues | product-reference | https://cursor.com/learn/reviewing-testing | Proprietary (public docs) / production | Live diff hunks with mid-run Stop; agent self-review pass over its own diff before accept | B3 B6 B5 |
| GitHub Copilot coding agent | product-reference | https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents | Proprietary (public docs) / production | Commits co-authored + linked to session logs (monologue, tools, tokens); draft-PR propose-before-merge posture | B2 B3 B4 B6 |
| Devin — multi-pane workspace | product-reference | https://docs.devin.ai/get-started/devin-intro | Proprietary (public docs) / production | Take-over mechanic: shared workspace, two operators, no state-hiding mode switch; all actions watchable live | B6 B4 B3 |
| Replit Agent — effort-based checkpoints | product-reference | https://replit.com/blog/effort-based-pricing | Proprietary (public docs) / production | Checkpoint = work unit with visible dollar cost next to its rollback affordance (rollback mechanics documented at docs.replit.com, not this post) | B2 B7 B6 |
| v0 — versions | product-reference | https://v0.app/docs/versions | Proprietary (public docs) / production | Version boundary = AI generation event; restore mints a new head version — non-destructive, audited restore | B7 B2 |
| Notion AI — suggested edits | product-reference | https://www.notion.com/help/suggested-edits | Proprietary (public docs) / production | Pending suggestion layer with per-edit check/x + whole-response Accept/Discard/Try-again | B3 B4 B7 |
| Figma Make — point-and-edit | product-reference | https://help.figma.com/hc/en-us/articles/31304485164695-Create-and-edit-a-Figma-Make-file | Proprietary (public docs) / production | Click-the-element write scoping; direct-manipulation for simple properties; auto-version per AI edit with preview-without-committing | B4 B3 B7 |
| Perplexity — streaming citations | product-reference | https://docs.perplexity.ai/docs/cookbook/articles/streaming-citations/README | Proprietary (public docs) / production | Claim-level numbered chips with hover source cards, attached during streaming | B2 B6 |
| ChatGPT — Canvas versions | product-reference | https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it | Proprietary (public docs) / production | In-artifact back/forward version stepper + change-highlighting; documented overwrite failure mode to avoid | B7 B3 |
| Claude Code — permissions | product-reference | https://code.claude.com/docs/en/permissions | Proprietary (public docs) / production | Tiered allow/ask/deny table in a diffable settings file; per-action prompt shows the exact mutation | B1 B4 B3 |
| Claude in Chrome — read/write split | product-reference | https://code.claude.com/docs/en/chrome | Proprietary (public docs) / production | Per-action-class consent (reads silent, writes prompted) + per-origin first-contact approval | B1 B4 B6 |

---

## Gaps

- **B1 (consent/egress):** No OSS reference implements a full consent UI — coverage is writing (Shape of AI, Agentic UX Patterns) + proprietary docs (Claude Code/Chrome). Missing: an inspectable open-source consent/egress surface (per-action opt-in with provider+model named pre-egress) with real screenshots/source.
- **B4 (scope boundaries):** All strong references are proprietary product docs. Missing: OSS code implementing a declared read/write scope surface (an enforceable "AI may read X, write Y" panel), especially for a canvas/spatial editor.
- **B7 (recoverability):** Strong product coverage, weak OSS: no open-source version-ledger/undo component library for document or canvas state after AI edits (AgentOps time-travel is trace replay, not app-state restore).
- **B8 (agent operability):** Only writing + indirect patterns. Missing: a concrete published a11y-tree-driven test harness or agent-drivability benchmark (something like "Haiku completes the flow from the accessibility tree alone" as reusable tooling — SKILL §9 is currently the only implementation).
- **B3 (propose-before-mutate) for spatial surfaces:** Existing refs are chat/code/doc-centric (diff hunks, suggestion layers). Missing: a reference for visual before/after diff review on a canvas/slide surface — the exact NodeSlide need.
