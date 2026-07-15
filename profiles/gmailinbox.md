# QA profile: GmailInbox (Gmail Workspace) — local-first inbox → decisions

> **SCOUTED from repo, NOT yet live-validated — unanswerable rows are B8 findings.**
> Source: platform-scout apps.md (README + source read of `HomenShum/*`, 2026-07-13, branch `feature/nodeslide-domain`). No app was launched or driven. Every URL / auth path / live signal below is a claim to verify on a real dogfood run.

## Environment
| Thing | Value |
|---|---|
| Prod URL | **None confirmed.** Vercel is the stated public host TARGET (not confirmed live). GitHub Pages workflow (`pages.yml`) publishes only the public-safe demo `public/demo/today-queue.html`. VERIFY whether a Pages URL is live via `gh workflow view pages.yml` on the clone |
| Repo root | UNKNOWN local path — clone `HomenShum/<gmail-inbox-repo>` (confirm exact name via `gh repo list HomenShum`) |
| Dev command + port | **`bun run dev` → `http://localhost:3030`** (Bun/Next.js). QA no-auth shortcut: `bun run seed` writes synthetic `seed_*` rows |
| Backend / deployments | Next.js. Local SQLite `src/data/gmail.db` (tokens AES-256-GCM encrypted). MCP stdio server `mcp-server/src/index.ts`. NodeBench job-research bridge via REST/hosted MCP |
| Auth path for a QA agent | **TWO paths.** (1) **No-auth (preferred for QA):** `bun run seed` → synthetic `seed_*` rows coexist with real `gm_*` rows → drive full UI, zero OAuth. (2) **Full Google OAuth (self-provisioned, `SETUP_GMAIL.md`):** create Google Cloud OAuth Web-app client, redirect URI `http://localhost:3030/api/auth/google/callback`, put `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env.local`, then Settings → Gmail tab → **Connect Gmail** → consent (app stays in "Testing" mode). **DO NOT do OAuth for a QA pass — use seed.** |
| QA run mode / mutation boundary | **READ-ONLY DIAGNOSTIC by default.** Use SANDBOX DOGFOOD only on synthetic `seed_*` rows when asked; OAuth and real Gmail writes require explicit authorization. |
| Typecheck gate | UNKNOWN — check `package.json`; Next+Bun projects usually `tsc --noEmit` or `next lint`. Confirm on clone |
| Test gate | UNKNOWN — check `package.json` scripts (`bun test`?). Confirm on clone |
| Playwright available in repo? | UNKNOWN — grep `package.json` for `@playwright/test`; if present set pixels.cjs `repo` to the clone path |
| Evidence dir convention | `<scratchpad>/qa-gmailinbox-<YYYYMMDD-HHmm>/` |
| Memory dir (SKILL §9) | `<gmailinbox-repo>/.qa/memory/` |

## Provenance surface (ground truth for AI claims — SKILL §1.2)
| Question | Answer |
|---|---|
| Where does the app show what AI did? | **Full-height right-side chat rail:** NodeBench-style anatomy `plan → tool_start → tool_done → answer → ledger` with visible steps, tool calls, latency, est. cost, model route, source count. Collapsed run/tool ledger + collapsed **proof drawer**. Explicit permission boundary showing **`0 writes` until approval** |
| LIVE run signals | Chat run strip shows step / tool / latency / est-cost / model-route / source-count. Same `TOOL_LIST`/handlers are exposed via MCP stdio server (Claude Code/Cursor/Windsurf) with zod schemas per tool + lazy dashboard auto-open on first real tool call |
| DEGRADED/fallback signals | **HONEST_STATUS mutation contract:** `archive_email`/`bulk_archive`/`snooze_email` mirror to Gmail FIRST (`users.messages.modify`, then re-fetch to confirm). On Gmail error → `{ ok:false, error }` and **local state untouched** (reversible). Job-research prefers hosted MCP, **falls back to REST**. VERIFY the fallback is labeled, not silent |
| FAILED signals | `{ ok:false, error }` returned + local row unchanged (forced Gmail error is a test to run). VERIFY the UI reflects the failure honestly rather than optimistic success |

## First-run behavior (trap U10)
Fastest QA path: `bun run seed` then `bun run dev` → open `localhost:3030` → lands on **Today Queue** (one oversized next-best-action + one ranked queue; filters Now/Prep/Batch/Later). Pre-OAuth the TopBar pill reads **"Not connected"**. No modal wall — synthetic data drives the whole workspace. Full path adds a 5-min OAuth walkthrough → **Sync now** (paginated `messages.list` INBOX, ≤500 msgs, metadata-only) → heuristic classifier tags each row.

## Live signals (for live-signal.mjs)
Note: local-only (localhost:3030) or the static Pages demo `today-queue.html` — no confirmed prod SPA. Signals to grep in the served HTML/DOM:
1. TopBar connection pill: `Not connected` (pre-OAuth) / `Connected` + "Sync now" (post-OAuth).
2. Today Queue filter labels: `Now` / `Prep` / `Batch` / `Later`.
3. Chat run strip tokens: step / tool / latency / cost / model / source-count / `0 writes`.
4. Workspace lane routes: `today`, `triage`, `inbox`, `jobs`, `opportunities`, `career`, `calendar`, `goals`, `briefings`, `automations`, `analytics`, `planner`, `pulse`, `personal`, `settings`.
5. `Cmd/Ctrl+K` command palette (person/company/action search).

## Journey mapping (archetypes A0–A6 → concrete steps)
- **A0 Smoke (READ-ONLY):** launch the already-seeded local app with `bun run dev` → Today Queue renders synthetic rows; tab through the 15 workspace lanes; TopBar pill = "Not connected". Pixels light/dark. If seed data is absent, mark `SKIPPED(needs sandbox seed)`; run `bun run seed` only in authorized SANDBOX DOGFOOD.
- **A1 Core creation (no AI egress):** triage/archive a synthetic email via non-AI UI path; verify local DB row updates and persists across reload. `Cmd/Ctrl+K` resolves person/company/action; Now/Prep/Batch/Later filter the queue.
- **A2 Live AI action (consent → propose → provenance → accept):** open chat rail → ask (e.g. "draft a reply to the recruiter email") → run strip shows plan→tool_start→tool_done with latency/cost/model/source-count → draft stops at **approval gate** (`0 writes` until approve) → approve → verify write. **HONEST_STATUS test:** force a Gmail error on `archive_email` (or run on seed where Gmail mirror is absent) and confirm `{ ok:false }` + local row unchanged.
- **A3 Provenance audit:** expand the collapsed run/tool ledger + proof drawer; verify latency/cost/model-route/source-count are real (not hardcoded). Confirm body content is NOT fetched by default (`format: "metadata"`).
- **A4 Output & sharing:** NodeBench Job Research Bridge — "Run research" on a ranked job email POSTs to `/api/nodebench/job-research`; **verify the request preview carries no raw email, no raw resume** (privacy flags visible); dossier stored in `job_research_contexts` with metering/cost.
- **A5 Themes & access (trap U11):** UNKNOWN dark-mode mechanism — inspect for toggle/`prefers-color-scheme`; 3 viewports.
- **A6 Adversarial:** submit empty chat composer; double-fire an archive; force Gmail 4xx/5xx and confirm reversibility; confirm no private inbox content leaks into the job-research request preview; re-run `bun run seed` and confirm idempotency (PK `gm_<id>` / `seed_*`).

## App-specific traps (beyond universal U1–U13)
- **Do NOT run OAuth for QA** — `bun run seed` gives full-fidelity no-auth dogfooding; OAuth is a Prohibited/Explicit-permission surface (account credentials) and unnecessary.
- **Privacy invariant to actually test:** "private data stays local, public research delegated to NodeBench" — the job-research request preview must contain no raw email/resume. This is the headline claim to stress.
- **Mirror-before-local ordering:** archive/snooze mirror to Gmail BEFORE local state — a green local UI with a failed Gmail mirror would be a P0 HONEST_STATUS violation (the contract says it can't happen; verify it holds).
- **MCP pattern lineage:** the stdio server is explicitly "lifted from parity-studio mcp/src/index.ts" — same MCP shape as the current parity-studio repo; a parity-studio MCP reviewer's findings likely transfer.
- **Two data namespaces coexist:** `seed_*` (synthetic) and `gm_*` (real) rows live in the same DB — don't mistake seed rows for a real-account leak.

## Known product behaviors that are NOT bugs
- Body content not fetched by default (metadata-only) is a deliberate privacy stance, not missing data.
- Synthetic `seed_*` rows appearing alongside real rows is by design.
- Public Pages demo showing only `today-queue.html` (not the full app) is intended (public-safe subset).

## Last Bar score (update each pass; lowest = next improvement target)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | not yet scored | SCOUTED only. Paper read: B1 (consent/`0 writes` gate) + B3 (propose-before-mutate approval) + B5 (HONEST_STATUS `{ok:false}` reversibility) look architecturally strong — VERIFY they hold live, especially the mirror-before-local ordering. B8 UNKNOWNs: typecheck/test/Playwright gates + dark-mode mechanism + whether any prod URL is live (resolve via clone package.json + pages.yml). Fastest path to real score = `bun run seed` then drive A0–A3 on synthetic data. |
