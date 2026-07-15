# QA profile: NodeVoice — shared-state voice rooms

> **SCOUTED from repo, NOT yet live-validated — unanswerable rows are B8 findings.**
> Source: platform-scout apps.md (README + source read of `HomenShum/*`, 2026-07-13, branch `feature/nodeslide-domain`). No app was launched or driven. Every URL / auth path / live signal below is a claim to verify on a real dogfood run.

## Environment
| Thing | Value |
|---|---|
| Prod URL | `https://nodevoice.vercel.app` (claimed live, QR-joinable "no laptop needed" — VERIFY it actually loads a room) |
| Repo root | UNKNOWN local path — clone `HomenShum/nodevoice` (formerly "Room OS"); confirm dir name via `gh repo view HomenShum/nodevoice` then `git clone` |
| Dev command + port | UNKNOWN exact command — scout says frontend on Vercel, state+voice on Convex; check `package.json` scripts (likely `npm run dev` = vite + `convex dev`). `scripts/live.mjs` is the live-capture entry |
| Backend / deployments | Convex (server-authoritative ledger: query=read, mutation=reducer, action=LLM/STT/TTS) + Vercel frontend. Marketing assets rendered by `HomenShum/FeatureClipStudio` |
| Auth path for a QA agent | **ANONYMOUS — no login.** Create or join a room. Rooms keyed by short human join code (`rooms.code`); `rooms.private=true` unlists from lobby (joinable only via link/QR/code); public rooms show in lobby. This is the entire access gate. No env var / access-code retrieval needed |
| QA run mode / mutation boundary | **READ-ONLY DIAGNOSTIC on production by default.** Creating/joining a room, interrupting a run, or invoking agents requires an isolated local sandbox or explicit AUTHORIZED PRODUCTION scope. |
| Typecheck gate | UNKNOWN — check `package.json` for `tsc`/`typecheck` script; Convex projects typically `npx tsc --noEmit` + `convex` typegen |
| Test gate | UNKNOWN — check `package.json` scripts. `scripts/live.mjs` exists for live capture (not a unit-test gate) |
| Playwright available in repo? | UNKNOWN — grep `package.json` for `@playwright/test`; if present, set pixels.cjs `repo` to the local clone path |
| Evidence dir convention | `<scratchpad>/qa-nodevoice-<YYYYMMDD-HHmm>/` |
| Memory dir (SKILL §9) | `<nodevoice-repo>/.qa/memory/` |

## Provenance surface (ground truth for AI claims — SKILL §1.2)
| Question | Answer |
|---|---|
| Where does the app show what AI did? | **State drawer** (version-specific room JSON: `durableRoomState`/`reducer`/`intentRouter`) + **`trace-tree-view`** (`components/agents-ui/trace-tree-view`) showing evidence traces. Contract: "The model is never trusted to coordinate" — mutations advance floor + suppress ack loops, actions only phrase+voice |
| LIVE run signals | Model seen in source: `gpt-5.4-mini`. `trace-tree-view` events with timestamps: `state_reduced`, `utterance_received`, `intent_interpreted`, `scheduler_selected`. `commitAgentTurn` re-validates floor/token server-side before landing. VERIFY model id is actually surfaced in-UI, not just in code |
| DEGRADED/fallback signals | Speech is best-effort: `audioId` optional on `commitAgentTurn` — if TTS fails, transcript still advances (turn lands without audio). VERIFY the UI labels a no-audio turn honestly rather than silently |
| FAILED signals | `commitAgentTurn` mutation **rejects** a stale turn (LLM+TTS is non-transactional/seconds-long, floor may have changed). `runToken` cancels stale scheduler hops. VERIFY a rejected commit surfaces somewhere (trace/drawer), not swallowed |

## First-run behavior (trap U10)
Fresh anonymous session → lobby of public rooms (private ones hidden). To reach main shell: **Create a room** → choose capability **profile (V0–V3)** → set a **goal** → set **agent count** (`agent-001..agent-N`). Or **join** an existing room via code/QR (`live/Qr.tsx`). Main shell = `live/LiveRoom.tsx`.

## Live signals (for live-signal.mjs)
3–5 strings expected in prod (VERIFY which are raw-HTML vs hydration-only — Vercel/Vite SPA likely hydration-only, so raw-HTML grep may be a thin shell → U9 risk):
1. Room join-code UI / lobby copy.
2. Capability profile labels `V0`/`V1`/`V2`/`V3`.
3. `trace-tree-view` event names once a room is live.
4. State drawer JSON keys: `durableRoomState`, `reducer`, `schedule.floorOwner`.
5. Model id `gpt-5.4-mini` (likely hydration-only / action-time, NOT in static HTML).

## Journey mapping (archetypes A0–A6 → concrete steps)
- **A0 Smoke (READ-ONLY):** load prod URL → lobby renders with room-creation controls reachable; capture light/dark without creating a room. LiveRoom shell checks move to A1 in an isolated local/test room under SANDBOX DOGFOOD.
- **A1 Core creation (no AI egress):** create a room + set goal/agent count WITHOUT starting the run — verify room persists (reactive `useConvexRoom`) and shows in state drawer with no agent turns yet.
- **A2 Live AI action (consent → propose → provenance → accept):** start the run → agents take turns → open trace-tree-view: each turn shows `utterance_received`→`state_reduced`. HERO thesis test: mid-run **human interrupt** ("count from 1 to 6…") → in V2/V3 it's typed as intent (`count_task`, confidence ~0.99) → reducer retargets. Verify `suppressAcknowledgements=true` and `loopRisk=false` under multi-agent load (the entire point).
- **A3 Provenance audit:** State drawer JSON is version-specific per profile; trace-tree events carry timestamps. Diff V0 (transcript-only, ack-loops) vs V3 (agent-OS) on the SAME goal+interrupt — the diff IS the proof artifact.
- **A4 Output & sharing:** QR/code join brings a second device into same `_room.id`/`_room.code` (`live/Qr.tsx`). Verify second device sees identical reduced state.
- **A5 Themes & access (trap U11):** UNKNOWN dark-mode mechanism — inspect for a theme toggle / `prefers-color-scheme`; test private-vs-public room visibility from lobby.
- **A6 Adversarial:** join a private room's code without the link; fire the human interrupt during a floor handoff (stale `commitAgentTurn` should reject); spawn max agents vs `budgetMaxWorkers`/`budgetWorkersUsed`; toggle `permissionExternalActions`/`permissionWebResearch` off and confirm agents cannot egress.

## App-specific traps (beyond universal U1–U13)
- **SPA hydration (U9):** Vite/Vercel SPA — static HTML is likely a shell; live-signal grep of raw HTML may falsely read "empty." Verify via hydrated DOM / Convex reactive load, not curl alone.
- **Non-transactional commit window:** LLM+TTS takes seconds; floor can change mid-flight → `commitAgentTurn` rejection is EXPECTED behavior, not a bug (it's the coordination guarantee).
- **Governance fields to actually exercise:** `rooms.permissionWebResearch`, `permissionExternalActions`, `budgetMaxWorkers/budgetWorkersUsed`, `suppressAcknowledgements`, `loopRisk`, `runToken` — a passing QA run should show these constraining behavior, not just existing in schema.

## Known product behaviors that are NOT bugs
- V0 profile FAILING (ack-loops, transcript-only) is the intended negative control — do not file it as a defect.
- A turn landing without audio (`audioId` absent) is best-effort speech, not a broken run.
- Private rooms absent from the lobby is by design.

## Last Bar score (update each pass; lowest = next improvement target)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9 | B10 | B11 | date | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | not yet scored | SCOUTED only. Paper read: B2 (provenance) likely strong via state drawer + trace-tree-view + server-authoritative reducer; B3 propose-before-mutate is architectural. B8 UNKNOWNs (dev command, typecheck/test/Playwright gates, dark-mode mechanism) are themselves B8 findings — resolve by reading the clone's package.json + src. B5 degrade honesty (no-audio turn labeling) and B1 consent (egress permission surface) are the risk areas. |
