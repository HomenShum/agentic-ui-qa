# QA profile: NodeRoom Live (noderoom.live)

Scouted 2026-07-12 (read-only, repo evidence cited). Active repo, branch codex/main-merge.

## Environment
| Thing | Value |
|---|---|
| Prod URL | `https://noderoom.live` (confirmed: package.json qa/benchmark scripts target it) |
| Repo root | `D:\VSCode Projects\noderoom-main-merge` |
| Backend | Convex — prod pinned `zealous-goshawk-766` (convex:deploy:guard enforces) |
| Auth path | Anonymous — no accounts. Create/join with 6–12 char room code + display name; session persists in localStorage `noderoom:live:<CODE>`. No access-code env var |
| QA run mode / mutation boundary | **READ-ONLY DIAGNOSTIC on production by default.** Create/join, agent prompts, review-mode changes, approvals, and collaborative writes require local in-memory mode or a named disposable test room; production writes require explicit AUTHORIZED PRODUCTION scope. |
| Dev | `npm run dev` (vite, port 5260, strictPort; preview serves same port) |
| Typecheck gate | `npm run typecheck` (+ convex: `npx tsc --noEmit --project convex/tsconfig.json`) |
| Test gate | `npm test` (vitest) · e2e `npm run test:e2e` · composite release gate `npm run prod:gate` |
| Playwright | YES — pixels.cjs `"repo": "D:/VSCode Projects/noderoom-main-merge"` |
| Done-claims | Repo policy: accepted ONLY from deterministic gates (`npm run proofloop -- gate`), never screenshots/transcripts — align reports accordingly |

## Provenance surface (ground truth)
Per-room **Trace tab** (`trace-tab` testid): agent + QA trace records, workpapers, receipts
(TraceSurface/TraceObservability). Model routing is orchestrator/worker (`glm-5.2` / `minimax-m3`).
- LIVE: trace records with model attribution; agent writes visible as versioned CAS ops.
- Approval-governed: **auto-allow vs review** toggle (host-only) decides whether agent
  writes commit directly or queue; **CRS proposals** (Compare-Reason-Swap) turn stale agent
  writes into reviewable proposals; notebook jobs gate on an approved exact `planHash`.
- Server-derived job policy: client submits intent; server owns model/approval/evidence
  policy — a client-side "model choice" claim is a red flag.

## First-run (U10)
No login, no modal: landing hero "Diligence that shows its work.", `create-room` /
`join-room-code` testids, ENTER CODE field. Entering a room prompts display name, then
RoomShell — where the **GuidedTour spotlight auto-opens once** (localStorage
`noderoom:tour:v1`) and can block interaction: close it (or pre-clear the key) first.

## Live signals
Raw HTML (SPA — only title/meta): `NodeRoom — live collaborative room with NodeAgents`,
meta "humans and NodeAgents edit a shared spreadsheet, note, and post-it wall".
Rendered-DOM only: `Diligence that shows its work.`, `One code to join, no accounts`,
testids `join-room-code`, `create-room`.

## Journey mapping (A0–A6)
- A0 Smoke (READ-ONLY): live-signal title → pixels of the production landing light/dark →
  verify `create-room` / `join-room-code` are reachable; do not create/join or dismiss the
  persisted tour. RoomShell/tab/Copilot checks move to A1 in local mode or a named disposable
  test room under SANDBOX DOGFOOD.
- A1 Core creation (no AI): edit spreadsheet cell + note + post-it as human; verify
  versioned writes land and survive reload (localStorage rejoin).
- A2 Live AI action (HERO): host sets **review mode** (not auto-allow) → ask the room
  NodeAgent for a concrete edit → verify the write QUEUES as a reviewable item (not
  direct-commit) → approve → verify Trace tab records the run with model attribution.
  Then flip auto-allow and verify direct-commit is visibly attributed too.
- A3 Provenance audit: Trace tab — classify runs; planHash approval visible for notebook
  jobs; any unattributed agent write = P0.
- A4 Output & sharing: copy-invite (command palette) → join from a second context with the
  code; Always-On read-only rooms (`#rooms/<slug>`) render without a session.
- A5 Themes/access: desktop viewport ONLY for the room (see trap below); 3 viewports on
  the landing; focus visibility in the rail and tab strip.
- A6 Adversarial: join a nonexistent code (expect "Room X was not found"); concurrent
  edit same cell from two sessions (expect CAS/CRS, no silent overwrite); reload
  mid-agent-run (session rejoins; no phantom state); empty chat submit.

## App-specific traps
- **Mobile hijack:** viewport ≤760px or mobile UA auto-rewrites to `#mobile` — a MOCK-DATA
  demo surface, NOT the live room. QA must use desktop viewport (or `?surface=desktop`).
  A "room is broken on mobile" finding must first rule this redirect out.
- **In-memory mode:** without `VITE_CONVEX_URL` the app runs a keyless deterministic
  engine with scripted agents and the landing shows `start-demo-room` instead of
  `create-room`. If you see that testid, you are NOT testing prod behavior.
- GuidedTour overlay (above) · strict CSP (`script-src 'self'`; inline injection fails —
  pixels.cjs evaluate still works, it's not an injected <script>) · URL params `?demo=`,
  `?create=`, `?room=<code>&name=<n>` seed rooms atomically.
- CLAUDE.md declares immutable files (scripts/proofloop.mjs, .github/workflows/, evalStore)
  — QA fixes must never touch them.
- Hash routes worth smoke-checking: `#story`, `#btb`, `#frontier`, `#rooms/<slug>`.

## Known behaviors that are NOT bugs
Guests-only anonymous model; server may disable anonymous via
`NODEROOM_REQUIRE_CONVEX_IDENTITY=1` (default 0); demo room "Startup Banking Diligence
War Room" via `?demo=`.

## Last Bar score (lowest = next improvement target; choose mode by mechanism)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | not yet scored | First pass pending. Paper read (verify in-UI): B3/B4 look strong (CRS, planHash, review mode, server-owned policy); B8 strong on testids; risk areas: B6 (agent latency staging), mobile-surface honesty. |
