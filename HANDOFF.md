# HANDOFF.md — from a verified finding to a readable, shipped PR

SKILL.md **finds and scores**. REVAMP.md / PRETTIFY.md **fix**. This file **ships** —
it turns a §6 finding plus its implemented fix into a pull request a reviewer (human OR
agent) can evaluate *without running the app*, and refuses to let anyone call it "shipped"
until an independent layer says so.

It is the **BetterPRHandoff** protocol — the public package
`@homenshum/easier-to-read-submissions` (live on npm) — applied to a QA finding. That
package generalizes "made changes, time to commit" into a deterministic, verifiable
submission for any coding agent (Claude Code / Codex / Cursor / Cline / aider). Here we
bind its five phases to the artifacts a QA pass already produces, so a finding's evidence
dir, fix diff, and Bar re-score compose into the PR with almost no new work.

Same honesty invariants as the rest of the skill, and they never bend:
**no artifact no claim · fail closed · provenance is ground truth · scope discipline ·
never print secrets.** "Shipped" is a claim like any other — it needs the live-DOM/API
artifact of Phase 3, not a green CI badge.

## Capability tiers (same contract as SKILL.md)
- **FLOOR:** you don't design the PR narrative. You run the phases that apply, fill the
  template sections verbatim from the finding block and the evidence dir, paste the gate
  exit lines, and STOP at any phase you can't complete (say which, don't fake it). A PR
  with Phases 1+3 honestly done beats a beautiful one with an unverified "shipped."
- **CEILING:** you author the whole handoff — the runtime diagram, the narrated proof clip
  (PROOF.md), the QA packet — root-cause the finding to its mechanism in the PR body, and
  leave the reviewer a 15-second understanding of *what changed and why it's safe*. Your
  output must let a floor-tier reviewer approve without re-deriving anything.

---

## 0. When to open a handoff PR (and at what weight)

Open one when a finding's fix is implemented and gate-green and you're about to hand it
off — feature branch ready for review, a Bar dimension raised, a cross-functional or agent
reviewer involved, or you're about to say "shipped." The **weight scales with the finding**:

| Finding / fix shape | Phases that fire |
|---|---|
| P2 copy/token tweak, single surface, no UI motion | 1 (lane) + 3 (if prod-facing) |
| P1 UI journey fix (one surface, one state) | 1 + **2** (verified demo) + 3 |
| REVAMP that landed a new component / raised a Bar dim | 1 + 2 (→ **PROOF.md** narrated clip) + 3 + **4** (diagram) |
| Cross-layer fix (frontend + backend + provenance) | 1 + 2 + 3 + **4** + **5** (QA packet) |
| Handoff to a human/agent who won't run the app | + **5** always |

Skip the heavy phases for what they're not for — a server-only refactor needs no demo
clip; a CSS token bump needs no runtime diagram. "Would the reviewer be *worse off*
reading it?" → skip. Readers learn to ignore always-on ceremony.

---

## 1. The core mapping — a §6 finding IS most of the PR

You already produced these during the QA + fix loop. Don't regenerate them; route them.

| §6 finding field (SKILL.md) | Where it lands in the handoff |
|---|---|
| `P0\|P1\|P2 · <area>` | PR title prefix + the changelog lane it's filed under |
| Symptom | PR body "What was wrong" (one line, user-visible) |
| Root cause (the mechanism) | PR body "Why it happened" — the 15-second reviewer payload |
| Evidence (paths + strings + exit codes) | the `before` artifacts of Phase 2 / the QA packet |
| Fix (files) | the changed files → one changelog lane each (Phase 1) |
| Re-verify (artifact) | the `after` artifact of Phase 2 + the Phase 3 live grep |
| Bar delta (e.g. B6 1→2) | PR headline + the QA packet `summary.whyItMatters` |
| Memory event (§9 `add-finding` status:fixed) | linked in the PR body; the fp closes the loop |

The finding's `evidenceDir` (from `add-run`) becomes the PR's artifact home. **A finding
whose fix has no re-verify artifact is not ready to ship — it stays "open" (SKILL §9).**

---

## 2. The five phases (BetterPRHandoff, bound to QA artifacts)

### Phase 1 — Per-surface changelog lanes (ALWAYS)
A "lane" = one append-only file per user-facing surface at `CHANGELOG/<category>/<slug>.md`.
Six categories: `pages/ components/ server/ db/ integrations/ scripts/`. The repo-wide
`git log` is one undifferentiated stream; lanes give the *next maintainer* per-surface
history to read before they touch a surface. Slug rule: `/`→`-`, drop extension, drop
brackets/parens (`components/TraceRail.tsx` → `CHANGELOG/components/TraceRail.md`).

Prepend at the TOP of each touched lane (never rewrite old entries):
```md
## YYYY-MM-DD — Short imperative title
What changed and **why**, for the next maintainer (1–3 sentences). User-visible effect.
Fixes QA finding <id> (<area>, P0|P1|P2). Bar: <Bx n→m> if applicable.
**Commit**: `<7-char sha>`. **Author**: <name>.
**Touches**: `<other CHANGELOG files>`   (omit if none)
```
Multi-surface fix → an entry in EACH lane, same date+sha, cross-linked via `**Touches**`.
Skip entries for pure formatting, lockfile bumps, generated migrations, typos ("would the
next maintainer care in 3 months?" No → skip). The QA hook: **the finding id and Bar delta
belong in the lane** so a future regression-debugger reading recent entries sees the QA
provenance, not just "changed X."

### Phase 2 — Verified demo recording (any UI-touching fix)
Two layers must BOTH pass before push — this is the same "no artifact no claim" discipline
as the QA pass, applied to the fix:
- **DOM/local layer:** the recorder navigates the fixed route, asserts every claim the PR
  makes (`bodyContains([...])`, `document.characterSet==='UTF-8'`, the honest-state label
  is present), records pass/fail into an evidence JSON. This is exactly `scripts/pixels.cjs`
  (already in the skill) run on the `after` state — reuse the finding's re-verify config.
- **Independent layer:** upload the recorded MP4 to a vision model (Gemini Files API) and
  ask it to confirm each claimed change is *visibly on screen*. Closes the DOM-passes-but-
  off-fold gap (trap U9's cousin): a `bodyContains` can pass while the content sits past
  the recorded viewport's fold. PARTIAL/FAIL → fix the scroll offsets, re-record.
- **Evidence JSON** (`out/<finding-id>-evidence.json`): `{ url, viewport, createdAt,
  scenes[], checks{key→{ok,note,at}}, outputs{mp4,gif} }`. Reviewers grep
  `checks.<claim>.note` instead of watching the whole clip.

For a P1 single-state fix, a bare recorded pass + Gemini confirm is enough. **For a landed
REVAMP or a demo deliverable, escalate to PROOF.md** — the storyboarded before/after
narrated clip (empty → action → loading → result, animated cursor, on-screen verdicts).
PROOF.md is the heavy generator for this phase; this phase is its caller.

### Phase 3 — Live-DOM verify BEFORE the word "shipped" (Homen's non-negotiable)
CLI exit codes, build logs, and "Deployment Ready" badges lie. Only the live URL / auth'd
API doesn't. Reuse `scripts/live-signal.mjs` — it is exactly this gate:
```bash
git push origin <branch>
gh api repos/<owner>/<repo>/branches/<branch> --jq '{sha:.commit.sha[0:8]}'   # push landed?
node scripts/live-signal.mjs <live-url> "<concrete-content-signal-from-the-fix>"
```
The signal must be a string the FIX introduced (a new testid, a copy change, a Bar-lifted
label) — not a shell string that was always there. Catches: GitHub→Vercel webhook silently
disconnected (push lands, nothing rebuilds), Next.js App Router Suspense trap (crawler sees
the fallback shell — trap U9), CDN-cached stale HTML. If the signal isn't in the raw
HTML/API response, **it is not shipped, regardless of the build log.** SPA caveat (U9): raw
grep proves presence only; for a hydration-only signal, assert against rendered DOM via
`pixels.cjs`, not raw HTML.

### Phase 4 — ASCII runtime diagram (fix crosses 2+ runtime layers)
Five layers, top→bottom in data-flow order, drop the ones that didn't change:
`DEPLOY → FRONTEND → BACKEND → DATABASE → AGENT`. Markers in boxes: `+ NEW · ~ MODIFIED ·
- REMOVED · · UNCHANGED`. Every arrow carries a transport label (`Convex client / tRPC /
REST / OpenRouter`). Width ≤100ch. The signature move: when a layer has parallel stacks
(Convex prod `blissful-pig-998` live + a dormant alt), draw BOTH labeled `· LIVE` /
`· DORMANT`, so tech debt is visible without grepping. Lives in the commit body, the PR
headline (reviewers see flow before diff), and each affected lane sliced to its layers.
Draw it when the fix changes data flow (a provenance fix that adds a digest field crosses
FRONTEND↔BACKEND↔the trace surface). Skip single-layer fixes — a CSS token bump gets none.

### Phase 5 — QA dogfood packet (when the handoff itself is the deliverable)
The single artifact a reviewer opens to evaluate the change without running anything. This
repo (**parity-studio**) is the heavy Phase-5 generator: `parity-studio-mcp`'s `qa-packet`
MCP tool reads a consumer's `qa.config.json` (the test matrix), captures `before` from the
baseline ref and `after` from the branch, diffs each pair, builds snippet crops + GIF +
Remotion video, and emits `packet.json` conforming to `qa-packet-schema.json`. The QA hook:
**each declared state maps to a journey×userState×persona tuple from the profile**, and each
snippet carries `expectedChange` / `actualResult` / `qaVerdict∈[pass|needs_fix|blocked|n/a]`
— the exact verdict vocabulary a reviewer leaves per state. `qaStatus` walks
`draft→in_review→needs_fix→approved→shipped`; `version` bumps every regeneration (the Gmail
"Magic Resend" updates the same thread). Generate it when: a feature branch is review-ready,
a UI change spans 2+ user states, a cross-functional/agent reviewer is involved, or you're
about to claim shipped. Skip for server-only or a single state already covered by Phase 2.

---

## 3. The PR body template (fill verbatim; sections are conditional per §0)

```md
## <P0|P1|P2> · <area> — <imperative title>            ← from the finding header

**What was wrong** — <symptom, one line, user-visible>
**Why it happened** — <root cause: the mechanism, not the symptom>     ← the 15s payload
**The fix** — <files touched>. Bar: <Bx n→m>.  Fixes QA finding <id> (memory fp <fp>).

<runtime diagram — Phase 4, only if the fix crossed 2+ layers>

### Verified (no artifact, no claim)
- [ ] Gates green on the current tree: `<typecheck exit line>` · `<test exit line>`
- [ ] Demo (Phase 2): `out/<id>-evidence.json` — DOM checks pass + vision model confirms
      on-screen. Clip: <PROOF.md link if narrated>.
- [ ] Live (Phase 3): `live-signal.mjs <url> "<signal>"` → OK (push sha `<sha>`)
- [ ] Honest states intact: degraded/failed/empty still labeled (no fake-success regression)
- [ ] Provenance intact: model id / cost / tokens / receipt still legible (if AI path touched)
- [ ] QA packet (Phase 5): `qa-artifacts/<id>/packet.json` — per-state verdicts attached

### Changelog lanes touched (Phase 1)
- `CHANGELOG/<category>/<slug>.md` — <one line>
```

---

## 4. Who verifies (the layers, and what each is authoritative for)

1. **The author (you)** — runs the gates, records Phase 2, greps Phase 3. Authoritative for
   *nothing on its own* ("it works" from the author is a hypothesis, not evidence).
2. **The independent machine layer** — the vision model on the Phase-2 clip, the live-DOM
   grep on the prod URL, the QA-packet diff. Authoritative for **"the claimed change is
   real and on-screen / actually deployed."** This is the layer that can say no to the author.
3. **The reviewer (human or agent)** — leaves per-state `qaVerdict` on the QA packet.
   Authoritative for **"acceptable to ship."** Only after their verdict does `qaStatus`
   advance to `approved`, then `shipped` — and `shipped` still requires the Phase 3 artifact.

The rule the three enforce together, identical to the rest of the skill: **a claim isn't
"done" until a layer that is not the author confirms it.** The build being green is the
author's layer wearing a costume.

---

## 5. Definition of done + memory

**Handoff done when:** every phase that fired produced its artifact (lanes prepended · Phase
2 evidence JSON with both layers green · Phase 3 live signal OK with the push sha · diagram
in the body if multi-layer · QA packet with per-state verdicts if handoff-grade) · the PR
body's "Verified" checklist is fully ticked with pasted exit lines/paths, none faked · the
finding is closed in memory (SKILL §9: `add-finding` with `status:"fixed"` **and** the
re-verify artifact path — a fix without its artifact stays "open") · and the word "shipped"
appears ONLY after the Phase 3 grep, never before.

**Completion traceability (Homen's rule):** the PR body names the finding id and quotes the
symptom it fixes — a future reader traces *this PR → that finding → that Bar delta* without
archaeology. The changelog lane carries the same id, so the trace survives even after the PR
is squashed away.

**Composition:** SKILL finds → REVAMP/PRETTIFY fix → **HANDOFF ships** → PROOF.md narrates
(Phase 2, heavy). A handoff PR is never the place to *discover* a new finding — if review
surfaces one, it goes back to SKILL §6 and the memory ledger as its own finding, not
smuggled into this PR's scope (scope discipline).
