# Trace tab — Codex implementation spec (Agent Prism rail + Countersigned seal)

Status: **FINAL**. Proven mockup: `trace-tab-merged.html` (pixel-verified, light+dark, `<meta charset="utf-8">` first line, mojibake=0). Target: `src/domains/nodeslide/inspector/TraceInspector.tsx` + `src/domains/nodeslide/inspector/reviewInspector.css`.

## 0. Scope guardrail (read first — this is non-negotiable)
This is a **PRESENTATIONAL refactor** of `TraceInspector.tsx` and its `ns-trace*` CSS over the **existing** `AgentTrace` / `ValidationResult` / `CandidateValidationReceipt` / `DeckPatch` data already passed in as props.
- **NO schema change.** Do not add, rename, or remove any field on `AgentTrace`, `ValidationResult`, `DeckPatch`, or `CandidateValidationReceipt` in `shared/nodeslide.ts`.
- **NO backend / Convex change.** No new queries, mutations, or trace-producer edits.
- **NO new npm deps.** Agent Prism is a *visual reference*, not an import. Do **not** add `@agentprism/*`, Tailwind, Radix, or an Oklch build layer. The mockup's Oklch/Tailwind tokens are mockup-only.
- **Reuse the icon runtime already present:** `lucide-react@^1.12.0` is a dependency and already imported at the top of `TraceInspector.tsx`. Use lucide glyphs (as the file does today); do **not** hand-write inline SVG icons.
- **Keep the existing suite green.** There is currently **no** dedicated `TraceInspector` unit test file in `src/domains/nodeslide/inspector/`; do not break the wider vitest suite. Add the new truth-table tests in §8.

> The task brief describes an A/B run switch and a theme toggle. Those are **mockup affordances only**. The real inspector renders a single live `AgentTrace` (chosen via the existing `<select>` picker) and inherits the studio theme (§6) — do not build an in-tab A/B switch or a duplicate theme toggle.

## 1. What this renders
The NodeSlide inspector **Trace** tab renders one `AgentTrace` as a **six-node provenance rail** (chain of custody), terminating in **one loud object**: a **tri-signature validation seal** rendered inside the expanded **Receipt** node. Everything else stays quiet. Every value maps to a real field; a degraded (fallback) run must never render as a live success.

- FRAME = Agent Prism edition: rail/spine, color-handoff, typed badges, mono numerics, masthead, Depth control (Human/Pro/Tech), honest amber rail break at the Read hop on fallback.
- GRAFT = Countersigned tri-signature seal: Agent (indigo ◆) → Validator (green ✓) → Human (terracotta ○), perforated ticket edge, provisional stamp on fallback.
- FUSION = the seal **IS** the Receipt node's expanded detail (the terminal proof at the bottom of the custody chain).

## 2. Ground-truth data contract (verified against `shared/nodeslide.ts`, lines 412–435, 389–401, 558–572, 321–353)

```ts
// AgentTrace — the whole trace. NO 'fallback' field, NO 'routeOutcome',
// NO 'providerUsed'/'providerAttempted'. Do not reference fields not listed here.
interface AgentTrace {
  id: string;
  deckId: string;
  patchId?: string;                 // present => review/edit cycle; absent => full-generation run
  status: 'planning'|'working'|'awaiting_review'|'completed'|'failed'|'cancelled';
  summary: string;
  plan: string[];
  context: string[];                // plain string[] in prod (mockup used {main,sub}); one row per string
  toolCalls: string[];
  guardrails: string[];
  planningInputDigest?: string;
  planningSnapshotDigest?: string;
  shadowComparisonExpected?: boolean;
  shadowControlsDigest?: string;
  validation?: ValidationResult;    // the agent's own attached receipt (may be absent)
  candidateDigest?: string;         // Agent signer line; the sealed candidate hash
  provider?: string;
  model?: string;
  costMicroUsd?: number;            // micro-USD; divide by 1_000_000
  inputTokens?: number;
  outputTokens?: number;
  createdAt: number;
  completedAt?: number;
}

interface ValidationResult {
  id: string; deckId: string; deckVersion: number;
  ok: boolean; publishOk: boolean; cleanOk: boolean;
  issues: ValidationIssue[];        // {id, severity:'error'|'warning'|'info', code, message, slideId?, elementId?}
  checkedAt: number;
  toolchainVersion: string;         // e.g. NODESLIDE_SCHEMA_VERSION = 'nodeslide.slidelang/v1'
}

// The patch's own receipt for its materialized candidate (never the current deck).
interface CandidateValidationReceipt {
  id: string; patchId: string; candidateDigest: string;
  deckId: string; deckVersion: number;
  ok: boolean; publishOk: boolean; cleanOk: boolean;
  issues: ValidationIssue[]; checkedAt: number; toolchainVersion: string;
}

// DeckPatch — carries the HUMAN decision truth. status is the real sign-off state.
interface DeckPatch {
  id: string; deckId: string; baseDeckVersion: number;
  operations: PatchOperation[];
  status: PatchStatus;              // 'accepted'|'rejected'|'stale'|'proposed' (awaiting)
  candidateDigest?: string;
  candidateValidation?: CandidateValidationReceipt;
  traceId?: string; summary: string; createdAt: number; updatedAt: number;
  // ...propagation/profile fields omitted — not surfaced by the Trace tab
}
```

**Validation resolution (matches current component):**
```ts
type TraceValidation = ValidationResult | CandidateValidationReceipt;
const traceValidation = selected?.validation ?? patch?.candidateValidation ?? null;
```
Both union members expose `ok/publishOk/cleanOk/deckVersion/issues/toolchainVersion` — the seal binds only to those common fields, so the union is safe.

### 2a. `isFallback` — derive from REAL signals, fail CLOSED (correction to earlier draft)
The mockup carries a synthetic `fallback: true`. **`AgentTrace` has no such field, and it has no `routeOutcome`/`providerUsed`/`providerAttempted` either** — any code referencing those will not compile. The component already ships an honest detector; keep it and add the fail-closed clause:

```ts
function isFallbackTrace(t: AgentTrace): boolean {
  // 1. the marker the pipeline already writes into the model label
  //    (e.g. 'z-ai/glm-5.2 (deterministic fallback)'). This is the CURRENT prod signal.
  if (/fallback|deterministic/i.test(`${t.provider ?? ''} ${t.model ?? ''}`)) return true;
  // 2. fail CLOSED: a 'completed' run that cost $0 and produced NO candidate receipt
  //    is a deterministic degrade, never a proud live success.
  if (t.status === 'completed' && (t.costMicroUsd ?? 0) === 0 && !t.candidateDigest) return true;
  return false;
}
```
Ambiguity ⇒ provisional, never live. (Recommended follow-up, **out of scope here** because it touches the schema: have the trace producer emit an explicit `routeOutcome: 'live'|'fallback'`. Until then, the two clauses above are the only honest signals the current schema supports.)

## 3. The six-node custody rail (fixed order = accountability order)

The current component renders a **5-step** chain (`Read → Plan → Candidate → Validate → Human decision`). This refactor prepends **Consent** and reframes the terminal step as **Receipt** (which hosts the seal):

| # | Node | Owner (ink var) | Marker | Bound source | Collapsed summary | Stored or DERIVED |
|---|------|-----------------|--------|--------------|-------------------|-------------------|
| 1 | Consent | human `--ns-accent` (filled ◆) | filled diamond | **DERIVED** from `status` + the consent line in `toolCalls[]` (e.g. "…after exact edit consent" / "The user consented to send the full brief to OpenRouter.") | the consent sentence, verbatim from `toolCalls` if present, else a status-derived phrase | **DERIVED** — no stored consent field. If no consent line exists, render "Consent recorded on run start"; never fabricate a named signer. |
| 2 | Read | agent `--ns-collaboration` (hollow ◇) | hollow diamond | `context[]`, `planningInputDigest` | `N context reference(s) read` (append `— attribution route degraded` when `isFallback`) | stored |
| 3 | Plan | agent `--ns-collaboration` (hollow ◇) | hollow diamond | `plan[]`, `planningSnapshotDigest` | `N-step plan drafted` | stored |
| 4 | Edits | agent `--ns-collaboration` (hollow ◇) | hollow diamond | `toolCalls[]`, `guardrails[]`, `patch.operations.length`, `patchId` | `N tool call(s) · M guardrail(s)` (+ `· K ops` when patch present) | stored |
| 5 | Validate | human `--ns-accent` (filled ◆) | filled diamond | `validation.{ok,publishOk,cleanOk}`, `deckVersion`, `toolchainVersion`, `issues[]` | `Deterministic validation passed (v{deckVersion})` / `{n} issue(s)` | stored |
| 6 | Receipt | human `--ns-accent` (filled ◆) | terminal diamond; **dashed outline** when `status === 'awaiting_review'` | invoice block + **THE SEAL** (§4) | `Countersigned by machine — awaiting your signature` (awaiting) / `Provisional seal — machine only` (fallback) / `Signed` (accepted) | seal is derived from status/patch/validation |

**Color-handoff:** each rail segment inherits the **previous** node's ink so the eye reads terracotta → indigo → indigo → indigo → terracotta → terracotta.
**Rail break (honesty):** when `isFallbackTrace`, the segment **entering the Read hop** becomes `2px dashed var(--ns-warning)` with a soft amber halo — the exact hop where `provider·model` attribution degraded. All other segments stay solid.
**Rail-level seal chips (Pro+):** Read shows `planningInputDigest`, Plan shows `planningSnapshotDigest`, Receipt shows `candidateDigest` — each truncated mono; render a dashed `— unsealed` chip when the field is absent. **Never invent a hash.**

## 4. THE SEAL (Receipt node, expanded) — the one loud object

Upgrade the existing flat `ns-trace-signers` row (already three `<Signer>` components: Agent / Validator / Human) into a **stamped tri-signature card** and **relocate it into the Receipt node's expanded detail** (today it sits above the custody chain in `HumanReceipt` — move it into node 6). Below the signer lines sits a quiet economic **invoice** block (tokens / cost / duration) and a perforated ticket edge.

Signer bindings (keep the component's current, honest bindings):
- **AGENT ◆ (indigo `--ns-collaboration`):** `model` + `candidateDigest` (mono, click-to-copy, Pro+). On fallback: the model label already carries `(deterministic fallback)`; render **no** hash and the plain italic annotation `no candidate receipt — hash not invented`.
- **VALIDATOR ✓ (green `--ns-positive`):** `ok / publish / clean` flags from `traceValidation` + `deck v{deckVersion}` + `toolchainVersion` (Tech). Uses the existing `validationFlags()` (`ok ✓ · publish ✓ · clean ✓`).
- **HUMAN ○ (terracotta `--ns-accent`):** derived **strictly from `patch.status`** via the existing `patchDecision(patch)` — this is the real sign-off truth. When `patch` is undefined (full-generation run, `patchId == null`), fall back to a `status`-derived phrase. Never assert a sign-off the record does not hold.

### 4a. State-honest matrix (bind every cell to a real field)

| State (derivation) | Card | Stamp | AGENT ◆ | VALIDATOR ✓ | HUMAN ○ |
|---|---|---|---|---|---|
| **Live · awaiting** (`!isFallback`, `status==='awaiting_review'`) | solid, indigo top/bottom rules | none | `model` + `candidateDigest` (copyable, Pro+) | ✓ ok/publish/clean · `deck v{n}` · `toolchainVersion` (Tech) | **Awaiting your review** · *machine countersigned · human has not* |
| **Live · signed** (`!isFallback`, `patch.status==='accepted'`) | solid | none | `model` + digest | ✓ ok/publish/clean | **Applied** (from `patchDecision`) |
| **Full-generation** (`patchId == null`, live) | solid | none | `model` + digest | ✓ ok/publish/clean | **No review cycle — full generation** · *no human sign-off on record* |
| **Fallback** (`isFallbackTrace`) | **dashed amber** (`--ns-warning`) | ⚠ *provisional* | **deterministic fallback** · *no candidate receipt — hash not invented* (**NO hash node**) | ✓ ok/publish/clean (**honestly green** — deterministic validation genuinely ran) · `deck v{n}` | **Not yet signable** · *no candidate to countersign*; cost renders `$0.0000 · no tokens billed` |
| **Failed** (`traceValidation.ok === false`) | **red** (`--ns-danger`) | ⚠ *blocked* | `model` (no digest) | ✕ Validator · list `validation.issues[]` (`severity` chip + `message` + `slideId?`) | **Blocked — not signable** |

Honesty invariants (P0 — enforce in code and tests):
1. Fallback **never** invents a `candidateDigest`; the Agent line states the absence in a plain italic annotation.
2. Validator is **honestly green** on fallback because deterministic validation *did* run and pass — the deck is valid; only the *attribution* is provisional.
3. Human line derives **only** from `patch.status` (or `status` when no patch) — never a fabricated name, never an asserted sign-off.
4. Truncated hashes are **display-only** (`shortDigest()`); the full value rides the copy button (`data-copy`) and the Tech provenance drawer.
5. Cost uses the existing `formatCost` (four decimals, `$0.0000` for zero) — do **not** silently switch to the mockup's 3-decimal form.

### 4b. Copy interaction
The copy button and clickable hash must `stopPropagation()` so a click inside the seal never toggles/collapses the Receipt node. Node keydown toggles **only** when `e.target === node` (inner controls keep their own Enter/Space). Copy writes the **full** digest via `navigator.clipboard.writeText`, flips the glyph to ✓ for ~1.2s, and announces via an `aria-live="polite"` region.

## 5. Progressive disclosure (Depth: Human / Pro / Tech) — already real, extend it
**Important correction:** the Depth control is **already a working segmented control** in the component (`useState<TraceDensity>('human')`, three `role="tab"` buttons Human/Pro/Tech). It is **not** a decorative `ns-route-pill`. The only functional change required is **session persistence**:
```ts
const [density, setDensity] = useState<TraceDensity>(
  () => (sessionStorage.getItem('ns-trace-density') as TraceDensity) ?? 'human',
);
// on change: setDensity(d); sessionStorage.setItem('ns-trace-density', d);
```
Disclosure levels (real, not decorative):
- **Human:** rail + node summaries; seal shows the three signer lines (values only, no mono digests).
- **Pro:** + rail seal chips, `planningInputDigest` / `planningSnapshotDigest` rows, Agent `candidateDigest` (copyable) on the seal.
- **Tech:** + `toolchainVersion` on Validator, `shadowComparisonExpected` / `shadowControlsDigest`, and a **Provenance drawer** under the seal listing every present digest (candidate / plan.input / plan.snap / shadow.ctl) with copy buttons; explicit empty-state text when none. (The existing `TechReceipt` `ns-trace-attributes` dl + raw-JSON `<details>` may be retained inside/after the drawer.)

Default open node = **Receipt** (the seal is the hero on load). Default depth = **Human**.

## 6. Token approach (reuse the V3 semantic layer — do NOT add a build layer)
The studio already imports **both** `nodeslide.css` (legacy) and `nodeslideV3.css` (loaded second, wins the cascade) — see `NodeSlideStudio.tsx` lines 102–103. `nodeslideV3.css` already defines exactly the palette the brief names, in both themes:

| Role | V3 var | Light | Dark (`.nodeslide-studio[data-ns-theme="dark"]`) |
|---|---|---|---|
| human | `--ns-accent` | `#d97757` | (flips via V3) |
| agent | `--ns-collaboration` | `#5e6ad2` | (flips via V3) |
| validator ticks | `--ns-positive` | `#047857` | (flips via V3) |
| fallback/provisional | `--ns-warning` | `#b45309` | (flips) |
| failed | `--ns-danger` | `#dc2626` | (flips) |
| surface / raised / bg | `--ns-surface` `--ns-raised` `--ns-bg` | `#fff` `#f3f4f6` `#fafafa` | `#14181d` `#1e242b` `#0c0e11` |
| ink / faint | `--ns-ink` `--ns-faint` | `#20211f`ish / `#686c65` | `#f3f4f6` / `#9aa5b1` |
| inspector column | `--ns-inspector-width` | `340px` | — |

**The gap this refactor closes:** `reviewInspector.css` `.ns-trace-inspector` currently hardcodes its **own** local scale (`--ns-trace-agent:#5954c7`, `--ns-trace-human:#9b5434`, `--ns-trace-success:#287048`, `--ns-trace-warning:#986813`, `--ns-trace-danger:#a74435`) and has **zero** dark-theme handling (confirmed: `grep data-ns-theme reviewInspector.css` = 0 hits). **Re-point the local vars at the V3 semantic tokens** so the trace surface inherits theme flips for free:
```css
.ns-trace-inspector {
  --ns-trace-agent:   var(--ns-collaboration);
  --ns-trace-human:   var(--ns-accent);
  --ns-trace-success: var(--ns-positive);
  --ns-trace-warning: var(--ns-warning);
  --ns-trace-danger:  var(--ns-danger);
  /* keep the *-soft companions but derive them, e.g. color-mix(in srgb, var(--ns-collaboration) 12%, transparent) */
  --ns-mono: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace;
}
```
Add **one** small set of per-node accent vars if a node needs its own tint (`--ns-node-consent`, `--ns-node-read`, …), each defined as `var(--ns-accent)` / `var(--ns-collaboration)`. **Do NOT** introduce Oklch, Tailwind, or a new stylesheet — that layer was mockup-only. The dark theme comes for free once the local vars alias the V3 tokens; verify no hardcoded light-only hexes remain in the trace block (e.g. the `#f5f5f1` odd-row stripe and `#c7e4d0` proof border must become token-derived or `color-mix`).

Theme selector is `.nodeslide-studio[data-ns-theme="dark"]` — **not** `[data-theme="dark"]` (mockup) and **not** `prefers-color-scheme`.

## 7. Componentization (React/TS, inside `src/domains/nodeslide/inspector`)
Refactor within the existing file (or split into siblings if it grows past ~400 lines):
- `TraceInspector.tsx` — owns `density` (session-persisted) + trace selection (existing `<select>`); no A/B switch.
- `CustodyRail` → `RailNode` (marker + typed badge + summary + segment, incl. `is-broken` variant). Six nodes per §3.
- `CountersignSeal` — **pure function of `(trace, patch, validation, isFallback, failed, density)`** returning the §4a matrix. Keep it side-effect-free so the truth table (§8) tests it directly.
- `ProvenanceDrawer` — Tech only.
- Icons: reuse the lucide glyphs already imported (`ShieldCheck`, `Fingerprint`, `CheckCircle2`, `TriangleAlert`, `Cpu`, `Clock3`, `CircleDollarSign`, etc.). No inline SVG, no new icon dep.
- Reuse existing helpers verbatim where honest: `patchDecision`, `patchTone`, `validationFlags`, `shortDigest`, `formatCost`, `formatInteger`, `modelAttribution`, `duration`, `humanize`, `formatDate`, `isFallbackTrace` (extended per §2a).

## 8. Tests (scenario-based, one persona per matrix row) — add `TraceInspector.test.tsx`
`CountersignSeal` / rail truth-table tests (Vitest + Testing Library), covering every §4a row:
1. **Live · awaiting** (Trace A: `openrouter · z-ai/glm-5.2`, `awaiting_review`, `candidateDigest` present, validation all-green) → Agent renders the digest, Validator all-green, Human "Awaiting your review". Assert **no** `provisional`/`failed` class.
2. **Fallback · completed** (Trace B: `model` includes `(deterministic fallback)`, `costMicroUsd:0`, no tokens, **no** `candidateDigest`, validation all-green) → `.is-fallback` dashed class, `provisional` stamp, Agent renders **no** hash node, cost `$0.0000`, Human "Not yet signable". **Adversarial: assert the seal DOM contains no 32/64-hex string anywhere.**
3. **Full-generation** (`patchId == null`, live) → Human "No review cycle — full generation".
4. **Failed** (`validation.ok === false` with seeded `issues[]`) → `.is-danger`/red seal; each issue lists `severity` + `message` + `slideId?`; Human "Blocked — not signable"; Agent has no digest.
5. **`isFallbackTrace` fail-closed:** `{status:'completed', costMicroUsd:0, candidateDigest:undefined, model:'z-ai/glm-5.2'}` (no fallback marker in label) ⇒ `true`. And `{status:'awaiting_review', costMicroUsd:2000, candidateDigest:'…'}` ⇒ `false`.
6. **Copy:** clicking the hash / copy button does **not** collapse the Receipt node; `navigator.clipboard.writeText` receives the **full** digest (not `shortDigest`).
7. **Depth gating + persistence:** digests absent at Human, present at Pro; provenance drawer + `toolchainVersion` present only at Tech; `sessionStorage['ns-trace-density']` round-trips.
8. **Rail:** six nodes render in fixed order; the Read-entering segment carries `is-broken` **iff** `isFallbackTrace`.

Also assert no mojibake in rendered text nodes (`◆ ✓ ○ ⚠ ✕ ·` render as themselves).

## 9. Status-honest rules (restated — P0)
- **live / awaiting_review:** AGENT signed (`candidateDigest` present) · VALIDATOR green · HUMAN terracotta "Awaiting your review" (machine countersigned, human has not).
- **fallback:** dashed-amber PROVISIONAL seal · AGENT "deterministic fallback — no candidate receipt" (no hash invented) · VALIDATOR still honestly green (deterministic validation genuinely ran) · HUMAN "not yet signable" · `$0.0000` / no tokens.
- **failed:** red seal · `validation.issues[]` listed · HUMAN "Blocked — not signable" · no stamp.
- Every value maps to a real field; the fallback path must be visually distinguishable from a live success at a glance (dashed amber vs solid indigo).

## 10. What NOT to regress
- **Candidate-receipt binding:** Agent digest must come from `trace.candidateDigest` / `patch.candidateDigest`; never synthesized.
- **Propose-before-mutate:** the Trace tab is read-only reporting — it must not trigger any patch apply/mutation. No new side effects.
- **`editorStateIntegrity` / broader vitest suite:** must stay green. Run the full suite, not just the new file.
- **Depth control:** it is already real — do not "replace" it with a fresh control that drops its `role="tablist"`/`aria-selected` a11y wiring; extend it.
- **Cost/token formatting honesty:** keep `formatCost` (4-dp) and `formatInteger` ("not recorded" for `undefined`).

## 11. Attribution
Visual language (rail spine, typed badges, color-handoff) is inspired by **Agent Prism** by **Evil Martians**, MIT-licensed. It is referenced, not imported. If any concrete token *value* is copied from Agent Prism, add an MIT attribution note to Evil Martians in a code comment beside those values. (This implementation reuses the app's own `--ns-*` V3 tokens rather than Agent Prism's Oklch values, so attribution is a courtesy credit for the visual pattern.)

## 12. Definition of done
- [ ] Rail renders six nodes (Consent → Read → Plan → Edits → Validate → Receipt) with correct terracotta→indigo→terracotta color-handoff and the honest amber `is-broken` segment entering Read on fallback.
- [ ] Seal is the Receipt node's expanded detail and the only loud object; default-open on load.
- [ ] All five §4a seal states match exactly; fallback (dashed amber) is never confusable with live (solid indigo); no invented hashes anywhere.
- [ ] `isFallbackTrace` derives from real signals (model marker + fail-closed), compiles against the real schema (no `routeOutcome`/`providerUsed` references).
- [ ] Consent and Human nodes are labeled/handled as DERIVED — no fabricated names or hashes; absent fields render "unsealed"/"recorded on run start", never invented.
- [ ] Depth control session-persisted; disclosure real across Human/Pro/Tech; provenance drawer Tech-only.
- [ ] Copy `stopPropagation()` + `aria-live`; node keydown toggle guarded to `e.target === node`.
- [ ] `reviewInspector.css` `.ns-trace-inspector` local vars aliased to V3 semantic tokens; light + dark (`[data-ns-theme="dark"]`) both correct; no hardcoded light-only hexes left in the trace block.
- [ ] No schema/backend/dep change; lucide-only icons.
- [ ] Truth-table tests (§8) green; full vitest suite green.
