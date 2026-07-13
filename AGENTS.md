# AGENTS.md — entry point for any coding agent

You are (or are about to act as) a QA + dogfooding agent for an agentic application UI.
This file is the agent-agnostic entry point; it works the same whether you are Claude
Code, Codex, Cursor, Gemini CLI, aider, OpenHands, or a custom harness.

## Your instructions, in order

1. Read `SKILL.md` in this directory — it is the complete protocol. Follow it.
2. Note the **Capability contract** near the top and honestly place yourself:
   - Small/cheap model → execute the protocol LITERALLY. Numbered steps, exact commands,
     STOP rule when blocked. Do not improvise.
   - Powerful model → the protocol is your floor. The contract lists exactly what to ADD
     (adversarial extensions, mechanism-level root-causing, reference-driven revamp
     design, pixel critique, protocol improvements). Honesty invariants never loosen.
3. Resolve the target app's profile per SKILL.md §0 (`profiles/<app>.md`; no profile →
   fill `profiles/TEMPLATE.md` by read-only scouting FIRST).
4. Open the app's QA memory per SKILL.md §9 (`scripts/qa-memory.mjs`, default
   `<app-repo>/.qa/memory/`): run the regression sweep FIRST — every previously-fixed
   P0/P1 is a mandatory re-verify before new exploration.
5. Run the journeys, score the Agentic UI Bar (B1–B8), report findings in the §6 format
   with an evidence file for every claim.
6. Persist at pass end: `add-finding` for every finding (fingerprints dedupe
   re-discoveries) and `add-run` with journeys + Bar scores. The ledger is append-only;
   the regression corpus only grows.
7. Shipping a fix: once a finding's fix is gate-green, `HANDOFF.md` takes it from a §6
   finding to a readable, verified PR (BetterPRHandoff — changelog lanes, verified demo,
   live-DOM "shipped" grep, runtime diagram, QA packet; an independent layer required
   before "shipped"). For a landed REVAMP or a demo deliverable, `PROOF.md` generates the
   narrated before/after clip (FeatureClipStudio) for HANDOFF's verified-demo phase.

## Tool mapping (SKILL.md names capabilities, not vendor tools)

| Capability | If you have it | If you don't |
|---|---|---|
| Browser a11y tree / DOM eval | any MCP/CDP browser bridge | drive `scripts/pixels.cjs` (clicks + DOM asserts) |
| Viewing rendered pixels | your image input on the PNGs | use pixels.cjs machine checks + state the limitation |
| Pixel capture | `scripts/pixels.cjs <config.json>` (Playwright resolved from a `repo`) | required for pixel proof |
| Live-deploy proof | `scripts/live-signal.mjs <url> <signal>` (raw-HTML grep, trap U9) | required before "deployed" |
| B9 visual-craft measurement | `scripts/prettify-audit.mjs <url\|config.json>` → VISUAL RUBRIC V1–V9 signals (advisory, exit 0); then `PRETTIFY.md` loop | no-vision model runs the audit + deterministic fixes, DEFERS the vision-judge |
| Adversarial red-team (journey A6) | `REDTEAM.md` — the typed-attack battery (consent bypass, fake-success, fabricated attribution, scope escape, observed-content injection, silent-mutate), each with a machine PASS condition | run the §3 A6 floor checklist inline; a confirmed break is still a P0 |
| Deploy / done gate | `scripts/qa-gate.mjs <config.json>` (see `GATING.md`) → done/needs-verification/not-done/blocked from the memory ledger; fail-closed when state absent | required before "done"/"deployed" — the loop can't self-close this verdict |
| Verified before/after proof clip | `PROOF.md` (FeatureClipStudio: Playwright → Remotion → ffmpeg → vision-judge) for HANDOFF's verified-demo phase | DOM-check + pixel-verify the honest states manually; a clip hiding the degraded path is a P0 |
| Shell | your exec tool | required — the scripts and gates need it |
| File search when reads truncate | grep/rg with offsets | required fallback (trap U8) |

## Non-negotiables (identical at every capability tier)

No artifact, no claim · fail closed · the app's provenance surface is ground truth for
AI-path claims · never commit unless asked · never print secret VALUES (env var names only).
