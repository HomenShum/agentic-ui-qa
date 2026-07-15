# REVAMP.md — from low Bar score to structural-additive fix

This is the FIX side of the skill. QA (SKILL.md) finds and scores; this file takes a
low-scoring dimension or an ugly surface ("the trace UI looks bad", "the chat feels
dead") through redesign to an implemented, gate-verified change. It encodes a pipeline
that was proven end to end on a production Trace tab — see `examples/trace-revamp/`.

**Three modes — pick exactly one primary mode before editing, by mechanism.** Use REVAMP
(this file) only for **structural-additive** work: add a missing capability, honest state,
route, proposal/diff affordance, or information architecture/layout. Use `DECLUTTER.md` for
**structural-subtractive** work: remove, merge, defer, compact, or repair an existing UI
promise without inventing a new user-facing capability. Use `PRETTIFY.md` only when DOM,
visible content, behavior, and the a11y contract remain unchanged and the work is limited to
tokens/spacing/type/color/radius/shadow/motion. These are separate passes, not a blended
checklist. All modes re-run the affected Bar dimensions; beauty or simplicity that costs
trust is P0. A REVAMP that lands a new component may be followed by a separate PRETTIFY pass.

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
5. **Pixel-critique loop.** Render desktop/tablet/mobile × light/dark → actually LOOK →
   blocker/major/minor issues → fix → re-render. A green exit code or zero-overflow assert
   is not a design review; clipped navigation, false hierarchy, dead controls, and dishonest
   state styling hide in pixels.
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
everything else quiet. Refs: Agent Prism, Langfuse, Perplexity citations.
Worked example: `examples/trace-revamp/` (mockup + spec — rail + tri-signature seal,
three honest states).

For durable or high-cardinality runs, the rail is only the summary layer. Apply
`TRACE-WATERFALL.md`: adaptive compact-to-waterfall presentation, OpenTelemetry-grade
hierarchy and time semantics, span-bound citations, virtualization, cursor pagination,
and an expanded observability workspace that does not permanently consume the app canvas.
The collapsed side rail keeps a named Activity/Trace control plus current running/error signal;
the compact summary shows bounded recent activity and an honest hidden count; the full timeline
owns search/filter/grouping and selected-span detail. Moving between all three preserves state.

### S2 · Agent chat / copilot UI (B3 B6 B9 B10)
Checklist: composer/input is the visual hero · model, effort, consent, source, and memory
controls sit at secondary weight without becoming hidden or ambiguous · the preflight and
receipt show the same exact configuration · roles are distinct · tool calls/actions are visible
and collapsible · streaming status comes from real events · scope chips name read vs write ·
persistent memory shows source/time/scope/retention with edit/delete/disable · citations sit by
the claims they support · mutations land as proposals, not applied text. Refs: assistant-ui
Mem0/Artifacts/Generative UI, Vercel AI Elements, CopilotKit, Gradio.

### S3 · Proposal / diff review (B3 B7)
Checklist: before/after comparison (side-by-side minimum; slider/overlay for spatial
surfaces) · granular accept/decline · receipt binding (the thing you accept is the exact
validated candidate, digest-bound) · accept visibly bumps a version with restore.
Refs: Cursor review, Notion suggested edits, E2B Fragments. Note: canvas/slide diff
review has NO strong public reference (REFERENCES.md gap) — building a good one is
category-defining, not catch-up.

### S4 · Status & latency feel (B6)
Echo the ask <100ms, then render only server-observed milestones. Long jobs need durable
queued/running/waiting-for-human/retrying/paused/cancel-requested/canceled/failed/completed
states, a `jobId`, and a timestamped last checkpoint that survives reload. A timeout or stale/
missing event becomes **stalled/reconnecting/unknown** and stops optimistic animation; never
reach 100% before a terminal receipt. Late results reconcile visibly. Never fake bars or stages.

### S5 · Layout / responsiveness (A5 B9)
Artifact desktop/tablet/mobile × light/dark. Navigation overflow must use an intentional,
agent-operable pattern: horizontally scrollable tabs with an edge cue, priority items plus a
labeled More menu, or a drawer — never clipped labels or `display:none` with no path back.
Preserve the active item, focus, order, badges, and reopen path across breakpoints; test touch and
keyboard. Panels are visible or explicitly toggleable, and density remains user-controlled.
No horizontal overflow is a floor signal only; it cannot pass layout without pixel inspection.

### S6 · Content & copy (B10)
Agent responses: verdict first, then reasoning · errors state cause + next step in the
product's voice (never bare stack traces, never apologies-as-content) · unverified
figures marked (`[source needed]` pattern — a live model can be INSTRUCTED to do this;
test for it in A2) · labels name user outcomes, not internals · same action = same word
everywhere (Publish button → "Published" toast).

### S7 · First-run / landing / progressive disclosure (B11 · A0)
Goal: the landing is the user's intent, not the app's machinery. Proof surfaces are excellent
once requested; they are not the first impression.

Checklist: canonical `/` is calm and gives one dominant composer/input the most area, contrast,
and direct language · model, effort, consent, source/upload, and memory controls use secondary
weight inside or adjacent to it, remain keyboard-reachable, and name their exact pre-submit
state · suggestions/recents/templates follow the composer and never auto-open a workspace ·
workspace navigation, artifact surface, inspector, validation, and trace mount only after intent
· canonical and public routes carry no internal fixture/debug state · after creation, the
activity side rail begins compact/collapsed with a visible status and reopen control.

A common root cause is an editor-first root that bootstraps sample/internal state, writes it into
the URL, and opens proof machinery by default. Split home from addressable workspace routes,
lazy-mount the workspace after real intent, and keep public read/present routes clean. Route names
and component boundaries are app-owned; put app-specific prescriptions in its profile.

Machine check: clear storage → open canonical root → assert no internal params, no editor/
inspector containers, exactly one primary composer/input, and named secondary controls. Pixel
check all six viewport/theme states to prove the input remains the hero. Keep B1–B5 intact and
make first creation land as a reviewable proposal; end with PRETTIFY.

### S8 · Subtractive simplification (B8 B9 B11)

Stop this REVAMP pass and use `DECLUTTER.md` when the surface already contains the needed
capability but exposes too much at once. Build the function ledger, mark each underlying
capability guard, assign every rendered instance PRESERVE/REPAIR/DEFER/MERGE/REMOVE, and
protect consent, scope, provenance, honest
states, recovery, navigation, streaming, and export paths before editing. A static snapshot
may nominate a candidate; runtime evidence decides its disposition. End with the same profile
gates, six viewport/theme captures, Bar re-score, and append-only memory closeout.

## Non-negotiables at every tier
Bind to real fields; honest states are mandatory in every mockup; six viewport/theme artifacts; charset
first line; a11y floor (focus visible, reduced motion, contrast at small sizes);
reference-not-dependency; scope discipline on the implementing diff; gates + pixel
re-verify before "done"; memory updated (SKILL §9).
