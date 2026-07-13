# QA profile: open-codesign (Open CoDesign) — local-first desktop design agent

> **SCOUTED from repo, NOT yet live-validated — unanswerable rows are B8 findings.**
> Source: platform-scout apps.md (local clone `D:/VSCode Projects/open-codesign`, 2026-07-13). Org is **OpenCoworkAI** (`github.com/OpenCoworkAI/open-codesign`), MIT-licensed — NOT under HomenShum. No app was launched or driven; rows below are claims to verify.

## Environment
| Thing | Value |
|---|---|
| Prod URL | **None — it's a downloadable Electron desktop app, not a hosted service.** Marketing site: `https://opencoworkai.github.io/open-codesign/`. Distributed via Homebrew / Scoop / winget / GitHub Releases (dmg/exe/AppImage/deb/rpm) |
| Repo root | `D:/VSCode Projects/open-codesign` (local clone confirmed). Monorepo: `apps/desktop` (Electron main/preload/renderer) + `packages/{core,runtime,providers,ui,artifacts,exporters,templates,i18n,shared}` |
| Dev command + port | UNKNOWN exact command — pnpm-only + Turborepo; check root `package.json` + `apps/desktop/package.json` for the Electron dev script (likely `pnpm dev` / `pnpm --filter desktop dev`). Electron app = no browser port; QA drives the desktop window (computer-use MCP), not a URL |
| Backend / deployments | **Local-first, no backend.** Design = pi JSONL session + real workspace files under `.codesign/settings.json`. Credentials in `~/.config/open-codesign/config.toml` (Electron `safeStorage`-encrypted). No telemetry |
| Auth path for a QA agent | **BYOK, no accounts.** First launch → Settings auto-opens → add provider by (a) import from Claude Code/Codex config (`~/.codex/config.toml`, `~/.claude/settings.json`), (b) paste key (auto-detect: `sk-ant-…`→Anthropic, `sk-…`→OpenAI), or (c) keyless for IP-allowlisted proxy / local Ollama. **A QA agent needs a real model key OR a local Ollama** — no synthetic offline mode documented (that gap is itself a B8 finding). Do NOT paste the user's key without explicit permission |
| Typecheck gate | UNKNOWN — Biome + TS monorepo; check root scripts (likely `pnpm typecheck` / `turbo typecheck`). Node 22 |
| Test gate | UNKNOWN — check `package.json`; note `BENCHMARKS.md` implies a decompose benchmark harness exists |
| Playwright available in repo? | UNKNOWN — Electron app; renderer is a sandboxed iframe, so QA is via computer-use MCP on the desktop window, not Playwright-in-browser. Grep for `@playwright/test`/`electron-playwright` anyway |
| Evidence dir convention | `<scratchpad>/qa-open-codesign-<YYYYMMDD-HHmm>/` |
| Memory dir (SKILL §9) | `D:/VSCode Projects/open-codesign/.qa/memory/` |

## Provenance surface (ground truth for AI claims — SKILL §1.2)
| Question | Answer |
|---|---|
| Where does the app show what AI did? | **Live agent panel** (todos + streaming tool calls, interruptible). Design = pi JSONL session (auditable transcript of every tool call). `preview(path)` returns console/asset errors + DOM outline + metrics + screenshots. `done(path)` produces `DESIGN.md` |
| LIVE run signals | Runtime is `pi-coding-agent` + `pi-ai` (all LLM calls through `pi-ai`, no direct provider SDK imports). Streaming tool calls in the agent panel. **Per-decompose cost row** on Decompose-to-UI-Kit (see `BENCHMARKS.md`). Model = whichever BYOK provider is configured |
| DEGRADED/fallback signals | UNKNOWN documented degrade label — inspect `packages/runtime` for how a failed tool call / provider error surfaces. Brand-values-are-data constraint: model must NOT invent brand values from memory (uses `DESIGN.md` / official CSS/SVG) — a degrade here = invented brand data (a correctness failure to watch) |
| FAILED signals | UNKNOWN — `preview(path)` returning console/asset errors is the closest surfaced-failure signal; verify a broken artifact shows the errors rather than a false "done" |

## First-run behavior (trap U10)
"90-second" path: install → **Settings auto-opens** → add provider (import from Claude Code is one click) → pick 1 of **8 built-in Hub demos** OR type a prompt → first artifact in seconds. Main shell = **Hub** ("Your Designs" + local version switcher) → then prompt-left / **live artifact-right** (sandboxed iframe, HTML or live React). v0.1 installers unsigned (macOS: `xattr -cr`; Windows: SmartScreen → Run anyway).

## Live signals (for live-signal.mjs)
**N/A for a URL probe — desktop app, no hosted DOM.** live-signal.mjs cannot verify this app; QA is computer-use MCP against the Electron window. Verifiable in-app signals instead:
1. Settings panel provider-detection (paste `sk-ant-` → "Anthropic" auto-selected).
2. Hub shows 8 built-in demos + "Your Designs" version switcher.
3. Agent panel streams todos + tool calls.
4. Artifact iframe renders with hover states/tabs/empty states.
5. Decompose cost row + 12-check visual-parity judge output.

## Journey mapping (archetypes A0–A6 → concrete steps)
- **A0 Smoke:** launch Electron app (computer-use `open_application`) → Settings auto-opens → import a provider config → Hub renders with 8 demos. Screenshot light/dark.
- **A1 Core creation (no AI egress):** open a built-in Hub demo (static artifact, no model call) → verify it renders in the sandboxed iframe with hover/tabs/empty states wired; switch versions in the Hub (local SQLite snapshots, v0.1).
- **A2 Live AI action (consent → propose → provenance → accept):** type a prompt → agent panel streams todos + tool calls (7 pi built-ins read/write/edit/bash/grep/find/ls + design tools ask/scaffold/skill/preview/gen_image/tweaks/todos/done) → **each tool call gated through pi `tool_call` hook + permission UI** → approve → artifact appears. Verify generation is **interruptible** mid-run.
- **A3 Provenance audit:** open the pi JSONL session for the design → every tool call is recorded; `DESIGN.md` produced by `done()`; confirm brand values trace to `DESIGN.md`/official CSS-SVG, not invented.
- **A4 Output & sharing:** exports produce real files — HTML / PDF / PPTX / ZIP / Markdown (`packages/exporters`). Verify each writes an actual file to disk.
- **A5 Themes & access (trap U11):** UNKNOWN app dark-mode mechanism — inspect renderer; test comment-mode and tweak sliders in both themes.
- **A6 Adversarial:** interrupt mid-generation and confirm clean stop (no orphaned writes); **Comment pin must rewrite ONLY the pinned region** (not a full re-gen — the headline correctness claim); deny a permission prompt and confirm the tool call does not execute; keyless/Ollama path with no key configured shows honest "no provider" state.

## App-specific traps (beyond universal U1–U11)
- **Not a browser-QA target** — Electron desktop; use computer-use MCP on the window. live-signal.mjs / pixels-in-browser do not apply.
- **No documented synthetic/offline QA mode** — needs a real BYOK key or local Ollama to exercise A2+. Absence of a keyless demo-run path is a B8 finding; simplest QA key = local Ollama (keyless).
- **Comment mode is a scoped-rewrite claim** — the pin rewrites only the pinned region; a full re-gen instead = a scope (B4) violation to catch.
- **Brand-values-are-data invariant** — model inventing brand colors/logos from memory instead of reading `DESIGN.md`/official assets is a correctness+trust failure.
- **Decompose-to-UI-Kit (v0.2)** ships a **12-check boolean visual-parity judge** + verify-and-iterate loop — RUN it and treat its output as a B9/B10 finding list (mirrors NodeBench's agent-native linter pattern).
- **Different org/license** — OpenCoworkAI/MIT, not HomenShum; positioning is the open-source Claude Design / v0 / Lovable / Bolt / Figma-AI alternative.

## Known product behaviors that are NOT bugs
- Unsigned v0.1 installers (SmartScreen / `xattr -cr`) — expected for pre-release.
- BYOK-only with no bundled model runtime is a hard constraint, not missing functionality.
- Local-first storage (no cloud sync) is the design stance.

## Last Bar score (update each pass; lowest = next revamp target)
| B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | date | notes |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | not yet scored | SCOUTED only (local clone). Paper read: B3 (permissioned `tool_call` hook + permission UI) + B2 (pi JSONL session audit trail) strong; B4 scope test = comment-pin-rewrites-only-pinned-region. B8 UNKNOWNs: dev command, typecheck/test gates, degrade/fail labels, dark-mode — resolve by reading the local clone's package.json + `packages/runtime`. Structural B8 gap: no offline/synthetic QA mode (needs BYOK key or Ollama). Desktop-only ⇒ computer-use MCP, not browser QA. |
