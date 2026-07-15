# QA profile: NodeGraph — TypeScript semantic-graph layer

> **SCOUTED from repo, NOT yet live-validated — unanswerable rows are B8 findings.**
> Source: platform-scout apps.md (README + source read of `HomenShum/*`, 2026-07-13). No app was launched or driven; rows below are claims to verify. NodeGraph is a **library**, not a hosted product — QA drives the local showcase example.

## Environment
| Thing | Value |
|---|---|
| Prod URL | **None — it's a TypeScript library** (package name `nodegraph`, extracted from NodeRoom). **Local showcase app** at `http://127.0.0.1:5174` (`npm run example:dev`) + a Streamlit example (`examples/streamlit/app.py`) |
| Repo root | UNKNOWN local path — clone `HomenShum/nodegraph` (confirm exact name via `gh repo list HomenShum`) |
| Dev command + port | `npm run example:dev` → React Flow showcase at **`127.0.0.1:5174`**. Streamlit: run `examples/streamlit/app.py` |
| Backend / deployments | **None — pure library + local example.** No server, no login. Core (derivation/filter/select/layout) is pure TS; a React detail panel ships for NodeRoom-style sidebars. Optional Neo4j sync PLAN generated (not a live DB) |
| Auth path for a QA agent | **NONE.** Drive the example app or import the package. No env var, no access code |
| QA run mode / mutation boundary | **READ-ONLY DIAGNOSTIC by default.** SANDBOX DOGFOOD may exercise the local showcase and local import/export only when asked; there is no production target. |
| Typecheck gate | `npm run typecheck` (first-run sequence: `npm install → npm run typecheck → npm test → npm run build`) |
| Test gate | `npm test`. Also `npm run build`. `npm run showcase:capture` regenerates the README GIF (needs `ffmpeg` on PATH) |
| Playwright available in repo? | UNKNOWN — grep `package.json` for `@playwright/test`; showcase is a Vite/React-Flow app at :5174 so browser-QA is feasible. Set pixels.cjs `repo` to the clone path if present |
| Evidence dir convention | `<scratchpad>/qa-nodegraph-<YYYYMMDD-HHmm>/` |
| Memory dir (SKILL §9) | `<nodegraph-repo>/.qa/memory/` |

## Provenance surface (ground truth for AI claims — SKILL §1.2)
| Question | Answer |
|---|---|
| Where does the app show what AI did? | **Relationship-review layer** = the governance surface. `buildGraphRelationshipReviewPlan(graph, id)` classifies edges as **source-backed confirmations vs relationships still needing reviewer confirmation**, returning deterministic JSON receipts for audits. `src/EntityGraphDetailPanel.tsx` = selection sidebar; `src/NodeGraphAgentPanel.tsx` = mountable agent panel |
| LIVE run signals | `nodegraph.document` **v1 contract** carries a deterministic graph **revision** + source **provenance**; survives JSON round-trip. Edges use semantic verbs: `researched`, `cited`, `supported_by`, `authored`, `updated`, `proposed`, `reviewed`, `triggered`. Agent tools via `createNodeGraphAgentTools({ getGraph })`; `src/nodeAgentBridge.ts` bridges to the canonical NodeRoom NodeAgent runtime (NodeGraph does NOT replace NodeAgent) |
| DEGRADED/fallback signals | N/A — deterministic pure-TS library; there is no model call inside NodeGraph itself (the LLM is the external NodeAgent via bridge). "Degrade" here = a diff/sync-plan that fails round-trip determinism |
| FAILED signals | Relationship-review receipt separates **confirmed vs needs-confirmation** edges deterministically — an unconfirmed (not source-backed) edge is the flagged state a reviewer/agent must confirm |

## First-run behavior (trap U10)
`npm install → npm run typecheck → npm test → npm run build`, then `npm run example:dev` → open `127.0.0.1:5174`. Showcase (React Flow): draggable nodes, neighborhood focus, evidence filtering. First view = the graph canvas + toolbar (export canonical JSON / Neo4j sync plan / import prior document). No auth, no modal.

## Live signals (for live-signal.mjs)
Local only (`127.0.0.1:5174`) — not a hosted prod URL, so live-signal.mjs points at localhost. Signals in the showcase DOM/exports:
1. React-Flow canvas with draggable nodes + toolbar (export/import buttons).
2. `nodegraph.document` v1 JSON with a `revision` field + provenance.
3. Semantic edge verbs (`researched`/`cited`/`supported_by`/`authored`/`updated`/`proposed`/`reviewed`/`triggered`).
4. Relationship-review receipt JSON (confirmed vs needs-confirmation).
5. Neo4j sync-plan output (incremental / prune-missing).

## Journey mapping (archetypes A0–A6 → concrete steps)
- **A0 Smoke (READ-ONLY):** with dependencies already present, run `npm run example:dev` → :5174 renders the graph canvas; capture light/dark without dragging/importing. If dependencies are absent, mark `SKIPPED(needs sandbox install)`; `npm install`, build outputs, and mutation journeys require SANDBOX DOGFOOD/change authority. Run typecheck/tests as read-only gates when they do not rewrite artifacts.
- **A1 Core creation (no AI egress):** drag/pin nodes → reload → **positions + pinned ids persist** (the v1 contract guarantee); focus a neighborhood; filter by evidence. Import a prior document via toolbar and confirm round-trip.
- **A2 Live AI action (consent → propose → provenance → accept):** mount `NodeGraphAgentPanel` bridged to the NodeAgent runtime (`src/nodeAgentBridge.ts`) → agent calls graph tools (`createNodeGraphAgentTools`) → new edges appear as **proposed**, requiring reviewer confirmation before becoming source-backed. (The AI itself lives in NodeAgent; NodeGraph governs the acceptance.)
- **A3 Provenance audit (HERO for this app):** `buildGraphRelationshipReviewPlan(graph, id)` → receipt separates source-backed vs needs-confirmation edges deterministically. `diffNodeGraphDocuments` reports exact node/relationship/cluster upserts+removals BEFORE apply; `buildNeo4jSyncPlan` produces the incremental plan. `selectSemanticNeighborhood`/`selectSemanticGraphCluster` isolate a cluster with bounded neighbor rings + ranked multi-hop paths (person→company, claim→source, agent→artifact). `summarizeSemanticGraphClusters` ranks clusters by connected evidence.
- **A4 Output & sharing:** toolbar exports canonical JSON document or a parameterized Neo4j sync plan; Streamlit export path for non-React hosts. Verify JSON round-trips losslessly.
- **A5 Themes & access (trap U11):** UNKNOWN dark-mode in the showcase — inspect; test the detail panel + agent panel in both themes.
- **A6 Adversarial:** import a malformed `nodegraph.document` (wrong revision / corrupt JSON) → confirm rejection, not silent partial load; confirm a non-source-backed edge cannot be presented as confirmed; run diff on identical docs → expect empty deterministic diff (no phantom churn).

## App-specific traps (beyond universal U1–U13)
- **Library, not an app** — there is no product UI to "break"; the QA target is the showcase + the deterministic contracts. Findings are about contract integrity (round-trip, diff determinism, receipt correctness), not visual craft primarily.
- **NodeGraph does NOT contain the LLM** — it bridges to NodeAgent. Any "AI action" test requires wiring the NodeAgent runtime; testing NodeGraph alone = testing the governance/receipt layer.
- **Determinism is the invariant** — `nodegraph.document` v1 must survive JSON round-trip with stable `revision`; layout + pinned ids persist. A non-deterministic diff/sync-plan is a P0 (violates the audit-receipt promise).
- **`showcase:capture` needs `ffmpeg` on PATH** — GIF regen fails without it (not a product bug).
- **Source-backed vs needs-confirmation is the public version of NodeRoom's graph confirmation layer** — the review receipt IS the trust artifact; a confirmed edge with no source is the failure to hunt.

## Known product behaviors that are NOT bugs
- No login / no server (pure library) is by design.
- Neo4j output is a sync PLAN, not a live DB write — it does not require a running Neo4j.
- No internal degrade/model-status surface (no model call inside NodeGraph).

## Last Bar score (update each pass; lowest = next improvement target)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | not yet scored | SCOUTED only. Paper read: B2 (deterministic provenance receipts, source-backed-vs-needs-confirmation) is the app's whole reason to exist — strongest dimension; B3 (proposed edges need confirmation before apply) architectural. B9/B10 (visual craft/content) less central for a library. B8 UNKNOWNs: dark-mode + Playwright presence + exact clone path — resolve via package.json. HERO journey = A3 provenance audit (receipt + diff determinism), verifiable purely by asserting on the exported JSON. |
