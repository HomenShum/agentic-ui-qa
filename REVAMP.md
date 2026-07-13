# REVAMP.md — from low Bar score to shipped fix

This is the FIX side of the skill. QA (SKILL.md) finds and scores; this file takes a
low-scoring dimension or an ugly surface ("the trace UI looks bad", "the chat feels
dead") through redesign to an implemented, gate-verified change. It encodes a pipeline
that was proven end to end on a production Trace tab — see `examples/trace-revamp/`.

## Capability tiers (same contract as SKILL.md)
- **FLOOR:** you don't design. You apply an existing spec/mockup from `examples/` or one
  a stronger model produced, implement it exactly, run the gates, pixel-verify the named
  states. That alone is a valid revamp contribution.
- **CEILING:** you run the full pipeline below, including multi-direction exploration and
  adversarial judging. Your output must include the mockup AND the implementation spec so
  a floor-tier agent could finish the job without you.

## The pipeline (proven; don't skip steps)

1. **Ground in the real thing.** Read the actual component + its data model/types + the
   app's design tokens. List every data field the UI HIDES today — hidden audit-grade
   fields are usually the biggest win (precedent: a trace UI was hiding context[],
   tokens, digests, validator version — surfacing them was 80% of the redesign).
2. **Gather references.** REFERENCES.md section for the target dimension + any
   app-internal prior art. Adopt as **reference, not dependency** — steal vocabulary
   (token systems, badge discipline, layout patterns), never import a stack mismatch.
3. **Explore 3–4 distinct directions** (ceiling tier). One organizing principle each,
   ASCII wireframe, real copy from real data. Then **adversarially judge**: score
   audit-grade / scannability / taste / data-fidelity / implementability; pick a winner
   and graft the runners-up's best ideas.
4. **Build a self-contained interactive mockup** (single HTML, `<meta charset="utf-8">`
   FIRST line, all CSS/JS inline, no external requests, system fonts + mono stack).
   Bind ONLY to real data-model fields — invent nothing. Render EVERY honest state:
   live / degraded / failed / empty, both themes, working density-or-mode toggles.
5. **Pixel-critique loop.** Render to PNG (scripts/pixels.cjs) → actually LOOK →
   blocker/major/minor issues → fix in place → re-render. A green exit code is not a
   design review; mojibake, dead toggles, and unreachable states hide in pixels.
6. **Write the implementation spec** for the real component: binding table (every UI
   element → exact data field), state-honest matrix, tokens to reuse (the app's own
   variables — no new build layers), what NOT to regress, tests to add. Flag every
   DERIVED value (never fabricate a signer, hash, or status the record doesn't hold).
7. **Implement + gate.** Any coding agent, hard scope (component + its styles + new
   test file only), typecheck + full test suite green, pixel re-verify the named states,
   then SKILL §9 memory: finding→fixed with the re-verify artifact.

## Surface playbooks

### S1 · Trace / provenance UI (B2 B5 B9)
Goal: an audit ledger you'd hand to diligence, not a debug dump.
Checklist: surface every stored audit field (what was read, tokens, cost, receipts/
digests, validator verdict + version) · status-honest states (live=attributed & proud,
fallback=visibly degraded amber + zeroed cost + NO invented hash, failed=issues listed,
"not signable") · mono for every hash/cost/token/model-id · progressive density
(plain-language → operator → full provenance + raw) · one loud terminal proof object,
everything else quiet. Refs: Agent Prism (adopted), Langfuse, Perplexity citations.
Worked example: `examples/trace-revamp/` (mockup + spec — rail + tri-signature seal,
three honest states).

### S2 · Agent chat / copilot UI (B3 B6 B9 B10)
Checklist: roles visually distinct (human ink vs agent ink — two-ink systems work) ·
tool-calls/actions VISIBLE and collapsible, never silent · streaming with staged honest
status, immediate echo of the user's ask · context/scope chips show what the agent can
read vs write · agent output that would MUTATE anything lands as a proposal affordance,
not applied text · empty state teaches the first ask. Refs: assistant-ui, Vercel AI
Elements, CopilotKit, Gradio agent metadata protocol.

### S3 · Proposal / diff review (B3 B7)
Checklist: before/after comparison (side-by-side minimum; slider/overlay for spatial
surfaces) · granular accept/decline · receipt binding (the thing you accept is the exact
validated candidate, digest-bound) · accept visibly bumps a version with restore.
Refs: Cursor review, Notion suggested edits, E2B Fragments. Note: canvas/slide diff
review has NO strong public reference (REFERENCES.md gap) — building a good one is
category-defining, not catch-up.

### S4 · Status & latency feel (B6)
The felt-responsiveness pattern: echo the ask <100ms · escalate label honestly (~900ms:
"Reading context…" → "Drafting…") · hard timeout with an honest message that still
reconciles a late result · NEVER fake progress bars or invented step names · degraded
path is labeled at the moment it happens, not discovered later.

### S5 · Layout / responsiveness (A5 B9)
Viewport matrix from the profile · no horizontal overflow at any tier · panels either
visible or explicitly toggleable (nothing display:none with no path back — check the
app's chrome CSS for class collisions, trap U6) · density belongs to the user, not the
viewport alone.

### S6 · Content & copy (B10)
Agent responses: verdict first, then reasoning · errors state cause + next step in the
product's voice (never bare stack traces, never apologies-as-content) · unverified
figures marked (`[source needed]` pattern — a live model can be INSTRUCTED to do this;
test for it in A2) · labels name user outcomes, not internals · same action = same word
everywhere (Publish button → "Published" toast).

## Non-negotiables at every tier
Bind to real fields; honest states are mandatory in every mockup; both themes; charset
first line; a11y floor (focus visible, reduced motion, contrast at small sizes);
reference-not-dependency; scope discipline on the implementing diff; gates + pixel
re-verify before "done"; memory updated (SKILL §9).
