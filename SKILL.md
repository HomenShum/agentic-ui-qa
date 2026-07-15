---
name: agentic-ui-qa
description: Universal QA + dogfooding protocol for agentic application UIs, with worked profiles and a template for any app. Use when asked to QA, dogfood, verify, or regression-test an agentic UI, or explicitly improve one by revamping, decluttering, simplifying, calming, polishing, prettifying, or removing dead/no-op UI. It drives persona journeys, artifact-backed verification, the Agentic UI Bar, and bounded structural-additive, structural-subtractive, and presentation-only loops. Agent- and model-agnostic.
---

# Agentic UI QA & Dogfood Protocol (universal core)

Mission: drive a real product UI end to end the way users and AGENTS will, verify every
claim with an artifact, root-cause every failure, score the app against the Agentic UI
Bar, and improve the lowest-scoring dimension — loop until the UI is one any coding agent
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

## Platform & lifecycle (where this skill sits)

This core file is the RUNNER. Around it, modules cover fix modes and lifecycle phases (full map in
`PLATFORM.md`):
- **`PLATFORM.md`** — where the Bar nests (the agent-era-maturity-model rubric it instances)
  and the platform chain that surrounds it.
- **`REDTEAM.md`** — attack: journey A6 as a real adversarial battery, not a checklist.
- **`BAR-DEFAULTS.md`** — prevent: day-one conventions so a NEW app is born scoring high.
- **`DECLUTTER.md`** — subtract: remove/merge/defer/repair UI promises without deleting
  consent, provenance, honest states, recovery, or unique capabilities.
- **`GATING.md`** (auto-gate, runs `scripts/qa-gate.mjs`) — the out-of-process verdict the
  loop cannot self-close.
- **`HANDOFF.md`** — hand off: prepare a gate-green review packet; publish a PR only with
  authority, and call it shipped only after deployed proof.
- **`PROOF.md`** — prove: the narrated before/after verified-demo clip.
- **`TASTE.md`** — calibrate/learn: taste memory + learning adapters over the QA ledger.

## 0. Resolve the app profile FIRST

1. Identify the target app (user said it, or infer from cwd / URL).
2. Load its profile: `profiles/<app>.md` next to this file. Known profiles:
   production-target profiles include `parity-studio-nodeslide.md`, `noderoom.md`, and
   `nodebench.md`; each profile states whether it is validated, scouted, local, or pending.
3. **No profile? Create one before QA-ing** — copy `profiles/TEMPLATE.md`, fill it by
   scouting the repo READ-ONLY (package.json scripts, README/docs for prod URL + auth,
   src layout for surfaces, deps for playwright). A QA pass without a profile produces
   unanchored claims; the profile IS the anchor.
4. The profile supplies: prod/dev URLs, auth path, gates, journeys, app-specific traps,
   live signals. This core file supplies everything app-agnostic.
5. Declare the run mode from the profile before interacting: **READ-ONLY DIAGNOSTIC**,
   **SANDBOX DOGFOOD**, or **AUTHORIZED PRODUCTION**. A sweep/audit/identify-only request is
   READ-ONLY DIAGNOSTIC: inspect DOM/a11y/pixels/network, but do not submit, toggle persistent
   state, accept proposals, call a live model, write data, or deploy. Mark mutation-dependent
   journeys `SKIPPED(read-only diagnostic)`; do not manufacture a production test. Diagnostic
   authority also does not authorize source edits: report the spec/finding and stop unless the
   user separately asked to change or build the app.

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
7. **No gaming the Bar.** A dimension is met only by held-out, honest evidence the app
   cannot manufacture about itself — never by a signal the app emits (a hardcoded
   "verified" badge, a spinner with no run behind it, a testid pinned to a fake state). If
   an app could pass a Bar dim by printing the right string, that dim is UNMET: score what
   the artifact proves, not what the UI asserts. (Solo-founder rule: an app must not be
   able to GAME its own scorecard — scores are held-out and honest.)
8. **Capability-honest labeling.** A control or label must not imply a capability the app
   lacks. A "Web" toggle that only toggles model egress (not search/retrieval) is a B1/B2
   dishonesty finding — label it for what it actually does ("External model · <provider>"),
   not for a capability the runtime never performs. Verify the claim against the network tab,
   not the label text (see trap U12).
9. **Mode semantics before dedupe.** Two controls with the same label are not duplicates
   until their handlers, state keys, network effects, and resulting provenance are equivalent.
   In particular, a view mode (compact/full, summary/detail) changes presentation while a
   runtime mode (fast/deep, provider/effort/tool policy) changes execution. Preserve both or
   rename the ambiguous one; never merge them from screenshot/text similarity alone.

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
3. **Declutter inventory (only for structural subtraction)** → `node scripts/clutter-audit.mjs <config.json>` for rendered
   elements, semantic units, repeated controls, exposed clusters, passive/empty regions,
   clipping, and protected-selector checks. It emits candidates, never usefulness verdicts;
   complete the function ledger and runtime trace in `DECLUTTER.md` before deleting.
4. **Prod-is-live proof** → use `node scripts/live-signal.mjs <url> <signal>...` for an
   additive raw-response presence signal. For a removed/merged-away node, pair
   `--rendered-present <ready>` with `--rendered-absent <removed> --stability-ms <bound>`;
   raw HTML or a single early sample cannot prove hydrated absence (trap U9). DEFER/REPAIR/COMPACT need their disposition-specific live
   pixels/a11y/journey assertion from `HANDOFF.md`, not a forced absence.
5. **Code gates** → the profile's typecheck/test commands, from the app's repo root; paste exit lines.

## 3. Universal journey archetypes

The profile maps these to concrete steps (the NodeSlide profile's J0–J6 is the reference
implementation). Every app runs the same archetypes:

- **A0 Smoke** (first-time visitor): prod live-signal → first-run surface → after explicit
  start/open, the main shell renders its primary reachable surfaces → light+dark pixels →
  one core read-only interaction.
- **A1 Core creation** (cautious user, most private path): create the app's primary
  artifact WITHOUT AI egress; verify honest provenance of the private path.
- **A2 Live AI action** (technical evaluator) — THE HERO: an exact consent preflight names
  the provider/model and, when applicable, effort, egress, sources, memory use, and write
  scope → a real model acts on real data → the proposal is REVIEWABLE before mutation →
  the persisted receipt echoes what was actually used (model, cost > 0, tokens, consent,
  sources) → accept → version/state advances. Preflight/receipt mismatch = P0.
- **A3 Provenance audit** (governance reviewer): inspect both the collapsed activity rail
  and expanded trace; classify every run LIVE / DEGRADED / FAILED per the profile's signals
  table. Require server-timestamped OpenTelemetry-grade spans and exact span-bound sources;
  live attribution with zero cost = P0. Apply `TRACE-WATERFALL.md` above 12 operations.
  Exercise 4, 10, 100, and one hundreds-of-records fixture across summary/full views; at
  scale verify virtualization, search, filtering, grouping, subtree collapse, minimap
  fidelity, and cursor pagination rather than trusting a screenshot.
- **A4 Output & sharing** (presenter): export/publish/present/share paths produce real
  artifacts or honest capability warnings; no silent failures.
- **A5 Themes & access** (accessibility auditor): render desktop/tablet/mobile × light/dark
  (six named pixel artifacts; per trap U11 the shell may need an in-app toggle), visible
  focus, reduced motion, and a responsive nav overflow pattern that keeps the active item
  and every action reachable. Zero horizontal overflow is necessary, never sufficient proof.
- **A6 Adversarial** (hostile gremlin): empty submits, double-clicks (no double-apply),
  oversized inputs, consent-off AI attempt (egress without consent = P0), mid-operation
  reload recovery. **This list is the floor.** For a real red-team pass, run `REDTEAM.md`
  (next to this file) — the adversarial BATTERY that fires typed attacks (consent bypass,
  forced fake-success, fabricated attribution, scope escape, injection via observed content,
  silent-mutate) each with a machine-checkable PASS condition, judged by the deterministic/
  LLM/manual three-tier design; any confirmed break files a P0 (§9).
- **A7 Agentic depth** (durable tool-user) — run only where `DEPTH.md` applies. Probe a REAL
  iterative tool loop (distinct receipts + repair, not one completion), per-claim web/data
  lineage, and durable server jobs whose honest states include queued/running/waiting,
  retrying/paused, canceled/failed/completed. Reload must resume by `jobId` from timestamped
  server checkpoints; missing or stale events render unknown/stalled, never optimistic
  progress. Persistent memory is visible and controllable (source, captured/last-used time,
  scope/retention, edit/delete/disable), conversation survives reload, and every output-quality
  finding carries evidence. Every A7 signal is VISIBLE and agent-checkable; score D1–D11.

## 4. The Agentic UI Bar (score 0–2 each; the improvement target list)

After the journeys, score the app. 0 = absent/dishonest · 1 = present but weak · 2 = strong.
The LOWEST dimensions become the next improvement targets — that is the "improve until best" loop.

| # | Dimension | 2 looks like |
|---|---|---|
| B1 | Consent & egress honesty | private-by-default; exact per-action preflight names provider/model plus applicable effort, sources, memory, and write scope; receipt matches |
| B2 | Attribution & provenance | every AI action shows model/cost/tokens, timestamped spans, exact source lineage, and a verifiable receipt/digest |
| B3 | Propose-before-mutate | AI changes land as reviewable diffs (compare/accept/decline); nothing silent |
| B4 | Scope boundaries | what AI may READ vs WRITE is explicit, inspectable, enforced |
| B5 | Honest degrade | fallback/timeout/failure/unknown states are labeled and visually distinct; uncertainty fails closed |
| B6 | Status & latency feel | immediate echo plus durable server-derived states/checkpoints; stale progress stops honestly; no fake spinners |
| B7 | Recoverability | versions/undo/restore exist and work after AI actions |
| B8 | Agent operability | a cheap model can drive it: stable labels/aria, deterministic selectors, no hidden-hover-only paths, keyboard-complete |
| B9 | Visual craft | reads as designed tooling, not AI slop: real hierarchy, one signature element, disciplined color (hue classifies, never decorates), mono for data, both themes actually work — judged on RENDERED PIXELS |
| B10 | Conversation & content quality | verdict-first responses; visible tool calls; cause + next step errors; claim-adjacent citations or `[source needed]`; no sycophancy |
| B11 | First-run & progressive disclosure | one composer/input is the hero; model/effort/consent/source controls are secondary but reachable; workspace, activity rail, and proof surfaces reveal only after intent |

**Prevent, not just detect:** `BAR-DEFAULTS.md` (next to this file) is the shift-left
companion — the day-one conventions (egress gate, receipt-only provenance, proposal-only
writes, testid/aria contract, clean-route scaffold, CI `ui_ux_qa` gate) that make a NEW
app score 2 on B1–B11 from its first commit, each mapped to the dim it pre-satisfies.
`PLATFORM.md` maps where this Bar nests (the agent-era-maturity-model rubric it instances)
and the platform chain around it (adversary, taste-judge, auto-gate, ship-and-prove).

B8 is the meta-dimension this whole skill exists for: if a Haiku-class agent cannot
complete A0–A2 from the profile alone, B8 < 2 and the friction list is the improvement spec.
B9 requires viewing rendered PNGs — a model without image input must score B9 as
DEFERRED(no-vision) and hand it to a vision-capable pass, never guess it from the DOM.
Passing an overflow assertion alone cannot earn B8, B9, or A5: inspect the six rendered
viewport/theme states for hierarchy, reachability, clipping, legibility, and honest status.
When a Bar dimension scores low, choose **exactly one primary fix mode by mechanism**:

| Mechanism | Primary mode | Contract |
|---|---|---|
| Existing UI promises should disappear, merge, defer, compact, or be repaired in place | `DECLUTTER.md` | structure may shrink; protected trust/capability/reachability contract cannot |
| A capability, honest state, route, proposal affordance, or information architecture/layout is missing | `REVAMP.md` | structural-additive redesign with new behavior/content explicitly verified |
| Structure, visible content, behavior, and a11y stay equivalent; only visual tokens change | `PRETTIFY.md` | presentation-only DOM/content/a11y contract unchanged |

Do not blend modes inside one pass. Finish and verify the primary mode, then start a separate
pass if the result needs another mechanism (for example, REVAMP followed by PRETTIFY).

**B9 has a measured, driven subsystem: `PRETTIFY.md`.** Instead of a one-line vibe, run
`node scripts/prettify-audit.mjs <url|config.json>` to explode B9 into the VISUAL RUBRIC
V1–V9 (type-scale, spacing/grid, color/token, hierarchy, contrast, radius/shadow,
alignment, state polish, motion) with machine signals + offending selectors, then run the
PRETTIFY LOOP (audit → presentation-only candidates → vision-judge → apply → re-audit +
pixel-verify + **re-run B1–B11 for zero regression**). Prettify is presentation-only and
ADDITIVE to trust — beauty that costs trust/operability is a P0, not an improvement.

**B11 is the acquisition dimension** — agentic apps chronically leak editor/proof machinery
onto the landing. The reference shape is calm surface → one dominant composer/input →
model, effort, consent, and source controls at secondary visual weight → suggestions/recents
after that → workspace, activity, and trace only after intent. **Test as a NET-NEW visitor:**
clear storage + open the canonical root and assert (1) the composer/input is the visual hero;
(2) secondary controls remain named, keyboard-reachable, and exact before submit; (3) editor/
inspector containers are absent pre-creation; (4) no internal fixture/debug params or
auto-loaded workspace appear; (5) examples are suggestions; (6) public routes are clean.
After creation, the activity side rail starts compact/collapsed but visibly reachable. Leaked
proof machinery on the landing is P1. Use `DECLUTTER.md` when the fix is subtractive; use
`REVAMP.md` S7 when the route or information architecture must be rebuilt.

## 4b. The Agentic DEPTH tier (D1–D11, conditional)

The Bar (B1–B11) scores whether the UI is **trustworthy and operable**. `DEPTH.md` (next to
this file) adds an orthogonal second tier scoring whether the thing UNDER that UI is a
**durable, grounded, governed agent PRODUCT**: **D1** agentic runtime depth · **D2** grounded
web research + claim lineage · **D3** durable execution + recovery · **D4** claim-level data
lineage · **D5** uploaded-data safety + privacy lifecycle · **D6** conversation + durable
memory · **D7** dynamic model routing · **D8** document ingestion breadth · **D9**
collaboration + governance · **D10** output semantic quality · **D11** repeat-user workflow +
retention. Same 0/1/2 scale + the same invariants (no artifact no claim; VISIBLE
agent-checkable signal, never an invisible "the LLM did it"; capability-honest labeling).
**DEPTH is CONDITIONAL** — it applies only to data-grounded / document-producing /
multi-model / long-running agentic apps; a simple stateless to-do bot legitimately skips most
dims (score them `N/A`, not `0`). The two tiers are **orthogonal**: an app can score **22/22
on B and near-0 on D** — a beautiful, honest, well-gated UI over a shallow, single-shot agent.
B raises the level of the surface; D raises the level of the product. Run it via journey A7;
score with `DEPTH.md`.

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
- **U12 Label-implies-capability lie.** A control's TEXT is not proof of what it does. A "Web"
  / "browse" / "search" toggle may only toggle model egress with no retrieval behind it; a
  "Roles" or "spend cap" control may be UI the server never enforces. Don't trust the label —
  verify the capability against the network tab (an actual retrieval/fetch request), the
  server-enforcement path, or the provenance surface. A label that implies a capability the
  runtime lacks is a B1/B2 dishonesty finding (§1 rule 8), not a copy nit. (Extends into the
  D-tier as capability-honest labeling — `DEPTH.md`.)
- **U13 Element-count cargo cult.** A smaller DOM can be a worse product when it deletes the
  only route, hides consent/provenance/error recovery, or moves real controls beyond keyboard
  reach. Treat clutter counts as descriptive deltas only. A repeated label is only a candidate:
  distinguish view-mode state from runtime-mode semantics via handlers/state/network effects.
  Freeze the protected contract and prove task reachability before and after; use
  `DECLUTTER.md` rather than optimizing a score.

## 6. Finding format · 7. Improvement loop · 8. Definition of done

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
**Improve (per pass):** score the Bar → pick the lowest dimension → choose exactly one of
DECLUTTER, REVAMP, or PRETTIFY by mechanism → make the smallest change that raises it → re-run the
affected journeys → re-score. Repeat. A lower element count without protected-contract
and task-path evidence is not an improvement.

**Done when:** every journey PASS/FAIL(refs)/BLOCKED/SKIPPED(reason) · evidence dir maps
1:1 to claims · gates green on current tree (exit lines pasted) · Bar scored with the
next improvement target named · memory written (§9: regression sweep ran at start; add-run +
every finding appended at end) · zero artifact-less claims (re-read and delete any).

**Handing off a fix:** once a finding's fix is implemented and gate-green, use `HANDOFF.md`
to prepare its review packet and, only when publication is authorized, a readable, verified
PR. The BetterPRHandoff phases (per-surface changelog lanes · verified demo · live
presence/absence proof · ASCII runtime diagram · QA packet) apply conditionally on what the
fix touched, with an independent deployed layer required before the word "shipped." For a
landed DECLUTTER/REVAMP or a demo deliverable, `PROOF.md` is the heavy generator for
HANDOFF's verified-demo phase:
a storyboarded before/after narrated clip (empty → action → loading → result, animated
cursor, on-screen verdicts) via FeatureClipStudio (Playwright → Remotion → ffmpeg →
vision-judge). Both enforce the same invariants — a before/after that hides the honest
degraded path is a fake success (P0), just like any artifact-less claim.

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

**Optional learning layer (`TASTE.md`).** Three additive adapters over this ledger — none
rewrites qa-memory.mjs: (A) mine accept/decline/ship events into provenanced **taste
memory** that calibrates the B9/PRETTIFY vision-judge to the studio's design language;
(B) a NodeMem-style gate that learns from `wontfix` dismissals and surfaces recurring
finding **classes** instead of re-nagging line-items; (C) each pass as a trace→**Bar-delta
reward**→memory→repair loop so the skill compounds per pass. Skip any layer and behavior is
unchanged. Same honest-memory invariants (append-only, provenance, unscored-not-floored).

## 10. Validating THIS skill (dogfood the dogfooder)

After material edits to core or profile: cold-run the CHEAPEST model available in your
agent stack (Haiku-class, mini-class, Flash-class) on A0 with ONLY the skill+profile as
input, require its report in §6 format PLUS a "SKILL FRICTION" list, and fold every
friction back in. A skill the cheapest model cannot follow is itself a finding (B8 for
the skill). If you are a powerful model, ALSO do the inverse: after your own pass, list
what you needed that the text didn't give you — that gap goes to the profile too.
(Precedent: this loop already ran once on NodeSlide — a Haiku cold-run PASSED J0 and
surfaced 4 frictions, all folded back in.)
