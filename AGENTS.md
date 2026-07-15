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
   fill `profiles/TEMPLATE.md` by read-only scouting FIRST). Declare its run mode before
   interaction. An identify/audit/sweep-only request is `READ-ONLY DIAGNOSTIC`: do not
   submit, persist, invoke a live model, mutate production, or deploy.
4. Open the app's QA memory per SKILL.md §9 (`scripts/qa-memory.mjs`, default
   `<app-repo>/.qa/memory/`): run the regression sweep FIRST — every previously-fixed
   P0/P1 is a mandatory re-verify before new exploration.
5. Run the journeys, score the Agentic UI Bar (B1–B11), report findings in the §6 format
   with an evidence file for every claim. Pick exactly one primary improvement mode by
   mechanism: existing UI disappears/merges/defers → `DECLUTTER.md`; missing capability,
   state, route, or layout is added/rebuilt → `REVAMP.md`; rendered structure, visible
   content, behavior, and a11y stay equivalent while only visual tokens change →
   `PRETTIFY.md`. Verify before a second mode.
6. Persist at pass end: `add-finding` for every finding (fingerprints dedupe
   re-discoveries) and `add-run` with journeys + Bar scores. The ledger is append-only;
   the regression corpus only grows.
7. Handoff: once a finding's fix is gate-green, `HANDOFF.md` prepares the review packet and,
   only with publish authority, a PR (BetterPRHandoff — changelog lanes, verified demo,
   live presence/absence proof, runtime diagram, QA packet). An independent deployed layer
   is required before "shipped." For a landed DECLUTTER/REVAMP or demo deliverable,
   `PROOF.md` generates the narrated before/after clip for HANDOFF's verified-demo phase.

## Tool mapping (SKILL.md names capabilities, not vendor tools)

| Capability | If you have it | If you don't |
|---|---|---|
| Browser a11y tree / DOM eval | any MCP/CDP browser bridge | drive `scripts/pixels.cjs` (clicks + DOM asserts) |
| Viewing rendered pixels | your image input on the PNGs | use pixels.cjs machine checks + state the limitation |
| Pixel capture | `scripts/pixels.cjs <config.json>` (Playwright resolved from a `repo`) | required for pixel proof |
| Live-deploy proof | `scripts/live-signal.mjs <url> <signal>` for additive raw presence, or `--rendered-present <ready> --rendered-absent <removed> --stability-ms <bound>` for a removed/merged-away node; use live pixels/a11y/journey proof for DEFER/REPAIR/COMPACT | required before "deployed"; never infer hydrated absence from raw HTML or one early sample |
| B9 visual-craft measurement | `scripts/prettify-audit.mjs <url\|config.json>` → VISUAL RUBRIC V1–V9 signals (advisory, exit 0); then `PRETTIFY.md` loop | no-vision model runs the audit + deterministic fixes, DEFERS the vision-judge |
| Subtractive declutter inventory | `scripts/clutter-audit.mjs <config.json>` → rendered/semantic load, repeated controls, passive regions, clipping, protected-selector inventory; then `DECLUTTER.md` ledger | inventory DOM/a11y manually; never infer usefulness from element count |
| Adversarial red-team (journey A6) | `REDTEAM.md` — the typed-attack battery (consent bypass, fake-success, fabricated attribution, scope escape, observed-content injection, silent-mutate), each with a machine PASS condition | run the §3 A6 floor checklist inline; a confirmed break is still a P0 |
| Deploy / done gate | `scripts/qa-gate.mjs <config.json>` (see `GATING.md`) → done/needs-verification/not-done/blocked from the memory ledger; fail-closed when state absent | required before "done"/"deployed" — the loop can't self-close this verdict |
| Verified before/after proof clip | `PROOF.md` (FeatureClipStudio: Playwright → Remotion → ffmpeg → vision-judge) for HANDOFF's verified-demo phase | DOM-check + pixel-verify the honest states manually; a clip hiding the degraded path is a P0 |
| Shell | your exec tool | required — the scripts and gates need it |
| File search when reads truncate | grep/rg with offsets | required fallback (trap U8) |

## Non-negotiables (identical at every capability tier)

No artifact, no claim · fail closed · the app's provenance surface is ground truth for
AI-path claims · never commit unless asked · never print secret VALUES (env var names only).
