# PROOF.md — the narrated before/after proof clip (FeatureClipStudio generator)

HANDOFF.md Phase 2 needs a "verified demo." The lightweight version is a recorded pass +
a vision-model confirm (good enough for a single-state P1 fix). The **heavy** version —
for a landed DECLUTTER/REVAMP, a raised Bar dimension, or a demo deliverable — is a storyboarded
**before/after proof clip** where the viewer follows the WHOLE flow (empty → action →
loading/streaming → result), NOT a single final-state hero shot. This file is how you
generate it with **FeatureClipStudio** (the `feature-clip-studio` skill/toolkit, MIT):
a scripted, reproducible Playwright → Remotion → ffmpeg → vision-judge pipeline. Because
the spec is a checked-in "tape," the clip doubles as a regenerable integration smoke test.

This is a QA artifact, so it inherits every skill invariant — and adds two the generic
tool doesn't enforce on its own:
- **No artifact, no claim** → the clip is not "proof" until the §5 independent judge
  (authorized remote/local vision or a human reviewer) confirms the story reads as claimed.
- **No implicit vision egress** → inspect and redact locally first. A PR/publish request does
  not authorize uploading customer UI to Gemini or any third party. Without explicit egress
  authority, mark the remote judge `SKIPPED(no vision-egress authority)` and use an approved
  local vision model or independent human reviewer.
- **No hero-shot dishonesty** → a before/after that shows only the happy path and hides
  the honest degraded/failed state is a **fake success = P0**, same as any other. The
  QA-flavored rubric below makes "did you show the loading and the degrade" a scored gate,
  not a nicety. Provenance (model id / cost / tokens / receipt) must be legible IN-FRAME
  when the AI path is on screen; secrets on screen fail the judge's safety dimension.

## Capability tiers (same contract as SKILL.md)
- **FLOOR:** you don't storyboard. You run an existing spec (e.g. `render:slidelang` for
  NodeSlide) or one a stronger model wrote, execute the four stages, and STOP if a stage
  fails — a clip that "passed" on a blank/half-driven page is worse than none (see the
  presence-before-negative-assertion lesson). Hand the MP4 to a vision pass for §5.
- **CEILING:** you author the storyboard (§6), write the cap/cursor/burst spec, drive the
  before (baseline) and after (fixed branch) as a real comparison, run the judge, and fold
  its P1 defects before posting. Your output includes the spec so a floor agent regenerates
  the clip without you.

---

## 1. When to produce one (and when NOT)

Produce a narrated clip when:
- a **DECLUTTER landed** (steps 0–7) — the same protected task still completes while the
  duplicated, passive, or unbacked surface is visibly gone;
- a **REVAMP landed** (S1–S7) — the before/after IS the argument that the Bar dimension rose;
- a **PRETTIFY pass** materially changed a surface and you want the look-delta on record;
- the finding fix is a **demo deliverable** (someone will watch it who won't run the app);
- the HERO path (A2 live-AI action) is what you're proving — the clip shows consent →
  live model → reviewable proposal → provenance receipt → accept, end to end.

Do NOT produce one for: a server-only fix (nothing to see), a single static-state P2 copy
tweak (a `pixels.cjs` PNG + authorized independent confirm is the right weight — HANDOFF Phase 2 lightweight),
or anything where a full-width **static** README still + a markdown table communicates the
comparison better than motion (dense multi-version comparisons — ship the stills as primary,
clip as optional supporting motion; STORYBOARD §6).

---

## 2. The four-stage pipeline (Playwright → Remotion → ffmpeg → judge)

```
walkthrough.<app>.specs.mjs   1. SPEC     ordered cap/act/burst ops per feature
   │                                       (composition id can't contain "_": WT-<id>)
node walkthrough.<app>.mjs    2. CAPTURE  Playwright drives the app, screenshots a CLEAN
   │                                       frame per state + records the pointer target
   │                                       → public/wt/<id>/*.png + src/walkthrough.data.js
npx remotion render / render:<app>  3. RENDER  overlays animated cursor + ripple + zoom/pan
   │                                       camera + caption + progress → out/WT-<id>.mp4
ffmpeg (two-pass palette)     4. GIF     stats_mode=diff + lanczos + bayer → small loop GIF
   │
node judge-video.mjs out/WT-<id>.mp4   5. JUDGE  vision-model self-critique (independent layer)
```
Worked NodeSlide/parity-studio generator ALREADY EXISTS in the FeatureClipStudio clone:
`walkthrough.slidelang.mjs` + `walkthrough.slidelang.specs.mjs`, run via `render:slidelang`
(`WT-SlideLang`). Use it as the template for a parity-studio clip.

Prereqs: Node 18+, ffmpeg on PATH, `npx playwright install chromium`, the app running in a
no-auth/demo-clean state, real API keys if the feature calls a live model. The camera stays
clean because the cursor is **not** baked into the screenshot — Remotion overlays and
animates it, so every captured frame is pristine.

---

## 3. The capture spec format (`walkthrough.<app>.specs.mjs`)

A spec = `{ id, title, accent, tab, steps:[...], retries?:N }`. Each step is exactly ONE of:

**1. Capture** — screenshot a clean frame of the CURRENT state:
```js
{ cap:"Consent to OpenRouter · GLM 5.2", cursor:"[data-testid=provider-consent]", click:true, hold:66 }
```
- `cap` = the caption, written as an **outcome/claim** ("Filter to overdue invoices"), NOT
  a click instruction ("Click Filter"). Captions are claims-with-evidence.
- `cursor` = selector the pointer glides to (element center, viewport CSS px, captured at
  that moment). `click:true` draws a ripple. `hold` = frames to dwell (30fps; default 60;
  dwell ≈ clamp(1.5s, words/2.5, 7s)).

**2. Burst capture** — show the loading/STREAMING motion as REAL motion, not a frozen snap:
```js
{ cap:"PROPOSE → VALIDATE — running live on GLM 5.2", burst:{ ms:3200, every:300 }, hold:78 }
```
Screenshots the current state every `every` ms for `ms` total. Put it RIGHT AFTER the click
that starts the work, and `scrollEl` to the spinner/output first so it's in view. **This is
the answer to "I want to see the loading, not just the final state"** — and it is the gate
that keeps the clip honest about latency (B6): the burst shows the real staged progress.

**3. Action** — advance the UI so the NEXT `cap` shows the result:
```js
{ act:"fill"|"click"|"upload"|"sleep"|"waitText"|"notRunning"|"scrollEl"|"scrollText"|"scrollTop"|"scrollY", ... }
```
`fill{sel,value,commit?}` · `click{sel}` · `upload{sel,file}` · `sleep{ms}` ·
`waitText{value}` (regex vs `body.innerText`) · `notRunning` (spinner gone) ·
`scrollEl{sel:"df"|"iframe"|"metric"|<css>, last?}` (centers the RESULT widget —
`window.scrollTo` won't move an inner scroller, `scrollIntoView` on the element does).

**Selector shorthand** (resolved against the ACTIVE tab panel): `textarea` · `input` ·
`file` · `drop` · `chat` · `btn:<name-regex>` · `aria:<label>` · `aria^:<prefix>` ·
`df`/`iframe`/`metric` · any raw CSS. For NodeSlide, reuse the profile's verified prod
selectors (`[data-testid=deck-title]`, `[data-testid=provider-consent]`, `btn:Propose edit`).

**Order the story:** empty → fill → capture (cursor on button, `click:true`) → click →
sleep → burst (loading) → wait for result → scrollEl → capture result. Worked shape:
```js
{ id:"NodeSlideLiveEdit", title:"Live GLM edit → reviewable proposal", accent:"#c05a3e",
  tab:"AI", retries:2, steps:[
  { cap:"A deck, before the edit", hold:60 },
  { act:"fill", sel:"[aria-label='Propose edit']", value:"Tighten the closing slide" },
  { cap:"Consent to OpenRouter · GLM 5.2", cursor:"[data-testid=provider-consent]", click:true, hold:60 },
  { act:"click", sel:"[data-testid=provider-consent]" }, { act:"click", sel:"btn:Propose edit" },
  { act:"sleep", ms:700 },
  { cap:"PROPOSE → VALIDATE — running live", burst:{ms:3200,every:300}, hold:78 },
  { act:"waitText", value:"candidate validation passed|deterministic fallback" },
  { act:"notRunning" }, { act:"scrollEl", sel:"df", last:true },
  { cap:"Reviewable proposal · model glm-5.2 · cost > $0 · digest bound", hold:104 },
]}
```
Note the `waitText` regex accepts BOTH the live AND the fallback string — so the clip
records whichever path prod actually took, and the honest degrade is never edited out
(matches the profile's NOT-A-BUG: GLM create/edit may time out to deterministic fallback).

---

## 4. The three before/after comparison patterns

1. **QA-packet before/after (the Phase-5 role)** — `before` = a capture from the baseline/
   `main` ref, `after` = the fixed branch, plus a pixel `diff` image, per-component
   `snippets[]` with `expectedChange`/`actualResult`/`qaVerdict`, and a `remotionVideo`
   covering all states. This is the clip that plugs into HANDOFF Phase 5's `packet.json`.
2. **Version-comparison (V0→V3) with state receipts** — open N fresh instances on a live
   deploy, run the SAME task, send the SAME interrupt, open the internal state layer, export
   motion + static README stills + raw JSON state crops. The JSON schema IS the argument
   (what the system believed/owned/committed); the clip explains sequence. For a Bar-lifted
   trace/provenance revamp (REVAMP S1), the before/after JSON crop is the strongest proof.
3. **Multi-pane live-sync (N panes)** — for collaborative surfaces (a change in client A
   appearing live in client B): drive N isolated browser CONTEXTS (one per persona —
   capture lesson #11: two pages in one context share localStorage and fake multi-user),
   render side-by-side, cursor on the acting client, `burst` over the propagation moment.

For a QA structural pass (DECLUTTER or REVAMP) the default is pattern 1; use 2 when the
receipt/state layer is the point. A DECLUTTER comparison must pair the absence claim with a
positive completion of the protected task; a blank or broken after-pane is not subtraction.

---

## 5. Stage 5 — the independent judge that makes it "proof"

Run a local secret/PII/internal-URL preflight and sanitize the artifact before any upload.
When remote vision egress is explicitly authorized, `node judge-video.mjs
out/WT-<id>.mp4` writes `<id>.judge.md` + `.judge.json`; it needs `GEMINI_API_KEY` /
`GOOGLE_GENERATIVE_AI_API_KEY` and the MP4 (GIF is not a supported video MIME). Otherwise,
record `SKIPPED(no vision-egress authority)` for that command and have an approved local
vision model or independent human reviewer emit the same rubric-shaped JSON. Rubric (each
0–2 with evidence + timestamps), **QA-weighted**:

1. `storyboard_clarity` — can a first-time viewer state what's compared and what each scene proves?
2. `state_coverage` — empty → action → (loading if async) → result present, or a hero-shot skip?
   **A missing loading/degrade beat on an async path is a QA P1, not a P2 here.**
3. `cursor_truth` — does the cursor visibly land ON the control before each state change?
4. `caption_sync` — captions match what's on screen (and are claims, not click-instructions)?
5. `pacing` — each caption/state readable; no dead air / rushed beats?
6. `legibility` — app text readable at rendered size; captions large/contrasty?
7. `proof_feel` — reads as a real working product, not staged marketing?
8. `safety` — **any visible secrets/keys/tokens/PII/internal URLs → P0, blocks publish.**
9. `loop_etiquette` — total length + final-frame hold reasonable for a GIF loop.

Returns `{scores{dim:{score,evidence}}, defects[{ts,severity,observed,fix}], verdict, summary}`.
**Severity policy: P0 blocks publishing · P1 fix before posting · P2 log and ship** — never
enter a re-render polish loop for P2s on a passed render. **The QA overlay on top of the
generic rubric:** the clip must ALSO show the honest state your finding is about — if the
revamp was a degrade-honesty fix (B5), the clip that shows only the live path failed to
prove the fix and is `needs_fix` regardless of a high aesthetic score. Same shape as
PRETTIFY's "beauty that costs trust is a P0": a pretty clip that hides the truth is not proof.

---

## 6. Storyboard standard (before capture — the bar above "nice zooms")

Define 7 beats FIRST: **Premise · Viewer question · Comparison axis · Conflict · Evidence ·
Verdict · Exit decision.** Rules: start with the TEST not the interface; same input across
panes when claiming a comparison; show the blank/baseline before it works; show loading/
streaming/retries; show RECEIPTS (internal state, traces, metrics, source rows, the trace
tab's digest); captions are claims-with-evidence; put verdicts ON screen; zoom only to
reveal evidence the story already named; end with a decision table/scorecard when comparing.
For dense comparisons ship STATIC README stills as the primary artifact, motion as support.

---

## 7. Hard-won capture lessons (the "why naive captures fail")

1. Scope every locator to the ACTIVE tab panel (`:visible`) — the app may render all tab
   panels; an unscoped `.first()` silently matches a hidden one (mirrors QA trap U4/U6).
2. Capture the loading state on purpose (`sleep ~1.5s` then `cap`, or a `burst`).
3. **Presence before negative assertion** — `notRunning` must first wait for the active
   panel to be visible, THEN assert the spinner is gone; a bare "spinner gone" wait passes
   vacuously on a blank/crashed page (the #1 source of clips that "pass" on empty screens —
   the exact fail-closed discipline of SKILL §1).
4. Retry nondeterministic (LLM-backed) specs in a FRESH env (`retries:N`) — each attempt
   wipes the frame dir AND opens a fresh page; a half-driven UI poisons every later frame.
   LLM-backed steps flake ~50% (matches the profile's GLM edit-path reliability finding).
5. Freeze failure forensics: on any capture error, screenshot `zz-fail.png` + log a 200-char
   `body.innerText` snippet before retry — "which state was the page actually in" ends
   guesswork (once exposed a real product bug, not a capture bug — root-cause first, U8-style).
6. Cursor coords are viewport CSS px, overlaid by Remotion (frames stay clean).
7. Don't match caption text in `waitText` (a header fires it instantly) — wait on a
   post-result-only string (for NodeSlide: `candidate validation passed`, not a slide title).
8. GIF camera rule: ease over a FIXED short window then HOLD static — continuous zoom/pan
   changes every pixel of every frame and blows up GIF size (cheap in H.264, brutal in GIF).
   Ship MP4 + GIF; deliver 12–15fps, author at 30. ffmpeg two-pass palette:
   `-vf "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle"`.

---

## 8. Definition of done + composition

**Clip done when:** capture emitted `WALKTHROUGH_CAPTURE_DONE` with no `zz-fail.png` referenced
by data.js · the MP4 rendered · the authorized independent-judge verdict is `publish` with zero P0 and P1s
fixed (P2s logged) · the clip shows the honest state the finding is about (not only the
happy path) · provenance is legible in-frame on any AI beat · no secrets on screen ·
outputs (MP4 + GIF + `<id>.judge.json`) live in the finding's evidence dir · and it's linked
from HANDOFF Phase 2's evidence JSON (`outputs.mp4`) and, if handoff-grade, the Phase-5
`packet.json` `remotionVideo`.

**Memory (SKILL §9):** the clip path goes into the finding's re-verify artifact — a
DECLUTTER/REVAMP whose "before/after clip" claim has no judged MP4 stays "open," same rule
as every other artifact-backed claim. The `.judge.json` is the independent-layer receipt;
keep it.

**Composition:** SKILL finds → DECLUTTER/REVAMP/PRETTIFY fix → HANDOFF ships when authorized
and live-verified (Phase 2 calls here) → **PROOF narrates**. The clip never becomes the place
to discover a new bug — but its capture
harness often does (a "flaky" flow that turned out to be a real agent bug the capturer
surfaced). When it does, that's a new SKILL §6 finding + memory event, not a caption edit.
