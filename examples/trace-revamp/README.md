# Worked example: Trace-tab revamp (S1 playbook, full pipeline)

A production deck-editor's Trace tab was a flat text dump that HID most of its own
audit data. This is the complete REVAMP.md pipeline output that fixed it:

- `mockup.html` — self-contained interactive mockup (open it in a browser). Toggle
  DEPTH (Human/Pro/Tech), theme (light/dark), and RUN: **A·live** (attributed GLM run,
  real cost/tokens, awaiting countersign) / **B·fallback** (honest degrade: dashed amber
  rail break at the exact hop that timed out, $0.000, no invented hash, provisional
  seal) / **C·failed** (red seal, real validation issues, "not signable").
- `implementation-spec.md` — the engineer-ready spec: field-binding tables, the
  state-honest matrix, fail-closed fallback detection, tokens to reuse, tests, and
  what not to regress.

Pipeline that produced it: ground in the real component + data model → 4 design
directions → adversarial judge → merge winning frame (Agent Prism-inspired provenance
rail; reference, not dependency — Evil Martians, MIT) with the strongest graft (a
tri-signature countersign seal) → pixel-critique loop (a mojibake charset bug and an
unreachable failed-state were caught by LOOKING at rendered PNGs, not the DOM) →
spec → implementation gated on typecheck + full test suite.

Every value shown binds to a real field of the app's AgentTrace/ValidationResult
types. Nothing is invented — that's the point.
