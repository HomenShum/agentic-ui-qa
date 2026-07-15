# QA profile: NodeBench AI (nodebenchai.com)

Scouted 2026-07-12 (read-only, repo evidence cited). NOTE the disambiguation trap below.

## Environment
| Thing | Value |
|---|---|
| Prod URL | `https://www.nodebenchai.com` · production surface `/?surface=packets` · hosted public MCP `https://nodebench-mcp-unified.onrender.com?profile=public-research` |
| Repo root | `D:\VSCode Projects\cafecorner_nodebench\nodebench_ai4\nodebench-ai` ← the LIVE repo. `cafecorner_nodebench` is a WORKSPACE of ~15 repos; siblings `nodebench` (no .git), `nodebench_ai3` (stale 2025), `scratchnode-live` (extract) are NOT the target |
| Backend | Convex (19 domains, @convex-dev/auth) + Node/Express server (search, SSE, voice, MCP gateway) + Vercel (host rewrites also serve scratchnode.live from this project) |
| Auth path | NONE NEEDED: guests get the FULL cockpit (Unauthenticated branch renders CockpitLayout + GlobalFastAgentPanel). Optional one-click `signIn("anonymous")` in WorkspaceRail. Providers: Password/Anonymous/EmailMagicLink/Google |
| QA run mode / mutation boundary | **READ-ONLY DIAGNOSTIC on production by default.** Submitting an agent prompt, accepting a proposal, creating data, or invoking paid/external services requires an isolated local/test identity or explicit AUTHORIZED PRODUCTION scope. |
| Dev | `npm run dev` (parallel: vite :5173 + convex dev + voice server; voice lane needs `.env.local`) |
| Typecheck gate | `npx tsc --noEmit` → 0 (ONBOARDING bar); full composite = `npm run lint` (agentNativeUiLinter + tsc×2 + convex typecheck + vite build) |
| Test gate | `npm run test:run` (segmented vitest) · `npm run test:e2e` · **live smoke: `npm run live-smoke`** (playwright tests/e2e/live-smoke.spec.ts) |
| Playwright | YES — pixels.cjs `"repo": "D:/VSCode Projects/cafecorner_nodebench/nodebench_ai4/nodebench-ai"` |
| Deploy verify | REUSE the repo's own: `npm run post-deploy:verify` / `scripts/verify-live.ts` (defaults to www.nodebenchai.com) — do not invent parallel checks |

## Provenance surface (ground truth)
- **ProposalBar/ProposalProvider + diffUtils** — AI proposal/review flow (B3 surface).
- **OracleSessionProvider + EvidenceProvider** wrap the whole app — evidence/provenance context.
- **Pi-AI pipeline lane** on Reports: runs, streaming previews, eval scorecard.
- Hosted MCP responses carry metering provenance headers
  `x-nodebench-request-id/-profile/-auth-mode/-account-key` — verifiable per request.
- LIVE vs degraded classification: verify a pipeline run shows model/run identity and the
  eval scorecard; any green scorecard with no run identity = P0.

## First-run (U10)
No modal, no wall: guest cockpit straight away (Home surface, `?surface=` routing).
After AUTH sign-in a TutorialPage may appear first (`showTutorial`) — that's the U10
surface for the authed persona, not a bug.

## Live signals
`NodeBench AI` title · rendered DOM: `data-app-id="nodebench-ai"`,
`data-agent-surface="app"`, "Entity Intelligence" copy. HTML ships
`no-cache/no-store` (vercel.json) so live-DOM verification of fresh deploys is reliable
(U9 largely defused here — verify raw first, it may actually contain content).

## Journey mapping (A0–A6)
- A0 Smoke: verify-live.ts or live-signal → pixels of guest cockpit (Home) light/dark →
  canonical nav works: `?surface=home|reports|chat|inbox|me` each renders its surface;
  StatusStrip + WorkspaceRail + CommandBar present.
- A1 Core creation (no AI): create/browse a report or capture via non-AI path; verify it
  persists for the session identity.
- A2 Live AI action (HERO): GlobalFastAgentPanel as guest → concrete ask → response
  streams (SSE) with staged status; if it yields a proposal → ProposalBar diff → accept →
  verify applied state + evidence context. On Reports: run a Pi-AI lane item and verify
  run identity + scorecard.
- A3 Provenance audit: EvidenceProvider surfaces + MCP `x-nodebench-*` headers (curl the
  hosted MCP with profile=public-research and check headers) + eval scorecards.
- A4 Output & sharing: report/packet output paths (`?surface=packets`); deep research
  hands off to the separate Workspace surface — verify the handoff, don't flag the
  missing sixth tab (by design).
- A5 Themes/access: 3 viewports (MobileTabBar exists — mobile is a real surface here,
  unlike NodeRoom), dark mode per app toggle (U11 check), focus states in CommandBar/rail.
- A6 Adversarial: empty composer submits; double-fire a pipeline run; guest-vs-auth
  boundary (guest must not see authed data); malformed `?surface=` value; SSE drop mid-
  stream (reload recovers).

## App-specific traps
- **Repo disambiguation** (above) — wrong sibling = wasted pass.
- Guests seeing the full cockpit is EXPECTED (not an auth-leak finding by itself).
- `postinstall` mutates generated convex exports (`patch-crons-exports.mjs`) — a plain
  `npm install` dirties the tree; check `git status` before blaming your own edits (U7).
- Same Vercel project serves `scratchnode.live` via host rewrite → `/proto/home-v5.html`;
  host-based probes can hit the wrong surface.
- Voice server lane fails without `.env.local` while vite still comes up — a partial dev
  boot is not a product bug.
- **B8 prior art IN-HOUSE:** the app self-instruments for agents — WebMCP data attributes
  (`data-app-id`, `data-agent-surface`, `data-mcp-compat="webmcp chrome-devtools-mcp"`,
  `data-webmcp-enabled`) and an agent-native UI linter
  (`scripts/ui/agentNativeUiLinter.mjs`) that runs inside `npm run lint`. Other apps
  (NodeSlide, NodeRoom) should adopt both; when QA-ing NodeBench, RUN the linter — its
  output IS a B8 finding list.

## Known behaviors that are NOT bugs
Deep research in separate Workspace surface · guest cockpit · tutorial after auth ·
scratchnode.live cohabitation.

## Last Bar score (lowest = next improvement target; choose mode by mechanism)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | not yet scored | First pass pending. Paper read (verify in-UI): B8 likely strongest of the three apps (WebMCP attrs + agent-native linter + no-cache HTML); B2 verifiable via MCP provenance headers; risk areas: B1 (guest egress consent surface?), B5 (pipeline failure states). |
