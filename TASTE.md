# TASTE.md — the learning layer (calibrated taste · dismissal-aware memory · reward loop)

SKILL.md scores the Bar and appends every finding (§9). PRETTIFY.md measures B9 and
vision-judges restyle candidates (§3.3). REVAMP.md redesigns the lowest dimension. All
three are **flat** in one respect: the vision-judge scores *generic-good* not *on-brand*,
the findings ledger *re-nags* the same defect and *re-surfaces things you already declined*,
and each revamp pass starts cold — it does not learn from the last one. This file closes
that gap without rewriting anything. It is three **additive layers over the existing
files and `scripts/qa-memory.mjs`**, drawn from three sibling systems:

- **harness4visuals-etl** → chat/decision events become durable, provenanced **taste memory**
  that calibrates the B9 judge to *this studio's* design language.
- **NodeMem** → the findings ledger gains a **notice→gate→learn-from-dismissal→dedup** brain,
  so it stops flooding and remembers "no."
- **NodeRL** → the revamp loop becomes a **trace → reward(Bar-delta) → memory → repair**
  loop, so the skill compounds per pass and can emit training data down the line.

**Nothing here replaces qa-memory.mjs or the JSONL ledgers.** These are *adapters* that
read the append-only ledgers and write *new* append-only records. If you never run them,
the skill behaves exactly as before.

---

## THE INVARIANTS (carried from all three sources — never bend, any layer)

1. **Append-only; the corpus only grows.** A state change is a *new event with the same
   id/fp*, never a rewrite or delete. The retrieval VIEW may shrink (open findings resolve);
   the EVENT LOG only grows. These are not in tension — §B and §C spell out the reconciliation.
2. **Provenance on every record.** Every taste signal, dismissal, class, and reward carries
   `source_*` ids pointing at the ledger event / QA turn / artifact that produced it. A record
   with no provenance is **rejected on write** (harness4visuals reject rule).
3. **Never fabricate a score.** Unscored ⇒ `0` + an explicit `unscored:<name>` label, never a
   hardcoded floor (NodeRL `mergedReward` doctrine). Resolution order per component:
   **SUPPLIED > DERIVED-from-trace > UNSCORED.**
4. **Never a fake success.** Every gate/suppression emits a **typed reason code** — the trace
   IS the reason (NodeMem). A finding suppressed for any reason is still *recorded* as
   suppressed, auditable, not silently dropped.
5. **The learning signal is honest human feedback**, not synthesized: accept/decline of a
   candidate, an explicit `wontfix`, a resolved-on-re-verify. Never invent a preference or a
   "resolved" the artifacts don't hold.
6. **Deterministic identity.** Ids/fingerprints are stable content hashes (sorted-key,
   no `Date`/random) so the same input dedupes across passes and runs byte-identical.

---

## A. TASTE MEMORY — calibrate the B9 vision-judge to a design language

**The problem.** PRETTIFY §3.3 pins the V1–V9 rubric and takes `argmax` over rendered
candidates. V1–V9 is *universal craft* — it cannot tell that NodeSlide's language is
"terracotta is the only chromatic ink, everything else is a grayscale value-ramp; serif
display / sans body / mono data; three-pane custody discipline." Two candidates can both
score V3=2 (disciplined color) while one is on-brand and one is a generic blue SaaS. The
judge needs the studio's *durable taste* as an explicit constraint, or B9 optimizes toward
tasteful-generic.

**The mechanism (harness4visuals ETL, LLM-free, replayable).** Mine the decisions the
PRETTIFY/REVAMP loop *already emits* — they are the "chat transcript" analog — into scoped,
provenanced **taste signals**. Durable signals ARE the design language; campaign/session
signals are transient direction that expires.

### A.1 Where the signals come from (the accept/decline/export events)

Deterministic extraction over **decision events and USER turns only** — never grade the
judge's own rationale text (mirrors harness4visuals "user turns only: dislikes are
first-class, higher-weighted"):

| Event source | Polarity | Notes |
|---|---|---|
| PRETTIFY §3.3 **winner** (`argmax` selection) | positive | the applied restyle candidate = an accepted taste |
| PRETTIFY §3.3 **losers** (shuffled candidates not picked) | negative | *why* they lost, from the judge rationale's grounded bbox+issue |
| REVAMP §3 **direction judging** (winner + grafted/rejected ideas) | pos/neg | organizing-principle-level taste |
| User **dismissal** ("no, that's fine / not my taste / too much") | negative (durable) | the strongest signal — a declined polish is a durable brand rule |
| **Export/ship** of a surface (the design got shipped) | positive (durable) | shipping is the ultimate accept |
| Human design notes in the QA report / profile | pos/neg | verbatim, quoted as evidence |

### A.2 Extraction (deterministic, version-pinned `taste-v1`)

Regex over the event text, same shape as harness4visuals `extract.py`:
- **Negative patterns** (weighted higher): `avoid · don't use · less X · remove · drop · too
  much · not my taste · dislike · never`.
- **Positive patterns**: `keep · prefer · more X · ship it · that's the one · love · on-brand`.
- **Scope inference** (`_infer_scope`) — the load-bearing split of *durable design language*
  from *one-off direction*:
  - `durable` if the text/source names brand rules (`my brand · my taste · durable · always ·
    never`), OR the signal is a **user dismissal / ship** (dismissals & ships are assumed durable);
  - `campaign` if `launch · this deck · for the demo · only for`;
  - `session` if `this version · this candidate · more/less` (one restyle iteration);
  - default: negatives → `durable`, positives → `session`.
- **Kind inference** (`_infer_kind`) — mapped onto the B9/PRETTIFY rubric so a signal points
  at the V-dimension it constrains:
  `color` (hue/tint/palette/terracotta/gray → V3/V4) · `type` (serif/sans/mono/scale/weight →
  V1/V4) · `space` (grid/rhythm/density → V2/V7) · `elevation` (radius/shadow/border → V6) ·
  `motion` (V9) · `state` (empty/loading/error polish → V8) · else `aesthetic` (signature/overall).
- **Confidence/weight** are scope-driven constants (durable = conf 0.82 / weight 0.9; else
  0.74 / 0.65) — durable dislikes dominate the judge.
- **Stable id + dedup**: `taste_<sha256(kind|subject|polarity|scope|source_ids)[:12]>`; dedupe
  key `kind|subject|polarity|scope`, first-seen wins (deterministic).

### A.3 The taste-memory artifact — `.qa/taste/taste.jsonl` (one signal / line, append-only)

```json
{"id":"taste_0b9c8c5d8f42","kind":"color","subject":"blue accent as primary action",
 "polarity":"negative","scope":"durable","confidence":0.82,"weight":0.9,
 "vdims":["V3","V4"],"evidence":"declined candidate 2 — 'terracotta is our only chromatic ink, drop the blue'",
 "source_event_ids":["prettify_run_7#cand2","dismissal_2026-07-13T…"],"classifierVersion":"taste-v1"}
```

Field contract (this IS the design-judge memory record): `kind` (color|type|space|elevation|
motion|state|aesthetic) · `subject` (the taste object) · `polarity` · `scope` (durable|
campaign|session) · `confidence` · `weight` (downstream judge influence) · `vdims` (which
V1–V9 it constrains) · `evidence` (verbatim source text) · `source_event_ids` (provenance).

`taste_profile.json` regroups by scope → `{durable:[…], campaign:[], session:[]}` — the
retrieval-ready shape the judge loads. **Durable = the studio's design language; campaign/
session expire** (drop when their pass/campaign closes — a NEW event, not a rewrite).

### A.4 Feeding the judge (this is how B9 becomes on-brand, not generic-good)

PRETTIFY §3.3 gains a **TASTE PREAMBLE** injected ahead of the fixed V1–V9 rubric, built
ONLY from `scope=durable` signals, highest-weight first:

```
STUDIO DESIGN LANGUAGE (durable taste — treat as hard constraints on top of V1–V9):
- V3/V4 color: terracotta is the ONLY chromatic ink; everything else is a grayscale value-ramp. [taste_0b9c…]
- V1/V4 type: serif display / sans body / mono for all data. [taste_1f22…]
- AVOID: blue accent as primary action; palette sprawl; decorative hue. [taste_0b9c…]
Score each candidate on V1–V9 AND on adherence to the above. A craft-2 candidate that
violates a durable AVOID scores below a craft-1 candidate that honors the language.
```

Selection becomes **`argmax` over (rubric score + taste adherence)**, ties broken by
guardrail pass (§PRETTIFY 4 unchanged). A **no-vision model** still can't judge pixels — it
DEFERS §3.3 as before, but it CAN apply the deterministic taste rules that map to machine
signals (e.g. a durable "terracotta-only" AVOID → `prettify-audit` off-allowlist-hue check),
so even the floor tier gets *some* on-brand enforcement.

### A.5 The honesty gate on the taste memory (harness4visuals `evaluate.py`)

Taste memory can lie (over-generalize a one-off into a brand rule) — so it is **gated on
write**, never trusted blindly:
- **Reject rules** (write-time invariants): provenance missing · a `durable` and a `campaign`
  signal mixed into one record · a negative/dislike silently dropped · `evidence` references a
  subject not present in any `source_event` · row fails to parse · row contains a secret/private URL.
- **Calibration eval** (optional, CI-grade): against a small `golden_taste.jsonl` (15 hand-
  labeled `{kind,polarity,scope,subject}` rows for the app), compute precision/recall/**f1** and
  **hallucinated_preference_rate** (false-positive taste / total). Greedy 1-1 match by
  `0.25·scope + 0.25·kind + 0.5·subject_jaccard ≥ 0.72`; **polarity mismatch = auto-0** (never
  match a "like" to a "dislike"). Gate: `f1 ≥ min ∧ hallucination ≤ max` before the profile
  adopts the taste preamble. This is the F1/hallucination honesty gate on the judge's calibration.

### A.6 Optional downstream — SLM `training.jsonl`

The same signals collapse to a provider-clean chat row (`{messages:[system,user,assistant]}`
with provenance kept in a sidecar `manifest.json`, never in the training row) to LoRA/SFT a
small *taste-aware* vision-judge later. **Optional and downstream** — not required to run the
loop; documented so the corpus is training-ready if the studio ever wants a fine-tuned judge.

---

## B. LEARNING MEMORY — a dismissal-aware gate over qa-memory.mjs (NOT a rewrite)

`qa-memory.mjs` is already an append-only ledger with fingerprint dedup and a `wontfix`
status. It has three gaps NodeMem exactly fixes — **as an optional adapter that reads the
existing ledgers and appends new events; it changes zero lines of qa-memory.mjs.**

| Naive-ledger failure mode | NodeMem cure | In QA terms |
|---|---|---|
| **Flood** — same defect re-filed every pass | dedup + quota | fp dedup exists; add a per-class per-pass quota |
| **No memory of "no"** — a `wontfix` re-surfaces as a fresh "open" next pass | learn-from-dismissal | latest-status `wontfix` ⇒ durable per-app suppression |
| **No pattern view** — 40 findings, no sense of the 3 real problems | classifier | derive a stable **finding CLASS**; surface recurring classes |

### B.1 Finding CLASS (the ledger→learning upgrade)

Add a deterministic root-cause classifier (NodeMem `classifyNoteworthy` / NodeRL
`classifyRootCause` shape) over `area + rootCause` → a stable enum, e.g.:
`contrast_regression_after_restyle · consent_reset_not_rearmed · provenance_zero_cost_live_claim
· raw_error_leak · overflow_at_viewport · collapsed_disclosure_swallows_click ·
fake_success_status · timeout_no_honest_fallback · testid_missing_or_unstable · unclassified`.

Then the adapter surfaces **classes, not line-items**: "5 open findings; 3 are class
`contrast_regression_after_restyle`" → *that class* is the revamp target (a systemic fix),
not three separate patches. This is the shrinking-failure-memory insight: repair the class,
not the instance.

### B.2 The gate pipeline (ordered; each gate emits a typed reason)

A new/re-discovered finding is a **suggestion**, run through gates before it lands as `open`:

1. **classify** → attach `class` (B.1); `unclassified` still passes.
2. **fp dedup** (already in qa-memory `latestByFp`) → same fp already `open` ⇒ `duplicate_fp`.
3. **dismissal** → latest status of this fp OR any fp in the same `class` is `wontfix`
   ⇒ `previously_dismissed` (durable, per-app, **learned not hardcoded** — the `wontfix`
   event is the source of truth; never delete it).
4. **class quota** → this `class` already surfaced this pass N times (default 1) ⇒
   `class_quota_exceeded` (roll the rest into the class summary, don't re-list).
5. **policy** (optional `.qa/policy.json`, most-restrictive-wins) → class muted / signal
   disabled ⇒ `muted_by_policy`.
6. all pass ⇒ `open` (a real finding).

Every suppression is itself **appended** as an event `{ts, fp, class, status:"suppressed",
reason:"previously_dismissed", source_wontfix_id}` — honest audit trail, never a silent drop.
This is the exact "flat ledger that re-nags → memory that learns 'no' and never floods" upgrade.

### B.3 New append-only records (adapter writes; qa-memory ledgers untouched)

`.qa/memory/classes.jsonl` (append-only class annotations + suppression events):
```json
{"ts":"…","fp":"a1b2c3d4e5f6","class":"contrast_regression_after_restyle",
 "status":"suppressed","reason":"previously_dismissed","source_event_ids":["findings.jsonl#…wontfix"],
 "classifierVersion":"class-v1"}
```
`.qa/policy.json` (data, not code — most-restrictive-wins over a system default):
```json
{"mutedClasses":["testid_missing_or_unstable"],"maxSurfacePerClassPerPass":1,
 "disabledSignals":[],"note":"tuning is data; never hardcode suppression in the classifier"}
```

**Reconciliation with append-only:** the `open` command's VIEW shrinks (dismissed/duplicate
findings drop out), but every suppression and every `wontfix` remains an event in the log.
Memory of "no" is durable *because* it's append-only, not despite it.

---

## C. REWARD LOOP — the revamp pass as trace → reward(Bar-delta) → memory → repair

Make each QA/revamp pass a recorded **trajectory** scored by a **Bar-score-delta reward**, so
a pass that *lowers* the Bar produces a negative reward and a kept failure trajectory (not a
hidden one), and the next pass gets a grounded repair prompt. `runs.jsonl` already stores
`{ts, executor, journeys, bar, gates, evidenceDir}` — that IS the trajectory header. This
layer *extends* it with a reward block and a repair emitter; it does not replace it.

### C.1 REWARD — Bar-delta (NodeRL `mergedReward`, honest resolution order)

Per component: **SUPPLIED > DERIVED-from-trace > UNSCORED(0 + `unscored:<name>`, never a floor).**

| component | QA derivation (else unscored) |
|---|---|
| `taskCompletion` | journeys PASS / total (A0–A6 from the profile) |
| `uiStateCorrectness` | gate pass-fraction (typecheck+test) + honest-state asserts passed |
| `visualQuality` | **SUPPLIED by the §A-calibrated B9/PRETTIFY vision-judge** — the one component with no trace signal (the VLM slot); no-vision pass ⇒ `unscored:visualQuality` |
| `evidenceGrounding` | claims-with-artifact / total claims (quantifies "no artifact, no claim") |
| `costEfficiency` | `efficiencyVsBudget(Σ token cost, profile budget)` — unscored if the profile has no budget |
| `latencyEfficiency` | same curve on Σ latency — unscored if no budget |
| `safety` | 1 unless an honest dishonesty/P0 signal (fake success · consent bypass · raw-error leak · zero-cost live claim) → 0 |

`total` = weighted mean (equal by default). **Reward = `total` delta vs the previous pass's
trajectory** (read from `runs.jsonl` history). A revamp that drops the Bar → negative delta →
the failure trajectory is **appended and kept** (never hidden). **Anti-reward-hacking:** the
headline reward is generic-only — no per-app answer-key. Per-app materializers (e.g. a
NodeSlide-specific check) are *diagnostic, labeled, and never the reported number* ("a reward
earnable by hardcoding the output is the wrong reward").

`.qa/memory/rewards.jsonl` (append-only; one per pass, keyed to the `runs.jsonl` row):
```json
{"ts":"…","trajectoryId":"traj_<fnv1a-sorted-keys>","goal":"revamp B6 status/latency",
 "components":{"taskCompletion":0.86,"visualQuality":1.0,"evidenceGrounding":1.0,
   "safety":1.0,"costEfficiency":"unscored:no-budget"},
 "total":0.90,"prevTotal":0.82,"reward":0.08,
 "failureCategories":["ui_assertion_failed:J2"],"outputs":{"evidenceDir":"artifacts/…"}}
```

### C.2 MEMORY — shrinking open-set, growing log (NodeRL `mergeFailureMemory`)

Each unresolved finding → a failure pattern carrying its **root-cause class** (§B.1) + a
**runnable regression** (qa-memory `regressions` already emits the mandatory re-verify sweep
of every ever-fixed P0/P1). The merge rule: a finding leaves the `open` VIEW only when its
re-verify artifact PASSES → the open-set *shrinks as you fix*, while the event log *only
grows*. `repairTargets` = distinct classes with an unresolved pattern = exactly the next
revamp set. Retrieved with an honesty annotation: stale (last-seen > 30d) or low-confidence
patterns are flagged `risk`, never silently trusted.

### C.3 REPAIR — deterministic repair prompt for the next pass (NodeRL `generateRepairPrompt`)

From a failed/low-reward trajectory, emit a markdown repair prompt grounded ONLY in trace
facts — no guessing:
- verdict + reward delta; **which Bar dims dropped** and by how much; the failing journeys
  with the exact artifact path; the erroring gate lines; any `needs_review`/`[source needed]`
  claim left unresolved.
- The task, verbatim contract (REVAMP.md made loop-closed): **(1) trace each drop to a root-
  cause CLASS (2) propose the SMALLEST SHARED fix — never a per-instance patch (3) resolve or
  drop every needs-review claim (4) add the regression so it can't silently return.** The
  regression case (`{id, userGoal, failedAssertions[], expectation}`) is embedded so the next
  iteration is gated on it.

This is exactly SKILL §7's revamp loop + REVAMP.md's pipeline, now **reward-gated and
memory-fed**: trace → reward → memory → repair → (next) trace.

---

## Synthesis — the three layers stacked (what actually changes)

1. **B (NodeMem gate)** wraps finding intake: classify → dedup → **learn-from-`wontfix`** →
   class-quota → policy. Kills flooding, remembers "no," surfaces the 3 real *classes* behind
   40 line-items. Drops on qa-memory.mjs as a read-adapter + new append-only ledgers.
2. **A (harness4visuals taste ETL)** turns the loop's own accept/decline/ship events into
   scoped, provenanced **taste signals**; the durable ones become the **TASTE PREAMBLE** that
   calibrates the §PRETTIFY vision-judge to *this studio's language* — B9 goes from
   generic-good to on-brand — gated by an F1/hallucination write-honesty check.
3. **C (NodeRL trace→reward→memory→repair)** makes each pass a trajectory scored by a
   **Bar-delta reward** (supplied>derived>unscored, never a floor; `visualQuality` supplied by
   the §A-calibrated judge), converts failures into a **shrinking open-set with runnable
   regressions**, and emits a deterministic **repair prompt** for the next iteration — the skill
   compounds per pass, and the corpus becomes SFT/DPO/RLVR-ready.

**All additive.** Skip any layer and the skill is unchanged. The honest-memory doctrine
(append-only · provenance-on-every-record · unscored-not-floored · typed-reason-not-fake-
success · learning-signal-is-honest-human-feedback · deterministic-ids) holds identically
across all three — a stronger model earns wider action, never looser honesty.

---

## RETURN SCHEMA (the record contracts, one place)

All JSONL, append-only, one record/line, stable content-hash ids. New files live in the app
repo beside the existing `.qa/memory/` (travels with, and as private as, the app).

```
.qa/taste/taste.jsonl          # A.3  taste signals (design-language memory)
.qa/taste/taste_profile.json   # A.3  signals regrouped by scope (judge loads this)
.qa/taste/golden_taste.jsonl   # A.5  optional hand-labeled calibration golden
.qa/memory/classes.jsonl       # B.3  finding-class annotations + suppression events
.qa/policy.json                # B.3  optional data-not-code suppression policy
.qa/memory/rewards.jsonl       # C.1  per-pass Bar-delta reward (keyed to runs.jsonl)
# unchanged, owned by qa-memory.mjs: .qa/memory/runs.jsonl + findings.jsonl
```

| record | required fields | provenance field |
|---|---|---|
| **taste signal** | `id, kind, subject, polarity, scope, confidence, weight, vdims[], evidence, classifierVersion` | `source_event_ids[]` |
| **class / suppression** | `ts, fp, class, status, reason, classifierVersion` | `source_event_ids[]` |
| **reward** | `ts, trajectoryId, goal, components{}, total, prevTotal, reward` | `outputs.evidenceDir` |
| **failure pattern** (C.2, derived view) | `id, class, symptom(≤300ch), regressionTest, fixHint, lastSeen` | `receiptRefs[]` |

**Write-time invariants (reject the record if violated):** provenance present · durable/
campaign not mixed · no negative/dislike dropped · no fabricated score (unscored+label) ·
parses as JSON · no secret/private-URL bytes · id is a deterministic content hash.

## Build status (honest — no artifact, no claim)

This file is the **design + schema spec** for the three adapters. The runnable scripts
(`scripts/taste-memory.mjs`, `scripts/qa-learn.mjs`, `scripts/reward.mjs`) are the **next
build target**, each a dependency-free CLI over the ledgers in the qa-memory.mjs mold
(`init · add · list · gate · eval`). They do not exist yet — do not claim the loop "learns"
until a script has appended a real record and a re-verify artifact backs it. Until then this
is the contract a floor-tier agent implements exactly, and a ceiling-tier agent implements
plus the F1/hallucination and reward-hacking evals.
