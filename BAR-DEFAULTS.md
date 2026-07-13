# BAR-DEFAULTS.md — shift-left: born scoring high on B1–B11

SKILL.md is the **detect** side (drive a finished app, score the Bar, find the gaps).
This file is the **prevent** side: the day-one conventions that make a NEW app — or a
project scaffolded from the NodeBenchBoilerplate template — *born* scoring 2 on the
Agentic UI Bar instead of being retrofitted to it after a QA pass roasts it.

The thesis, borrowed from the boilerplate: a fresh checkout should already be legible to
coding agents and honest to users. Every default below is a small, copyable convention
(a testid rule, a component, a route split, a CI job) mapped to the exact Bar dimension it
pre-satisfies — so `run_quality_gate ui_ux_qa` (the boilerplate's UI gate) passes on the
first commit, not the tenth.

**One hard rule up top (from `solo-founder-agent-builder`): a default must SATISFY a Bar
dimension, never GAME it.** A hardcoded "✓ live · $0.0142" badge that isn't derived from a
real transport ledger scores *worse* than an absent one — it's a P0 dishonesty the QA pass
will fail closed on. Every default here is written so the honest version is the *easy*
version. Provenance must be DERIVED from an observed artifact (a real receipt row, a real
model-route log), never authored to look good. Wire the truth in once and the badge can't
lie.

---

## 0. Substrate first (the NodeBenchBoilerplate layer these defaults sit on)

Before any B-dimension default, a new app inherits the boilerplate scaffold — the "clean
substrate" that makes everything below enforceable. Copy these from
`HomenShum/NodeBenchBoilerplate` (or `gh repo create <app> --template …`):

| Substrate artifact | What it gives the Bar |
|---|---|
| **`AGENTS.md` front door** (First-Session / Every-Task / Learnings) | B8 — an agent knows how to drive the app cold, from one file |
| **Named quality gates** `code_review` · `deploy_readiness` · **`ui_ux_qa`** | the UI gate is where B1–B11 plug in as machine checks |
| **`.mcp.json` + preset launch scripts** (`meta`/`lite`/`core`/`full`) | B4 — tool surface is right-sized and context-budgeted, not all-or-nothing |
| **Matrixed CI** (multi-Node, build+test hard gates) | the qa-gate (§13) runs here; honest-status is enforced, not hoped |
| **strict TS + ESM** (`"strict": true`, `"type": "module"`) | typed tool authority underneath B2/B4; fewer silent-any escape hatches |
| **Feature Proof Storyboard** (`docs/FEATURE_PROOF_STORYBOARD.md` per feature) | "works" always means product-code + honest-states + deterministic/external receipts — the seed of B2/B3/B5 |

The Storyboard's **Proof Contract** is the honest-UI bar in prose form: feature reachable
from a fresh checkout · main action runs through **product code, not mock data** · loading/
empty/error/success states visible or receipted · agent work backed by deterministic
receipts/tests/external-judge output · benchmark claims separated from proxy proof. Every
default below is one mechanized clause of that contract.

---

## The defaults, B1 → B11

Each: **the convention** (copy it) · **pre-satisfies** (the Bar dim + why) · **qa-gate
check** (the machine assertion §13 runs so it can't silently rot).

### B1 — Consent & egress honesty  →  private-by-default egress gate

**Convention.** Ship a single `<EgressGate>` primitive that ALL model/network calls route
through. It is `private` by default; a call cannot fire until the user arms a per-action
consent surface *inside the composer* that names the provider + model **before** egress:

```tsx
// the ONLY door to any external model. No fetch-to-provider outside this.
<EgressGate
  data-testid="egress-consent"
  provider="openrouter" model="z-ai/glm-5.2"
  state="armed | private"            // private = default, blocks send
  label="External model: OpenRouter · GLM 5.2"   // named BEFORE the call
/>
```
Two-part arm (radio picks provider → checkbox confirms) so consent is a deliberate act,
and it **re-arms per action** (consent is not sticky — trap U3 by design).

**Pre-satisfies B1=2:** private by default · per-action opt-in · egress named
(provider+model) before it happens. Also pre-satisfies **B4** (the gate IS the read/write
scope boundary) and is the **B11** composer's consent surface.

**qa-gate check:** grep the bundle — every `fetch`/SDK call to a provider host is
lexically inside `EgressGate`; a network probe with consent OFF shows **0** egress
requests (consent-off egress = P0). `[data-testid=egress-consent]` present and defaults to
`state="private"`.

### B2 — Attribution & provenance  →  a receipt row the UI can only READ

**Convention.** Model calls write an append-only **receipt** the UI renders but never
authors: `{ runId, model, provider, costUsd, tokensIn, tokensOut, digest, verdict,
route }`. The provenance component takes a receipt and renders it; there is **no code path
that fabricates** cost/tokens/digest for display. Zero-cost + no-digest → the component
renders the **DEGRADED** face, not a live one.

```tsx
<ProvenanceBadge receipt={receipt} data-testid="provenance" />
// live:     model id · cost>0 (mono) · tokens · digest · "validation passed"
// degraded: "deterministic fallback" · $0.000 · no tokens · NO invented digest
```

**Pre-satisfies B2=2:** model id, cost, tokens, verifiable digest on every AI action —
and because the badge is a pure function of a derived receipt, it **cannot lie** (the
anti-gaming rule made structural). Cross-reference `REVAMP.md` S1 for the full trace UI.

**qa-gate check:** the `ProvenanceBadge` component has no literal cost/token/digest
strings; a degraded fixture renders `$0.000` + amber + zero digest; a live fixture renders
`cost>0`. `[data-testid=provenance]` present on every AI-result surface.

### B3 — Propose-before-mutate  →  proposals are the only write path

**Convention.** AI output that would change state lands as a **reviewable candidate**, never
applied text. One `<Proposal>` primitive: `compare (before/after) · accept · decline`, and
**accept is digest-bound** — you accept the exact validated candidate, which bumps a
version. There is no `applyAiOutput()` that writes directly to the doc.

```tsx
<Proposal candidate={c} data-testid="proposal"
  onAccept={acceptByDigest} onDecline={discard} />   // accept → version++ (B7)
```

**Pre-satisfies B3=2:** AI changes are reviewable diffs; nothing silent. Feeds **B7**
(accept bumps a restorable version).

**qa-gate check:** no direct-write call site for AI output outside `Proposal.onAccept`;
`[data-testid=proposal]` renders a before/after and both accept/decline controls; accept
increments the version store.

### B4 — Scope boundaries  →  declared read/write manifest per tool

**Convention.** Every agent tool declares a typed capability manifest (`reads: […]`,
`writes: […]`) and the UI renders a **scope chip** from it — the agent's reach is
inspectable, not implied. Pairs with the `.mcp.json` preset ladder (meta→lite→core→full):
the app starts on the narrowest tool surface and escalates on demand, with a context-budget
log.

**Pre-satisfies B4=2:** READ vs WRITE explicit, inspectable, enforced (typed manifest +
the `EgressGate` from B1 as the enforcement point). Maps to the maturity model's
`tool_authority` + `security_permissions` dimensions.

**qa-gate check:** each registered tool has a non-empty `reads`/`writes` manifest; a scope
chip testid renders them; no tool writes outside its declared `writes` set (static check).

### B5 — Honest degrade  →  a first-class DegradedState, visually distinct

**Convention.** Fallback/timeout/failure are not the absence of success — they are a
**named component** with its own visual language (amber, "deterministic fallback" /
"timed out, reconciling" label, zeroed metrics). A success component **cannot** render a
failed/degraded receipt; the types don't allow it (`SuccessState` takes `LiveReceipt`,
`DegradedState` takes `FallbackReceipt`).

**Pre-satisfies B5=2:** fallback/timeout/failure labeled + visually distinct; never a fake
success (enforced by the type split — the anti-gaming rule again).

**qa-gate check:** degraded/failed fixtures render the amber `[data-testid=degraded]` face
with zeroed cost; no code path renders `SuccessState` from a fallback receipt.

### B6 — Status & latency feel  →  the honest 3-stage status hook

**Convention.** One `useHonestStatus()` hook: **echo the ask <100ms** ("Sent…") →
**escalate the label honestly** at real milestones ("Reading context…" → "Drafting…",
driven by actual stream events, not a timer) → **hard timeout** with a message that still
reconciles a late result. No fabricated progress bars, no invented step names.

**Pre-satisfies B6=2:** immediate echo · staged honest progress · honest timeout. (B6 is
the chronic low scorer — shipping the hook by default is the cheapest way to bank it.)
See `REVAMP.md` S4.

**qa-gate check:** the composer echoes within 100ms of submit (testid flips to a pending
state); status labels come from stream events (grep: no `setTimeout`-driven fake stages);
a forced timeout renders the honest timeout label + still applies a late result.

### B7 — Recoverability  →  versioned store with restore, from commit one

**Convention.** State lives in an append-only version store; every AI accept (B3) and every
destructive edit pushes a restorable version. A `<VersionRail data-testid="versions">`
exists before you "need" it. Undo/restore is a first-class button, not a keyboard secret.

**Pre-satisfies B7=2:** versions/undo/restore exist and work after AI actions. Maps to
`state_memory` + `deployment_reliability` in the maturity model.

**qa-gate check:** accept-then-restore round-trips to the prior content; `[data-testid=
versions]` lists ≥1 version after any AI accept.

### B8 — Agent operability  →  the testid/aria contract (the big one)

This is the meta-dimension and the one most cheaply won at build time. Ship the **DOM
contract** below and a Haiku-class agent can drive the app from the profile alone.

**Testid / aria conventions (adopt verbatim — generalized from the NodeSlide profile):**

| Surface | Convention | Example |
|---|---|---|
| Primary inputs | stable `data-testid`, kebab, outcome-named (not component-named) | `data-testid="deck-title"`, `"brief-input"` |
| Consent surface | `data-testid="egress-consent"` / `"provider-consent"` | B1 gate |
| Provenance | `data-testid="provenance"` · degraded `"degraded"` | B2/B5 |
| Proposal | `data-testid="proposal"` with accept/decline sub-testids | B3 |
| Primary action | `aria-label` = the verb, stable across states | `aria-label="Propose edit"` |
| Theme toggle | `aria-label="Switch to dark theme"` + a data attr on root | `data-app-theme="dark"` |
| Tabs/panels | text-labeled buttons when expanded; don't hide the only handle behind hover | AI / Design / Trace |
| **No testid churn** | a testid is an API — renaming one is a breaking change, versioned in the changelog | — |

Rules: **deterministic selectors** (no nth-child-only paths) · **no hover-only** reveals
(everything reachable by click/focus) · **keyboard-complete** · **one label per action,
everywhere** (the button says "Publish", the toast says "Published" — B10 too).

**Pre-satisfies B8=2:** a cheap model can drive it — stable labels/aria, deterministic
selectors, no hidden-hover paths, keyboard-complete. This is also what makes the app's own
`ui_ux_qa` gate cheap to write.

**qa-gate check:** every interactive control in the core journey resolves by a stable
testid/aria (no positional-only selector); the smoke journey runs headless to completion
using ONLY those selectors (this is the boilerplate's `ui_ux_qa` preset, mechanized).

### B9 — Visual craft  →  a token system + one signature element, from the start

**Convention.** Ship a real token layer on day one: a type scale (serif/sans/**mono for all
data** — costs, hashes, ids), an 8pt spacing grid, and a **hue-classifies-never-decorates**
color rule (one accent that *means* something, e.g. it marks the AI ink). Pick **one
signature element** (a seal, a rail, a custom composer) and let everything else stay quiet.
Both themes are wired from the token layer, not bolted on. Then `PRETTIFY.md` +
`scripts/prettify-audit.mjs` keep it honest across changes (VISUAL RUBRIC V1–V9).

**Pre-satisfies B9=2:** reads as designed tooling, not AI slop — real hierarchy, disciplined
color, mono for data, both themes actually work. (Judged on rendered pixels; a no-vision
build tier runs the audit + defers the vision-judge.)

**qa-gate check:** `prettify-audit.mjs` scorecard within thresholds (bounded distinct
font-sizes, low off-grid rate, no palette sprawl, WCAG contrast at small sizes); both
themes render (dark pixel is actually dark — trap U11).

### B10 — Conversation & content quality  →  the response contract in the system prompt

**Convention.** Bake the content rules into the agent's system prompt + a thin renderer:
**verdict-first** responses · **tool-calls visible** (collapsible, never silent) · **honest
error voice** (cause + next step in the product's voice, never a bare stack trace) ·
**`[source needed]`** on any unverified figure · no sycophancy · disciplined formatting.
The renderer marks sources and surfaces tool-calls structurally so copy quality isn't left
to vibes.

**Pre-satisfies B10=2:** chat/copy earns trust. See `REVAMP.md` S2/S6.

**qa-gate check:** an A2-style live probe returns a verdict-first response with visible
tool-calls; a forced-error case renders cause+next-step, not a raw trace; an unsourced
figure carries `[source needed]`.

### B11 — First-run & progressive disclosure  →  the clean-route scaffold

**Convention.** Split the root from day one — do NOT let the editor be the landing:

```
/                     Home: calm, near-blank, ONE dominant composer ("What do you
                      want to create?"); model/web/upload controls INSIDE it (= B1
                      consent surface); recents/templates as secondary suggestions
/<artifact>/:id       Studio: navigator + canvas + inspector — LAZY-mounted, only here
/share/:slug          public read (clean)
/present/:slug        public present (clean)
```
Canonical `/` carries **no** internal query params (`?qa=` / `?domain=` / `?deck=…`), does
**not** auto-load a workspace, and the inspector starts **collapsed**. An example is a link
that *starts* a flow, never an auto-opened editor. Navigator/canvas/inspector/validation/
trace mount only **after creation begins**.

**Pre-satisfies B11=2:** landing shows the user's intent, not the app's machinery;
complexity reveals progressively; clean routes, no leaked debug/QA params. See `REVAMP.md`
S7 (the editor-first-root anti-pattern is the #1 way internally-built agentic apps fail
B11 — designing the split up front is free; retrofitting it is a structural revamp).

**qa-gate check (net-new visitor):** clear storage → open canonical `/` → assert
`location.search` has no internal params · editor/inspector containers absent from the DOM
· exactly one composer present.

---

## 13. The qa-gate — wire B1–B11 into CI as the `ui_ux_qa` preset

The boilerplate already names a `ui_ux_qa` quality gate; these defaults give it teeth. Add
a CI job (hard gate, same matrix as build/test) that runs the machine checks above against
a preview build. Skeleton:

```yaml
# .github/workflows/ci.yml  (append to the matrixed build+test job)
  ui-qa-bar:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build && npm run preview &     # serve the built app
      - run: node scripts/qa-bar-gate.mjs http://localhost:4173  # the B1–B11 asserts
```
`qa-bar-gate.mjs` is the app-owned mechanization of the per-dimension checks above (it can
reuse this skill's `pixels.cjs` for DOM asserts + `prettify-audit.mjs` for B9). It exits
**non-zero** on any P0 (consent-off egress, fabricated provenance, fake success, editor on
`/`) — those are hard gates. B9 thresholds and copy checks start advisory and promote to
hard as the app matures. **Honest-status rule (from the boilerplate CI): build+test+P0
checks are HARD; never let a P0 check `continue-on-error`.**

The gate is the shift-left mirror of SKILL.md's pass: the same Bar, asserted *before*
merge instead of discovered *after* ship.

---

## Anti-gaming ground rules (these defaults obey the solo-founder doctrine)

A default that lets the app *fake* a dimension is worse than no default — the QA pass fails
closed on dishonesty, and a faked receipt poisons every downstream agent that trusts it.
So:

- **Derive, don't author.** Provenance (B2), status (B6), and degraded state (B5) are pure
  functions of a receipt/stream the UI cannot forge. No display-only cost/digest literals.
- **The type system is the enforcer.** `SuccessState` can't take a `FallbackReceipt`;
  writes can't bypass `Proposal`; egress can't bypass `EgressGate`. Honesty is structural,
  not a lint rule someone can disable.
- **No answer-key testids.** A testid names a real user outcome; it must not be a hook that
  a scripted "demo mode" uses to short-circuit product code (that's the per-task-writer
  cheat in UI form). The `ui_ux_qa` gate drives **product code**, not a mock path.
- **No receipt, no number.** Any figure the UI shows (cost, tokens, a score) traces to a
  derived artifact or it renders `[source needed]` — the B10 rule applied to the app's own
  chrome.

Build these once and the app is born honest. The QA pass then confirms it — it doesn't have
to rescue it.
