---
name: agentic-ui-qa
description: Universal QA + dogfooding protocol for agentic application UIs (worked profiles included for NodeBench AI, NodeRoom Live, NodeSlide/parity-studio; template for any app). Use when asked to QA, dogfood, verify, regression-test, or "revamp the agent UI" of ANY app — it drives the UI end to end as personas, verifies every claim with artifacts, scores the app against the Agentic UI Bar, and runs the bounded fix-revamp loop. Agent- and model-agnostic — a literal floor any small model can execute, an additive ceiling that scales with stronger models.
---

# Agentic UI QA & Dogfood Protocol (universal core)

Mission: drive a real product UI end to end the way users and AGENTS will, verify every
claim with an artifact, root-cause every failure, score the app against the Agentic UI
Bar, and revamp the lowest-scoring dimension — loop until the UI is one any coding agent
(including cheap models) can operate end to end.

This protocol is **agent-agnostic** (Claude Code, Codex, Cursor, Gemini CLI, aider,
OpenHands — anything that can read markdown, run shell commands, and drive a browser or
Playwright) and **model-tier adaptive**:

**Capability contract**
- **FLOOR (small/cheap models):** execute this file LITERALLY. Numbered steps, exact
  commands, machine-checkable signals. Do not improvise beyond it; when blocked, use the
  STOP rule. If you cannot view images, rely on pixels.cjs machine checks (asserts,
  mojibake, overflow, console errors, exit codes) and state that limitation in the report.
- **CEILING (powerful models):** everything here is your floor, not your cap. ADD on top:
  (a) extend A6 with adversarial variations the journeys don't list — then contribute the
  good ones back to the profile; (b) root-cause findings all the way to the mechanism and
  propose the smallest real fix, not a triage note; (c) design the revamp for the lowest
  Bar dimension against REFERENCES.md, with 2–3 scored options; (d) parallelize
  independent journeys when your harness supports it; (e) critique the rendered pixels as
  a designer, not just a checker; (f) after the pass, improve THIS skill/profile with what
  you learned (new traps, sharper VERIFYs) — the protocol should compound with every run.
- **Invariants that never scale away, at any tier:** no artifact no claim · fail closed ·
  provenance is ground truth · scope discipline · never print secrets. A stronger model
  earns wider action, never looser honesty.

## 0. Resolve the app profile FIRST

1. Identify the target app (user said it, or infer from cwd / URL).
2. Load its profile: `profiles/<app>.md` next to this file. Known profiles:
   `parity-studio-nodeslide.md`, `noderoom.md`, `nodebench.md`.
3. **No profile? Create one before QA-ing** — copy `profiles/TEMPLATE.md`, fill it by
   scouting the repo READ-ONLY (package.json scripts, README/docs for prod URL + auth,
   src layout for surfaces, deps for playwright). A QA pass without a profile produces
   unanchored claims; the profile IS the anchor.
4. The profile supplies: prod/dev URLs, auth path, gates, journeys, app-specific traps,
   live signals. This core file supplies everything app-agnostic.

## 1. Ground rules (non-negotiable, all apps)

1. **No artifact, no claim.** "It works" requires a PNG you rendered THIS session, a DOM
   signal you grepped, or a gate exit code you ran. Build logs, pushes, old reports: not evidence.
2. **The app's provenance surface is ground truth** for AI-path claims (trace/receipt/
   activity log — the profile names it). Never claim "the live model ran" from UI vibes;
   demand model id + nonzero cost/tokens + a receipt/digest.
3. **Fail closed.** Ambiguous evidence → report AMBIGUOUS with the artifact. Never round up.
4. **STOP rule:** same step fails twice → capture evidence, mark the journey BLOCKED,
   move on. Never loop more than twice.
5. **Scope discipline:** fixes touch only files your finding names; re-run gates after;
   never commit unless asked.
6. **Never print secrets** (access codes, API keys) into reports — name the env var, not the value.

## 2. Tool decision tree (in order)

1. **Text/state assertions** → your agent's browser tools: accessibility tree if you have
   one (e.g. `read_page`), else JS eval through any browser bridge (MCP, CDP, Playwright)
   — `document.body.innerText`, `input:checked`, `document.characterSet`, computed styles.
   No browser tools at all? Drive everything through scripts/pixels.cjs (clicks + asserts).
2. **Pixel proof** → `node scripts/pixels.cjs <config.json>` (this skill's folder), then
   **view the PNG with your agent's image input and actually look**. If your model cannot
   view images, use pixels.cjs machine checks (asserts/mojibake/overflow/console/exit code)
   and say so in the report. NEVER depend on in-app browser screenshot actions (trap U1).
   pixels.cjs needs a `repo` field (any repo with playwright installed) — see its header.
3. **Prod-is-live proof** → `node scripts/live-signal.mjs <url> <signal>...` (raw-HTML grep;
   trap U9 for the SPA-shell caveat).
4. **Code gates** → the profile's typecheck/test commands, from the app's repo root; paste exit lines.

## 3. Universal journey archetypes

The profile maps these to concrete steps (the NodeSlide profile's J0–J6 is the reference
implementation). Every app runs the same archetypes:

- **A0 Smoke** (first-time visitor): prod live-signal → first-run surface → main shell
  renders (all primary panels/tabs) → light+dark pixels → one core read-only interaction.
- **A1 Core creation** (cautious user, most private path): create the app's primary
  artifact WITHOUT AI egress; verify honest provenance of the private path.
- **A2 Live AI action** (technical evaluator) — THE HERO: consent/opt-in → a real model
  acts on real data → proposal is REVIEWABLE before mutation → provenance shows model id,
  cost > 0, tokens, receipt → accept → version/state advances.
- **A3 Provenance audit** (governance reviewer): enumerate the activity/trace surface;
  classify every run LIVE / DEGRADED / FAILED per the profile's signals table; any run
  claiming live attribution with zero cost = P0 dishonesty.
- **A4 Output & sharing** (presenter): export/publish/present/share paths produce real
  artifacts or honest capability warnings; no silent failures.
- **A5 Themes & access** (accessibility auditor): light/dark (per trap U11 the shell may
  need an in-app toggle), 3 viewports, no horizontal overflow, visible focus, reduced motion.
- **A6 Adversarial** (hostile gremlin): empty submits, double-clicks (no double-apply),
  oversized inputs, consent-off AI attempt (egress without consent = P0), mid-operation
  reload recovery.

## 4. The Agentic UI Bar (score 0–2 each; the revamp target list)

After the journeys, score the app. 0 = absent/dishonest · 1 = present but weak · 2 = strong.
The LOWEST dimensions become the next revamp targets — that is the "revamp until best" loop.

| # | Dimension | 2 looks like |
|---|---|---|
| B1 | Consent & egress honesty | private-by-default; per-action opt-in; egress named (provider+model) before it happens |
| B2 | Attribution & provenance | every AI action shows model id, cost, tokens, and a verifiable receipt/digest |
| B3 | Propose-before-mutate | AI changes land as reviewable diffs (compare/accept/decline); nothing silent |
| B4 | Scope boundaries | what AI may READ vs WRITE is explicit, inspectable, enforced |
| B5 | Honest degrade | fallback/timeout/failure states are labeled and visually distinct; never a fake success |
| B6 | Status & latency feel | immediate echo, staged honest progress, honest timeout; no fake spinners |
| B7 | Recoverability | versions/undo/restore exist and work after AI actions |
| B8 | Agent operability | a cheap model can drive it: stable labels/aria, deterministic selectors, no hidden-hover-only paths, keyboard-complete |
| B9 | Visual craft | reads as designed tooling, not AI slop: real hierarchy, one signature element, disciplined color (hue classifies, never decorates), mono for data, both themes actually work — judged on RENDERED PIXELS |
| B10 | Conversation & content quality | agent chat/copy earns trust: verdict-first responses, tool-calls visible, honest error voice (cause + next step), sources marked or flagged `[source needed]`, no sycophancy, formatting disciplined |
| B11 | First-run & progressive disclosure | the landing presents the user's PRIMARY intent (one dominant composer / clear first action), not the app's machinery; complexity reveals progressively — navigator, canvas, inspector, validation, trace appear only AFTER creation begins; clean canonical + public routes; NO leaked debug/QA/legacy query params (`?qa=`, `?domain=`, `?deck=…`) or auto-loaded internal state; an example is an explicit suggestion, not an auto-opened workspace |

B8 is the meta-dimension this whole skill exists for: if a Haiku-class agent cannot
complete A0–A2 from the profile alone, B8 < 2 and the friction list is the revamp spec.
B9 requires viewing rendered PNGs — a model without image input must score B9 as
DEFERRED(no-vision) and hand it to a vision-capable pass, never guess it from the DOM.
When a Bar dimension scores low, `REVAMP.md` (next to this file) is the playbook that
takes it from finding → redesign → implemented fix — surface by surface (trace UI, agent
chat, proposal review, status/latency, layout, content).

**B9 has a measured, driven subsystem: `PRETTIFY.md`.** Instead of a one-line vibe, run
`node scripts/prettify-audit.mjs <url|config.json>` to explode B9 into the VISUAL RUBRIC
V1–V9 (type-scale, spacing/grid, color/token, hierarchy, contrast, radius/shadow,
alignment, state polish, motion) with machine signals + offending selectors, then run the
PRETTIFY LOOP (audit → presentation-only candidates → vision-judge → apply → re-audit +
pixel-verify + **re-run B1–B10 for zero regression**). Prettify is presentation-only and
ADDITIVE to trust — beauty that costs trust/operability is a P0, not an improvement.

**B11 is the acquisition dimension** — agentic apps chronically fail it because the team
lives in the editor/proof surfaces and lets them leak onto the landing (auto-loaded
workspace, inspector open on a trace, QA/legacy query params in the URL). ChatGPT/Claude
are the reference: blank calm surface → one dominant composer → model/web/file controls
inside the composer → recents/templates as secondary → the full editor/inspector/trace
only after creation begins. **Test B11 as a NET-NEW visitor:** clear site storage + open
the CANONICAL root (no query params) and assert — (1) the first paint is an intent-first
composer, not a workspace/editor dump; (2) navigator/canvas/inspector are NOT mounted
pre-creation; (3) no `?qa=`/`?domain=`/`?deck=` or other internal params appear in the
URL; (4) examples are suggestions, not auto-opened state; (5) public routes
(`/share/*`, `/present/*`) are clean. Leaked proof machinery on the landing is a P1: the
proof is excellent once requested, but it must not be the first impression. Fix via
`REVAMP.md` S7.

## 5. Universal traps (check BEFORE debugging; profile adds app-specific ones)

- **U1 Screenshot freeze.** In-app browser/CDP screenshots can hang 30s+ (worse with GIF
  recording). The DOM is fine — stop recordings, use pixels.cjs, drive via a11y tree/JS.
- **U2 Stale refs.** `ref_N` handles die on tab/dialog/layout changes. Re-read_page after
  ANY panel change.
- **U3 Consent resets by design.** Per-action consent (radio + checkbox) reverts after
  each accepted action. Re-arm and VERIFY via JS (`:checked`) before every AI call.
- **U4 Collapsed disclosures swallow clicks.** Controls inside collapsed sections no-op
  silently. Expand the disclosure first; verify state via JS, not pill text.
- **U5 Charset mojibake.** Fragments without `<meta charset="utf-8">` render `·`→`Â·`,
  `—`→`â€"`. Assert `document.characterSet==='UTF-8'`; grep rendered text for `Â·|â€|Ã`.
- **U6 CSS class collisions.** "Component doesn't render" → check computed `display` and
  grep the app's global/chrome CSS for the class before blaming the component.
- **U7 Concurrent writers.** Other agents may edit the tree mid-pass. Check `git status`
  + file mtimes before gating; re-run gates on the CURRENT tree; never trust an earlier green.
- **U8 Truncated file reads.** Some agent harnesses (hooks, context managers) truncate or
  paginate file reads. If a read comes back suspiciously short, page the file with your
  search tool (grep -n + offset/limit) instead of trusting the truncation.
- **U9 SPA shell trap.** Raw prod HTML may be a ~1KB shell. Raw grep proves presence only;
  absence needs a rendered-DOM assert (pixels.cjs `assert`).
- **U10 First-run gate.** Fresh/headless sessions land on onboarding/login/modal surfaces
  that cover the app. That surface is itself a verify target; the profile says how to pass it.
- **U11 App-controlled theme.** Many shells ignore `prefers-color-scheme` (theme = in-app
  toggle + data attribute). For dark pixels, click the app's toggle; VERIFY the PNG is
  actually dark before trusting it.

## 6. Finding format · 7. Revamp loop · 8. Definition of done

```
FINDING <n> · P0|P1|P2 · <area>
Symptom / Root cause (name the mechanism, not the symptom) / Evidence (paths + strings +
exit codes) / Fix (files, or PROPOSED) / Re-verify (artifact or "pending")
```
P0 = dishonesty (fake success, wrong attribution, consent bypass), crash, core flow dead.
P1 = journey step broken with workaround. P2 = polish/copy/a11y-minor.

**Loop (per finding, max 2 attempts then BLOCKED):** reproduce (artifact) → root-cause →
smallest fix → profile gates → pixel re-verify the exact state → live re-verify if
prod-facing → write the finding block.
**Revamp (per pass):** score the Bar → pick the lowest dimension → design the smallest
change that raises it (consult REFERENCES.md for the target dimension) → implement →
re-run the affected journeys → re-score. Repeat.

**Done when:** every journey PASS/FAIL(refs)/BLOCKED/SKIPPED(reason) · evidence dir maps
1:1 to claims · gates green on current tree (exit lines pasted) · Bar scored with the
next revamp target named · memory written (§9: regression sweep ran at start; add-run +
every finding appended at end) · zero artifact-less claims (re-read and delete any).

## 9. Memory (remember every failure — the corpus only grows)

Each app keeps an append-only QA memory in ITS OWN repo (default `<app-repo>/.qa/memory/`,
overridable via the profile's "Memory dir" row) — runs.jsonl + findings.jsonl, managed by
`node scripts/qa-memory.mjs` (see its header; dependency-free). It is deliberately in the
app repo, not this skill clone: QA history travels with, and stays as private as, the app.

**At pass START (before any new exploration):**
1. `qa-memory.mjs init --dir <memory-dir>` (idempotent), then `regressions` — every
   previously-FIXED P0/P1 is a MANDATORY re-verify step. Re-verify each; on failure append
   the finding again with `status:"regressed"` (never delete the fixed event) and treat it
   as a fresh P0/P1.
2. `open` — prior open findings are your backlog context; do not re-file them as new.

**At pass END:**
3. Every §6 finding block → `add-finding` (the fingerprint dedupes across runs: a KNOWN
   fp means re-discovery, not a new finding — say so in the report).
4. The pass itself → `add-run` with `{executor, journeys:{A0:"PASS",...}, bar:{B1:2,...},
   gates, evidenceDir}`. `history` then shows Bar-score drift across passes — score drift
   must be HONEST (a lower score after a stricter pass is progress, not regression).

**Rules:** ledgers are append-only (state changes = new events, same fp) · never shrink
the regression list · a finding fixed without a re-verify artifact stays "open".

## 10. Validating THIS skill (dogfood the dogfooder)

After material edits to core or profile: cold-run the CHEAPEST model available in your
agent stack (Haiku-class, mini-class, Flash-class) on A0 with ONLY the skill+profile as
input, require its report in §6 format PLUS a "SKILL FRICTION" list, and fold every
friction back in. A skill the cheapest model cannot follow is itself a finding (B8 for
the skill). If you are a powerful model, ALSO do the inverse: after your own pass, list
what you needed that the text didn't give you — that gap goes to the profile too.
(Precedent: this loop already ran once on NodeSlide — a Haiku cold-run PASSED J0 and
surfaced 4 frictions, all folded back in.)
