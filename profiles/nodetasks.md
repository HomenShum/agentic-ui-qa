# QA profile: NodeTasks — public task corpus + benchmark-proxy adapter bundle

> **SCOUTED from repo, NOT yet live-validated — unanswerable rows are B8 findings.**
> Source: platform-scout apps.md (README + source read of `HomenShum/*`, 2026-07-13). No app was launched or driven; rows below are claims to verify. NodeTasks is a **corpus + adapters** (curated task data + benchmark-proxy), explicitly NOT a claim of official leaderboard scores.

## Environment
| Thing | Value |
|---|---|
| Prod URL | **None.** Two local surfaces: **static** browser UI `catalog/task-browser.html` (no backend, uses `catalog/search-index.js`) and a **Streamlit explorer** at `http://127.0.0.1:8502` (`npm run streamlit`) |
| Repo root | UNKNOWN local path — clone `HomenShum/nodetasks` (confirm exact name via `gh repo list HomenShum`) |
| Dev command + port | Zero-setup: open `catalog/task-browser.html` (static, no server) OR `npm run search -- <query>` (CLI). Rich: `pip install -r requirements.txt && npm run streamlit` → `127.0.0.1:8502` |
| Backend / deployments | **None required.** Static HTML + JS index; Streamlit optional. NodeAgent chat panel optionally POSTs to `NODEAGENT_ENDPOINT` (contract in `docs/NODEAGENT_BRIDGE.md`) — leave empty for deterministic local catalog-agent mode |
| Auth path for a QA agent | **NONE for the static/local corpus.** The Streamlit NodeAgent chat panel POSTs to `NODEAGENT_ENDPOINT` only if that env var is set; **leave it empty → deterministic local catalog-agent mode** that cites task ids. QA runs fully offline, no login |
| QA run mode / mutation boundary | **READ-ONLY DIAGNOSTIC by default.** SANDBOX DOGFOOD may use the static/local corpus when asked; keep `NODEAGENT_ENDPOINT` empty unless external execution is explicitly authorized. |
| Typecheck gate | UNKNOWN — mixed JS (catalog) + Python (Streamlit). Check `package.json`; likely no TS typecheck. `npm run validate` is the corpus-integrity gate |
| Test gate | `npm run validate` (corpus validation) · `npm run build:catalog` (deterministic catalog regen). Grep `package.json` for a unit-test script. Persona smoke results in `docs/PERSONA_SMOKE_RESULTS.md` |
| Playwright available in repo? | UNKNOWN — grep `package.json` for `@playwright/test`; static `task-browser.html` is browser-QA-able. Set pixels.cjs `repo` to the clone path if present |
| Evidence dir convention | `<scratchpad>/qa-nodetasks-<YYYYMMDD-HHmm>/` |
| Memory dir (SKILL §9) | `<nodetasks-repo>/.qa/memory/` |

## Provenance surface (ground truth for AI claims — SKILL §1.2)
| Question | Answer |
|---|---|
| Where does the app show what AI did? | **NodeAgent chat panel** over the catalog (local mode **cites task ids** in every answer). Each task carries provenance rollups: verifier type, source kind, primary suite lineage, score-boundary status, receipt expectations |
| LIVE run signals | **Honest-score governance:** adapters separate `productPathCompletion` (a product UI path ran with visible proof artifacts) from `officialSemanticScore` (present ONLY when an upstream verifier is explicitly recorded). Local catalog-agent answers cite task ids. `provenance-index.json` / `ranked-tasks.json` / `saved-views.json` load |
| DEGRADED/fallback signals | With `NODEAGENT_ENDPOINT` empty → **deterministic local catalog-agent mode** (this is the honest fallback, cites ids, no fabricated scores). This is expected, not a degrade defect |
| FAILED signals | **No proxy result is presented as an official score** — `officialSemanticScore` absent unless an upstream verifier is recorded. A proxy result shown as an official leaderboard score would be the P0 violation to hunt |

## First-run behavior (trap U10)
Zero-setup path: open `catalog/task-browser.html` (static, ranked search + saved views) OR `npm run search -- graph nodeagent --limit 5`. Rich path: `pip install -r requirements.txt && npm run streamlit` → `127.0.0.1:8502` (search/sort/filter, saved views, downloadable bundles, provenance rollups, persona lenses, NodeAgent chat). No auth, no modal.

## Live signals (for live-signal.mjs)
Static/local only — point live-signal.mjs at the served static file or :8502. Signals:
1. Corpus size: **9,155 searchable tasks** (58 live-interaction, 1,354 benchmark-target, 5,416 model-attempt, 1,030 extracted unit/browser); **9 saved views**, **9 bundles** — VERIFY these counts against the actual index.
2. `provenance-index.json` / `ranked-tasks.json` / `saved-views.json` present and loading.
3. Deep-link URL resolves: `?view=browser-proof-surfaces&persona=Product%20QA`.
4. Persona-lens labels: benchmark maintainer, model evaluator, product QA, finance analyst, new contributor.
5. Score-boundary language present per task (productPathCompletion vs officialSemanticScore).

## Journey mapping (archetypes A0–A6 → concrete steps)
- **A0 Smoke:** open `catalog/task-browser.html` → ranked search renders; `npm run search -- graph nodeagent --limit 5` returns cited task ids; `npm run streamlit` → :8502 loads. Pixels light/dark.
- **A1 Core creation (no AI egress):** run a search/sort/filter (domain, kind, difficulty tier, cost tier, tags) → apply a persona lens → save a view → verify saved views persist (`saved-views.json`) and deep-link URL round-trips.
- **A2 Live AI action (consent → propose → provenance → accept):** Streamlit NodeAgent chat panel in **local mode** (endpoint empty) → ask a catalog question → answer **cites task ids** with no fabricated scores. (Optional: point `NODEAGENT_ENDPOINT` at a real NodeAgent per `docs/NODEAGENT_BRIDGE.md` — but local mode is the honest default and sufficient for QA.)
- **A3 Provenance audit (HERO for this app):** open a task → confirm curation (summary, why-it-matters, first-run, caution, personas, score-boundary language) + provenance (suite lineage, verifier type, score status, receipt expectations, source kinds). Assert `officialSemanticScore` is ABSENT unless an upstream verifier is recorded; `productPathCompletion` is separate.
- **A4 Output & sharing:** download a task **bundle** from Streamlit; share a saved-view deep-link; `npm run build:catalog` regenerates deterministically (byte-stable).
- **A5 Themes & access (trap U11):** UNKNOWN dark-mode in static/Streamlit surfaces — inspect; test both.
- **A6 Adversarial:** malformed deep-link (`?view=` garbage / unknown persona) → graceful fallback, not crash; NodeAgent chat asked for a score a task doesn't have → must refuse/omit (no fabricated official score); re-run `build:catalog` twice → identical output (determinism).

## App-specific traps (beyond universal U1–U13)
- **Corpus, not an app** — QA target is data integrity + honest-score governance, not a live agent product. Findings are about provenance correctness and determinism.
- **Honest-score doctrine is the headline** — `productPathCompletion` ≠ `officialSemanticScore`; anti-reward-hacking (`noderl`); certification loop (locked UI path + immutable verifier + proof receipt) vs exploration loop. Any proxy result dressed as an official score = P0.
- **Local catalog-agent mode is the SAFE default** — an empty `NODEAGENT_ENDPOINT` is correct, not broken; don't file it as "AI not working." Setting the endpoint requires a real NodeAgent deployment.
- **Counts are load-bearing claims** — 9,155 tasks / 9 views / 9 bundles are specific and must be verified against the real index (`npm run validate`), not assumed.
- **Vendored upstream ≠ live** — `upstream/noderoom/convex/*` is vendored for reference; live prod tasks still need a real NodeRoom deployment + credentials (out of scope for corpus QA).

## Known product behaviors that are NOT bugs
- Empty `NODEAGENT_ENDPOINT` → deterministic local catalog-agent mode is intended.
- Absence of `officialSemanticScore` on most tasks is the honest-score stance, not missing data.
- Static `task-browser.html` having no backend is by design (shareable offline).

## Last Bar score (update each pass; lowest = next improvement target)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | not yet scored | SCOUTED only. Paper read: B2 (honest-score provenance, productPathCompletion-vs-officialScore, anti-reward-hacking) is the corpus's core promise — strongest and the thing to stress-test; B5 (deterministic local-agent fallback) architectural. B8 UNKNOWNs: typecheck presence, unit-test script, dark-mode, Playwright — resolve via package.json. HERO journey = A3 provenance audit + A6 "ask for a score that doesn't exist" (must refuse). Verify the 9,155/9/9 counts before quoting them. |
