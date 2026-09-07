# Worked example: Trace-tab revamp (S1 playbook, full pipeline)

The original design case concerned a production deck-editor's Trace tab hiding its
own audit data. This worked example retains that design history and uses local
illustrative trace fixtures; opening it does not run a model or contact a provider:

- `mockup.html` — self-contained interactive mockup (open it in a browser). Toggle
  DEPTH (Human/Pro/Tech), theme (light/dark), and RUN: **A·live** (attributed GLM run,
  fixture cost/tokens, awaiting countersign) / **B·fallback** (honest degrade: dashed amber
  rail break at the exact hop that timed out, $0.000, no invented hash, provisional
  seal) / **C·failed** (red seal, illustrative validation issues, "not signable") /
  **D·running** (incomplete trace) / **E·empty** (no trace).
- `implementation-spec.md` — the engineer-ready spec: field-binding tables, the
  state-honest matrix, fail-closed fallback detection, tokens to reuse, tests, and
  what not to regress.

Pipeline that produced it: ground in the real component + data model → 4 design
directions → adversarial judge → merge winning frame (Agent Prism-inspired provenance
rail; reference, not dependency — Evil Martians, MIT) with the strongest graft (a
tri-signature countersign seal) → pixel-critique loop (a mojibake charset bug and an
unreachable failed-state were caught by LOOKING at rendered PNGs, not the DOM) →
spec → implementation gated on typecheck + full test suite.

The fixture values illustrate fields of the app's AgentTrace/ValidationResult
types. They do not certify a new provider run, cost, approval or durable workflow.

The local controls wrap within the inspector, and expanded receipt content can
wrap at enlarged text sizes. Copy targets retain their full digest: success is
shown only after the browser accepts the write; denied or unavailable access
shows a warning and permits an explicit retry. Source checks alone do not prove
these rendered or native clipboard behaviors.
