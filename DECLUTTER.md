# DECLUTTER.md — subtractive UI simplification without deleting trust

Use this structural mode when a surface is crowded because it exposes too many controls,
containers, projections, explanations, or repeated routes at once. The goal is not the
fewest elements. The goal is the smallest honest surface that still exposes every unique,
working capability at the moment it is useful.

Choose the mode before editing:

- **DECLUTTER:** remove, merge, defer, compact, or repair existing UI promises.
- **REVAMP:** add a missing capability, state, proposal path, or new information structure.
- **PRETTIFY:** keep rendered structure, visible copy, behavior, and the a11y contract
  equivalent; change presentation tokens only.

If a cleanup needs DOM or copy removal, it is DECLUTTER, not PRETTIFY. If subtraction
reveals a missing capability or honest state, stop and route that slice to REVAMP.

## Inviolable constraint

**Subtract clutter, never truth, safety, reachability, or recovery.** Preserve:

- consent, egress, read/write scope, and approval controls;
- provenance, receipts, sources, model/cost/token facts, and honest uncertainty;
- loading, queued, degraded, failed, stalled, empty, and retry states backed by runtime data;
- undo, restore, cancel, retry, attachment recovery, and keyboard escape paths;
- the only route to a unique working capability;
- stable labels, roles, reduced-motion behavior, responsive reachability, and the logical
  keyboard reachability/order of each named protected control;
- canonical live data/render/export paths.

Protect the user outcome, not incidental DOM order: this does not freeze every tab stop,
wrapper, or numeric `tabindex`. Severity follows user impact rather than a blanket P0. Loss
that can cause unconsented egress/write, data loss, fabricated success, or removal of the
only critical route is P0; a blocked necessary journey is P1; a recoverable regression with
a clear equivalent route is P2. Cosmetic drift alone is not promoted to P0.

## Trigger this mode

Run DECLUTTER when any condition is true:

1. The user asks to simplify, declutter, calm, sweep, remove cruft, or make an agent UI
   feel less busy.
2. B8 or B11 is at most 1 because the primary action is obscured by choices, proof
   machinery, duplicate routes, or advanced controls before intent.
3. PRETTIFY finds “primary input not the hero” or “undifferentiated long scroll,” and the
   fix requires removing or conditionalizing DOM/content rather than changing CSS.
4. A control is a no-op, duplicates an equivalent route, or implies a capability without
   a verified runtime effect.
5. Idle or empty states render tabs, banners, metrics, celebrations, rails, or projections
   with no real record behind them.
6. Mobile clipping or excessive scroll is driven by secondary or non-operational content.

## Capability tiers

- **FLOOR:** inventory the rendered surface literally, trace each removal candidate to a
  handler/data source, fill the ledger below, apply only high-confidence REMOVE/MERGE/DEFER
  rows, then run the named gates and before/after captures. Ambiguous rows stay PRESERVE.
- **CEILING:** add persona/task-frequency analysis, network and persistence evidence,
  adversarial duplicate/no-op probes, designer-grade pixel critique, and a quantified
  before/after. Contribute reusable traps and assertions back to the profile.

No tier may infer “useless” from appearance or source naming alone.

## The disposition rubric

Make two decisions for every rendered instance; do not overload one label:

1. **Capability guard:** mark the underlying user promise `PRESERVE_CAPABILITY` when it is
   trust/safety/provenance/recovery, the only route to a unique verified capability, or a
   real runtime state. Otherwise mark it `ORDINARY_CAPABILITY`. A preserved capability may
   still have redundant rendered instances.
2. **Instance disposition:** classify this specific control/container in the order below.
   Stop at the first rule that applies.

| Instance disposition | Use when | Required proof |
|---|---|---|
| **PRESERVE** | this is the canonical or only rendered instance needed to keep a `PRESERVE_CAPABILITY` reachable, or none of the evidence-backed rules below applies | backing field/action plus a preserved selector/text/behavior assertion; this is the fail-closed fallback |
| **REPAIR** | this instance should invoke an already-specified, already-backed canonical behavior but is dead, misrouted, or silently ignored | failing journey plus reconnection to that canonical path; if new behavior, state, or runtime work is required, route it to REVAMP |
| **DEFER** | real but secondary, advanced, rare, or only meaningful after intent | named disclosure or contextual reveal; keyboard and agent reachability retained |
| **MERGE** | equivalent controls/panels lead to the same outcome | one canonical path remains; distinct states/badges/permissions are not lost |
| **REMOVE** | no verified effect; fabricated/heuristic truth claim; ornamental telemetry; empty container/tab; marketing copy that restates the UI; duplicate with no distinct outcome | DOM/runtime evidence and a regression assertion that the protected contract remains |

A derived projection may remain only when its source, derivation, and uncertainty are
explicit. Lower element count alone is never proof of improvement.

Do not infer duplication from labels or appearance. Two view controls that only present the
same canonical state differently may be MERGE/DEFER candidates. Runtime modes are distinct
when they change provider/model, tool or data scope, permissions, cost, execution semantics,
side effects, or the output contract; keep those distinctions explicit unless evidence shows
the outcomes are actually equivalent.

## Write the function ledger before editing

Create one row per candidate. No row, no deletion.

```md
| id | selector/component | user promise | capability guard | backing field/action/network effect | observed artifact | instance disposition | preserve/reverify assertion |
|---|---|---|---|---|---|---|---|
| C1 | `[data-testid="..."]` | ... | `PRESERVE_CAPABILITY` / `ORDINARY_CAPABILITY` | ... | ... | PRESERVE / REPAIR / DEFER / MERGE / REMOVE | ... |
```

Exercise read-only controls once in the safest available environment. Exercise mutations
only in local/staging, a dedicated test account, or a documented dry-run. Never click Send,
Delete, Approve, Purchase, Publish, or any other control that can cause egress, an external
write, spend, or an irreversible action without explicit user approval. Without approval,
inspect source/handlers and passive read-only network evidence instead, and record `NOT
EXECUTED`; do not call the control a no-op merely because safety prevented a click. A no-op
finding still requires evidence of no navigation, state change, network effect, persisted
effect, or named unavailable/degraded state. Ambiguity fails closed to PRESERVE or DEFER.

## The declutter loop

### 0. Isolate and remember

Resolve the app profile. Honor its coordination and clean-worktree rules. Initialize QA
memory, run `regressions`, then read `open`. Never mix unrelated local changes into the
cleanup branch.

### 1. Baseline the real surface

Capture production/current behavior before code changes. Production inspection is
**READ-ONLY DIAGNOSTIC** mode by default: do not submit prompts, mutate records, approve,
purchase, publish, or delete. Reproduce mutation journeys in local/staging, a dedicated test
account, or an explicit dry-run; externally visible writes still require explicit approval.
When approval is absent, use source inspection and passive/read-only network observation.

Capture:

- desktop, tablet, and mobile in light and dark;
- idle/empty and after-intent states;
- DOM/a11y inventory, focus order, console errors, network effects, and route state;
- primary-action dimensions, page/target-region scroll height, and overflow;
- all protected trust selectors and exact state labels;
- current type, test, build, runtime, streaming, export, and design gates from the profile.

Use `scripts/clutter-audit.mjs` for a conservative rendered-DOM inventory, then inspect the
pixels and exercise candidates. The script reports candidates; it never decides usefulness.

Evidence is sensitive by default. Prefer synthetic/test data; crop or redact PII, customer
content, account identifiers, secrets, and tokens from screenshots and pixel evidence before
sharing. Keep raw authenticated screenshots, videos, DOM dumps, traces, cookies, storage
state, and network captures under an ignored local evidence directory and never commit them.
Publish only a sanitized derived summary. Do not persist request headers, auth material, or
raw storage contents in the report.

### 2. Inventory promises, not just nodes

List every visible interactive candidate and every UI assertion: status, metric, confidence,
source, badge, progress, success, mode, and “live” claim. Trace each to its handler, backing
field, runtime event, or network/persistence effect. Mark repeated actions that lead to the
same outcome and containers that are empty in the captured state.

### 3. Freeze the protected contract

Write the invariant list before proposing removals. Include exact selectors/text for consent,
scope, provenance, honest states, recovery, navigation, and the core task path. Add the
function ledger and assign PRESERVE/REPAIR/DEFER/MERGE/REMOVE.

### 4. Draft the smallest subtraction spec

An audit/sweep/identify-only request stops after the evidence-backed spec and finding report.
Proceed to source edits and implementation only when the user authorized changing/building
the app; diagnostic authority alone is not edit authority.

Work surface by surface. Prefer this sequence:

1. REPAIR the dead primary path.
2. REMOVE unbacked claims and true no-ops.
3. MERGE duplicates into one canonical route.
4. DEFER real secondary controls until they are relevant.
5. COMPACT disproportionate but frequently used controls without hiding them.

Do not replace live state with fixtures, generic fallback prose, text-shape heuristics, or
optimistic percentages. Do not delete a component solely because it is not rendered in one
captured state; prove it has no reachable caller before code deletion.

### 5. Implement one surface at a time

Keep diffs reviewable. After each surface, add focused assertions for:

- removed controls/containers are absent in the named state;
- deferred controls remain named, keyboard-reachable, and reveal correctly;
- merged controls keep the canonical outcome;
- repaired primary actions reach the real runtime exactly once;
- every protected trust selector, state, export, and recovery path remains.

### 6. Re-verify behavior before celebrating density

Run profile gates and affected runtime/stream/export tests. Repeat the six responsive/theme
captures plus every changed idle/loading/result/error state. Exercise retained and deferred
controls subject to the read-only/approval rule above. Inspect pixels; zero overflow is
necessary, not sufficient.

### 7. Compare and persist

Report absolute and percentage deltas, but label them descriptive rather than goals:

- rendered elements and semantic content units;
- interactive candidates and above-fold controls;
- artifact-backed no-op controls;
- duplicate action groups and unbacked projections;
- empty containers and exposed control clusters;
- page and target-region scroll height/screens;
- horizontal overflow, clipped controls, console errors, and mojibake;
- keyboard/focus reachability;
- protected trust inventory;
- B1–B11 before/after, with no regression.

Append every finding and the run to QA memory. Use `HANDOFF.md` only when the user asked to
publish. Apply the core STOP rule after two failed attempts.

## `scripts/clutter-audit.mjs`

Run the advisory inventory on one or more states:

```bash
node <skill>/scripts/clutter-audit.mjs clutter.config.json
```

Config shape:

```json
{
  "repo": "D:/repo-with-playwright",
  "url": "https://app.example.com/",
  "outDir": ".qa/evidence/declutter",
  "contextKey": "anonymous-public",
  "rootSelector": "main",
  "readySelector": "[data-testid=workspace-ready]",
  "protected": [
    {
      "name": "receipt",
      "selector": "[data-testid=receipt]",
      "minCount": 1,
      "assertText": ["Receipt"]
    }
  ],
  "assertText": [
    { "name": "workspace-title", "text": "Workspace" }
  ],
  "states": [
    { "name": "mobile-light", "viewport": { "width": 390, "height": 844 }, "scheme": "light" },
    { "name": "desktop-dark", "viewport": { "width": 1512, "height": 900 }, "scheme": "dark" }
  ],
  "baselineReport": ".qa/evidence/declutter/baseline/clutter-audit.json",
  "enforceProtected": true
}
```

For **DEFER**, protect the reveal contract across two named states rather than demanding the
hidden control be visible at idle. Add this `states` fragment to the full config above and
use the same states in baseline and candidate:

```json
{
  "states": [
    {
      "name": "advanced-idle",
      "protected": [{ "name": "advanced-trigger", "selector": "[data-testid=advanced-trigger]" }]
    },
    {
      "name": "advanced-revealed",
      "clicks": [{ "name": "reveal-advanced", "selector": "[data-testid=advanced-trigger]" }],
      "protected": [{ "name": "deferred-control", "selector": "[data-testid=deferred-control]" }]
    }
  ]
}
```

The idle state proves the trigger remains reachable; the revealed state proves the real
control still exists after the safe view-only setup click. Never drop a protected entry just
to make a defer pass, and never use setup clicks for mutation or egress.

The report omits query strings, console text, headers, and storage contents. By default it
replaces path segments, selectors, and leaf text with SHA-256 evidence tokens; raw paths,
selectors, or sampled text require the explicit privacy-risk opt-ins `includeRawPaths`,
`includeRawSelectors`, or `textMode: "sample"`. It never auto-clicks audited controls,
infers event-handler liveness, or emits a composite clutter score. Configure setup `clicks`
explicitly and only for inert, read-only view setup; the mutation approval rule above still
applies. Generate the baseline with the same named states, stable `contextKey`,
URL/query, viewport/theme, readiness/setup, ignore rules, and protected/assertion contracts,
then point `baselineReport` at it for the candidate run. A comparison may say `REVIEWABLE`;
an identity mismatch, omitted/unbaselined state, missing assertion, protected loss, or reachability
regression says `UNSAFE_REDUCTION` and exits nonzero. `enforceProtected` separately makes a
no-baseline snapshot exit nonzero when its current protected selectors or assertions fail.
Non-UTF-8 charset or detected mojibake always exits nonzero, even when visible text happens
to be ASCII-only. Keep candidate `outDir`/`outputFile` distinct from the immutable baseline;
the script rejects a path that would overwrite `baselineReport`.

## Historical worked evidence: NodeBench Agents sweep

One historical pass removed placebo presentation modes, unbacked metrics/no-op controls,
duplicate rails/chips, idle tabs/toast, and text-inferred confidence/citation/media
projections. It reconnected ordinary prompts to the existing real chat path while preserving
streaming, semantically distinct swarm execution, approvals, exports, tool/domain cards,
canonical Markdown, sources, and provenance.

The raw authenticated captures from that pass were intentionally kept untracked, so this
portable module does not repeat exact element/test counts that a reviewer cannot inspect.
Treat the example as workflow evidence, not a benchmark or a subtraction target.

## Definition of done

DECLUTTER is done only when the ledger covers every removed/deferred/merged promise; the
primary journey is shorter or clearer in rendered evidence; every protected contract and
unique capability remains reachable; no artifact-backed no-op or unbacked projection remains
in scope; profile gates and changed-state pixels pass; B1–B11 do not regress; before/after
deltas and limitations are recorded; and QA memory is appended. A calmer screenshot with a
missing receipt, error state, or action is a failed pass.
