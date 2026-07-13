# PLATFORM.md — where agentic-ui-qa sits in the stack

This skill is not a standalone tool. It is the **UI instance** of a rubric family and one
node in a ship-and-prove platform. This file is the map: what the Agentic UI Bar nests
under, what feeds it, what it feeds, and the invariants every layer inherits so no layer
can be gamed.

Read it when you're deciding *which* tool to reach for, when you're explaining how the Bar
relates to the broader maturity model, or when you're extending the platform and need to
know where a new capability plugs in.

**Honesty note (applies to this whole file).** Components below are marked with real
status — `[shipped]` (exists and runnable today), `[in-skill]` (a subsystem of THIS
skill), `[external]` (a separate repo), `[reference]` (adopted, not owned), `[roadmap]`
(named, not built). The platform narrative does not pretend vaporware is real — that would
violate its own "no receipt, no number" rule.

---

## The rubric it nests under: agent-era-maturity-model  `[external]`

`HomenShum/agent-era-maturity-model` is the **container rubric** the Agentic UI Bar is a
UI-scoped instance of. Two JSON files ARE the machine-readable contract:

- **`rubric/agent-era-maturity-rubric.json`** — `scoreScale` 0–5, six levels **L0–L5**
  (Prompt Wrapper → Tool User → Workflow Agent → Stateful Workroom → Agent OS → Governed
  Agent Organization), **12 dimensions** each `{id, name, question, evidence[]}`
  (`goal_ownership`, `state_memory`, `tool_authority`, `context_engineering`,
  `harness_engineering`, `loop_engineering`, `human_steering`, `observability_audit`,
  `cost_latency`, `security_permissions`, `parallel_delegation`, `deployment_reliability`),
  and `maturityRules` — string predicates rolling dimension scores up to a level.
- **`rubric/assessment-schema.json`** (JSON Schema 2020-12) — the shape an assessment
  emits. Required: `target {name, repo, appType}` · `overallLevel` (L0–L5) ·
  `dimensionScores {<dim>: {score 0–5, rationale, receipts[]}}` · `evidence[] {kind,
  pathOrUrl, whyItMatters}` · `upgradePath[] {priority, gap, nextBuild}`. Optional
  `confidence` 0–1.

**How the Agentic UI Bar nests under it** (the crosswalk):

| Maturity dimension | Agentic UI Bar dimension |
|---|---|
| `observability_audit` | B2 provenance badges · B3 proposal review · raw-JSON-in-UI |
| `human_steering` | B3 propose-before-mutate · B6 honest status · B7 recoverability |
| `tool_authority` + `security_permissions` | B1 consent gate · B4 scope boundaries |
| `cost_latency` | B2 (cost/tokens shown) · B6 (latency shown before work expands) |
| `state_memory` | B7 versioned/durable state rendered, not inferred |
| `deployment_reliability` | B8 agent-operability · B5 honest degrade under real prod |
| `context_engineering` / `harness_engineering` | B10 content quality · B5/B6 honest harness UX |

**The Bar SHOULD emit the same assessment shape.** A UI pass conforms to
`assessment-schema.json` with `dimensionScores` keyed `b1..b11`, `evidence[]` =
screenshots / DOM-signals / recorded run ids, `upgradePath[]` = the next UI builds
(exactly what SKILL.md §4 "lowest dimension = next revamp target" produces). This makes a
UI score comparable to a repo-level maturity score and lets both roll into one
`overallLevel`. Reuse the rubric's own scale words when reporting: the Bar's 0/1/2 is a
compression of the 0–5 scale for fast UI passes; a rigorous pass can expand to 0–5 and emit
the full schema.

The maturity model already anticipates this: its worked example's `upgradePath[3]` is
literally *"Build an automated repo scanner that emits this assessment JSON"* — a
per-domain instance (the UI Bar) is the intended extension, and this skill is that instance.

**Two tiers nest under the levels — B (surface) and D (product).** This skill instances the
maturity model as TWO orthogonal tiers, and both roll into one `overallLevel`:
- **The Bar (B1–B11)** — the *trustworthy-operable UI* tier. It maps mainly to the
  human-facing / observability dimensions above (`observability_audit`, `human_steering`,
  `tool_authority`, `cost_latency`). B raises the level of the **surface**.
- **The DEPTH tier (D1–D11, `DEPTH.md`)** — the *durable-grounded-governed agent product*
  tier, CONDITIONAL on data-grounded / document-producing / multi-model / long-running apps.
  It maps to the deeper runtime dimensions the Bar barely touches: `loop_engineering` (D1) ·
  `state_memory` (D3/D6/D11) · `context_engineering` (D2/D4/D8) · `security_permissions` +
  `tool_authority` (D5/D9) · `parallel_delegation` / `deployment_reliability` (D3/D9) ·
  `observability_audit` (D10). D raises the level of the **product**.

The two are orthogonal: an app can be **22/22 on B and near-0 on D** (a beautiful, honest UI
over a shallow, single-shot agent — high on the surface dims, floored on `loop_engineering` /
`state_memory`), which is why a high `overallLevel` (L3+ Stateful Workroom and up) requires
the D-tier, not just the Bar. A Bar-only pass compresses toward the lower levels
(Tool User / Workflow Agent); the DEPTH tier is what carries an assessment into
Stateful Workroom → Agent OS → Governed Agent Organization. Emit both tiers'
`dimensionScores` (keyed `b1..b11` and `d1..d11`) into the one `assessment-schema.json`
document.

---

## The platform chain

Read top-to-bottom as the lifecycle of an agentic UI: define the standard → run it →
attack it → judge its taste → give it a reference to copy → auto-gate the proof → ship and
prove → prevent regressions in the next app → learn from the corpus.

```
        agent-era-maturity-model            the STANDARD  (rubric family; L0–L5, 12 dims,
                    │                        assessment JSON schema)
                    │  Bar nests as the UI instance
                    ▼
        agentic-ui-qa  ◄── THIS SKILL       the RUNNER  (journeys A0–A6, Bar B1–B11,
                    │                        no-artifact-no-claim, fix/revamp loop)
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   AgentRedteam  VisualJudge / harness4visuals   the ADVERSARY + the TASTE JUDGE
   (attacks)     (calibrated visual scoring)
        │           │
        ▼           ▼
   NodeTrace / Agent Prism                  the REFERENCE OUTPUT  (what good provenance
                    │                        UI looks like — copy the vocabulary)
                    ▼
   proofloop / NodeProof                     the AUTO-GATE  (honest verification; the
                    │                        proof-verdict the loop can't self-close)
                    ▼
   BetterPRHandoff / FeatureClipStudio       SHIP + PROVE  (per-surface changelog +
                    │                        verified demo recording, DOM + video judge)
                    ▼
   NodeBenchBoilerplate                      PREVENT  (next app born high — BAR-DEFAULTS.md
                    │                        is the bridge from this skill into the template)
                    ▼
   NodeRL / NodeMem                          LEARN  (the failure corpus compounds; scores
                                             and fixes feed back up the chain)
```

### Layer-by-layer

**agentic-ui-qa — the RUNNER.** `[shipped]` This skill. Resolves an app profile, runs the
persona journeys A0–A6, scores B1–B11, verifies every claim with an artifact, and runs the
bounded fix→revamp loop (`REVAMP.md` / `PRETTIFY.md`). It is the executable, UI-scoped
instance of the maturity rubric.

**AgentRedteam — the ADVERSARY.** `[in-skill: thin]` `[roadmap: standalone]` Today this is
journey **A6** (empty submits, double-apply, oversized inputs, consent-off egress attempt,
mid-op reload) — a checklist, deliberately thin. The roadmap is a first-class adversary
that *generates* attacks per app instead of running a fixed list, and red-teams the
**substrate itself** (the recurring "attack your own gates" phase from the solo-founder
doctrine — a gate that trusts agent-supplied operands is trust-laundering, and only an
adversary finds that). Until it's standalone, a ceiling-tier model expands A6 inline and
contributes the good attacks back to the profile.

**VisualJudge / harness4visuals — the TASTE JUDGE.** `[in-skill: shipped]` This is
`PRETTIFY.md` + `scripts/prettify-audit.mjs`. `harness4visuals` ≈ the machine scorecard
(VISUAL RUBRIC V1–V9: distinct font-sizes, off-grid rate, palette sprawl, per-node WCAG
contrast, radius/shadow variety, alignment, motion — advisory, always exit 0).
`VisualJudge` ≈ the **vision-judge loop** that scores rendered pixels against the rubric
and picks the winning presentation-only candidate. It is *calibrated taste made
measurable* — B9 exploded from a one-line vibe into signals + a judge. No-vision model
tiers run the audit and DEFER the judge (never guess B9 from the DOM).

**NodeTrace / Agent Prism — the REFERENCE OUTPUT.** `[reference]` + `[in-skill: worked
example]` Agent Prism (Evil Martians, MIT) is the adopted trace-UI vocabulary —
**reference, not dependency**. `NodeTrace` ≈ the concrete worked case in
`examples/trace-revamp/` (a production trace tab taken from flat dump → provenance rail +
tri-signature seal + three honest states, mockup + engineer spec). This is the "here's what
a 2-on-B2 looks like" the revamp playbook (`REVAMP.md` S1) points at. Reference outputs
teach the vocabulary; they are never imported as a stack.

**proofloop / NodeProof — the AUTO-GATE.** `[external]` + `[in-skill: qa-gate pattern]`
`proofloop` (`HomenShum/proofloop-fork`) is the honest-verification lineage this skill's
memory inherits ("remember every failure"). `NodeProof` ≈ the auto-gate pattern — the CI
`ui_ux_qa` / `qa-bar-gate.mjs` from `BAR-DEFAULTS.md` §13 plus the fresh-context judge that
reads only durable disk evidence and returns `done | needs_verification | not_done |
blocked`, blocking the claim when the loop isn't complete. The point of an auto-gate is the
part the loop **cannot self-close**: an out-of-process trust root the agent can't run
inside. A build-green does not close it; a rendered DOM signal + receipt does.

**BetterPRHandoff / FeatureClipStudio — SHIP + PROVE.** `[shipped: as the
easier-to-read-submissions skill]` This is the handoff layer: per-surface changelog entries
(one append-only file per page/component/server-module/table/integration, not one
undifferentiated git log) + a **verified demo recording** with BOTH DOM checks and video
analysis before any "it works" ships. `BetterPRHandoff` ≈ the changelog + reviewable-diff
discipline; `FeatureClipStudio` ≈ the verified feature-clip (the demo that proves the
journey through product code, per the Feature Proof Storyboard). This is where a passing
Bar score becomes a shippable, provable PR — the Live-DOM verification rule made a step in
the pipeline.

**NodeBenchBoilerplate — PREVENT.** `[external]` The GitHub template a new app is scaffolded
from so it's *born* scoring high. **`BAR-DEFAULTS.md` in this skill is the bridge**: it maps
each B1–B11 dimension to a copyable default (the egress gate, the receipt-only provenance
badge, the proposal-only write path, the clean-route scaffold, the testid/aria contract,
the CI `ui_ux_qa` gate). Prevent is cheaper than detect: designing the root-route split up
front is free; retrofitting B11 is a structural revamp.

**NodeRL / NodeMem — LEARN.** `[in-skill: shipped]` + `[roadmap]` `NodeMem` ≈ the
append-only QA memory (`scripts/qa-memory.mjs`, `runs.jsonl` + `findings.jsonl` in each
app's own repo) — findings fingerprinted so re-discoveries dedupe, every fixed P0/P1 a
permanent regression check, `history` showing honest Bar-score drift. The corpus only
grows. `NodeRL` ≈ the roadmap layer that learns from that corpus — turning the accumulated
failure/fix pairs into sharper defaults, better attacks, and tuned judges that flow back up
the chain. Today the loop compounds by hand (SKILL.md §10 folds cold-run friction back in);
NodeRL automates the compounding.

---

## Platform invariants — the anti-gaming ground rules (from solo-founder-agent-builder)

Every layer inherits these. They are the reason a score from this platform is worth
trusting — an app must not be able to GAME a Bar dimension, and scores are held-out and
honest by construction. `[external: HomenShum/solo-founder-agent-builder supplies the
doctrine]`

1. **An app must not be able to GAME a dimension.** A dimension is satisfied by a DERIVED
   artifact (a real receipt, a real transport ledger, a rendered DOM signal), never by a
   display string authored to look good. A hardcoded "✓ live · $0.014" badge scores
   *worse* than an honest absent one — it's a P0 the pass fails closed on. `BAR-DEFAULTS.md`
   makes the honest version the *easy* version (the type system enforces it).

2. **Derive, don't accept.** The scorer DERIVES every gate input from independently
   observed evidence and NEVER accepts it from the run payload. A self-set
   `cleanGeneralProbe=true` is itself an answer-key; a server gate that recomputes a verdict
   from *agent-supplied operands* is trust-laundering, not enforcement. On disagreement:
   **quarantine, don't silently override** — disagreement is signal.

3. **Held-out, no answer keys.** A capability number counts IFF: **generic only** (no
   per-task/per-app writer fired) · **model in the loop** (tokens>0, real transport, not
   `none`) · **held-out** (a task/surface never used to tune the scorer). Otherwise tag
   `answer-key | model-off | replay` and EXCLUDE from the headline. The UI form of the
   per-task-writer cheat is a "demo mode" testid that short-circuits product code — the
   `ui_ux_qa` gate must drive product code, not a mock path.

4. **The three run configs — never report a number without its config.** MODEL-OFF (zero
   tokens) is a **harness failure, not a floor** — never record its near-floor number.
   MODEL-IN-LOOP + GENERIC is **the only config allowed in the headline.** TASK-SPECIFIC /
   family writer is an **answer-key, excluded by construction.**

5. **No receipt, no number.** Any published figure ships with: run path · task count +
   split · writer/mock state · model-transport proof · whether the gate was
   substrate-derived or provisional · live-UI proof status if transfer is claimed. In-UI,
   this is the B10 `[source needed]` rule applied to the app's own chrome.

6. **In-app transfer or it didn't transfer.** A harness/benchmark number only counts if the
   SAME task through the real app UI gives the same result — captured as a concrete DOM
   signal + screenshot + recorded run id (the Fresh-Room Live Browser contract). Never claim
   "verified in-app" on build success / `git push` / CLI exit / CI-green. A pretty surface
   showing the wrong answer still FAILS transfer: **proof first, design parity second.**

7. **Fail closed on divergence.** Headless-pass but browser-fail = harness shortcut;
   headless-fail but browser-pass = harness bug. Either way, don't claim until explained.

8. **The corpus only grows.** Memory is append-only; state changes are new events, never
   deletions; the regression list never shrinks. Cheating is made **detectable and
   expensive**, never claimed **impossible** — red-teaming the platform's own gates is a
   required recurring phase (that's what AgentRedteam is for).

These are not aspirational. They are the operating constraints under which every layer runs
— the standard defines the score, the runner earns it with artifacts, the adversary and the
judge stress it, the auto-gate refuses to close on a self-report, and the memory remembers
every failure so the next app starts higher. That is the platform.
