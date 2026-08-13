# Canonical journeys — agentic-ui-qa

Three to five real workflows. Not feature tours: a journey is one person, one
goal, and the artifact they hold when it worked. These are the promotion loop's
work queue, exercised in order of importance.

**A journey with no browser evidence is unfinished**, regardless of test status.

This is a `reduced`-gate repo: it ships no application of its own. Its surface is
its quickstart (`npm run doctor`), its five runnable scripts under `scripts/`,
and one rendered browser artifact, `examples/trace-revamp/mockup.html`. The
journeys below drive exactly those and nothing else.

Evidence paths use `<SCRATCH>` for
`C:/Users/hshum/AppData/Local/Temp/claude/D--VSCode-Projects-cheiron-ai-take-home/440ef9e9-83bb-4fe6-8676-4fdaaf332f3e/scratchpad`.
They are session-local; the command beside each is the durable half.

## Journey shape

Each journey states, in this order:

- **Persona and situation** — who arrived, and why today.
- **Goal** — what they want to be true when they leave.
- **Steps** — what they actually do, in the UI, in order.
- **Done when** — the observable artifact or state that proves completion.
- **Evidence** — path to the capture that shows it working. Empty until proven.

---

## J1 — "Get this onto my machine and tell me it isn't already broken"

- **Persona and situation:** An engineer who read the README, has never run
  anything from this repo, and does not want to discover a broken script in the
  middle of QA-ing their own app at 11pm.
- **Goal:** The protocol is installed where their coding agent will find it, and
  one command has confirmed the package is internally intact.
- **Steps:**
  1. `git clone https://github.com/HomenShum/agentic-ui-qa .claude/skills/agentic-ui-qa`
     (the README's repo-level install line).
  2. `npm run doctor` in the clone.
  3. `npm run proof` to get a machine-readable receipt instead of a console line.
- **Done when:** `PASS agentic-ui-qa self-check (13/13)` on stdout, exit 0, and
  `.nodekit/agentic-ui-qa-self-check.json` written with `"passed": true`.
  (12/12 through the baseline pass; iteration 1 added `scripts/head-check.mjs`
  to the checked list, so a deleted producer now fails the quickstart.)
- **Evidence:** clone succeeded (49 files, branch `main`); `npm run doctor`
  → exit 0, `PASS agentic-ui-qa self-check (13/13)` re-run at iteration 1;
  `npm run proof` → exit 0, `WROTE .../.nodekit/agentic-ui-qa-self-check.json`.

## J2 — "Show me what an honest agent-trace screen looks like before I redesign mine"

- **Persona and situation:** A designer-engineer whose own app has a Trace tab
  that is a flat text dump. They want to see the worked example the README
  promises — specifically what the screen does when the model call *fails*,
  because that is the state their app currently fakes.
- **Goal:** See the same trace rendered in three honest states and confirm the
  failed one is visually impossible to mistake for success.
- **Steps:**
  1. Open `examples/trace-revamp/mockup.html` in a browser.
  2. Click `RUN: B · fallback`.
  3. Click `RUN: C · failed`.
  4. Click the `Receipt` node to expand the tri-signature seal.
  5. Click the theme toggle (`#themeBtn`); switch `DEPTH` to `Tech`.
- **Done when:** Three visually distinct terminal seals render — solid indigo
  "awaiting your signature" (A), dashed-amber "provisional · not signable" with
  `$0.000 · no tokens billed` and no invented hash (B), solid red
  "VALIDATION FAILED · blocked" listing 2 real validation issues (C) — and dark
  theme actually renders dark, not just claims to.
- **Evidence:** `<SCRATCH>/qa-shots/mockup-desktop-light.png` (A),
  `state-B-fallback.png` (B), `state-C-failed.png` (C),
  `state-tech-depth.png`, `state-theme-toggled.png`,
  `mockup-desktop-dark.png`, `mockup-mobile-375.png`,
  `state-C-mobile-375.png`. Theme change confirmed at runtime, not by eye:
  `body` background `oklch(0.975 0.002 260)` → `oklch(0.145 0.006 258)`
  (`<SCRATCH>/kbd-check.mjs`). Regenerate:
  `node scripts/pixels.cjs <SCRATCH>/pixels-states.json`.
  Iteration 1 re-drove this journey after the document-shell fix — all three RUN
  states plus dark and 375 re-rendered clean (5/5 shots,
  `mojibake:0 | consoleErrors:0 | hOverflow:false | asserts:ok`, exit 0) — and
  added the two committed captures this journey previously lacked:
  `promotion/evidence/mobile-375-emulated.png` (a real `isMobile` context, so it
  proves the phone layout is reachable rather than forced) and
  `promotion/evidence/desktop-1440.png`, both regenerable from a fresh clone with
  `node scripts/head-check.mjs`.

## J3 — "Prove a screen actually rendered, when my screenshot tool has frozen"

- **Persona and situation:** An agent operator whose in-app browser screenshot
  pipeline hangs (the repo calls this trap U1 — and it happened in this very
  pass: `computer{action:screenshot}` timed out after 5s and `read_page` on the
  live tab returned an empty 0x0 page). They still need pixel proof.
- **Goal:** PNGs on disk plus machine assertions, without depending on the
  frozen pipeline.
- **Steps:**
  1. Write a config naming a `repo` that has Playwright, a `url`, an `outDir`,
     `assert` strings, and one entry per `shots` state (with `clicks` for states
     behind a control).
  2. `node scripts/pixels.cjs <config.json>`.
  3. Open each PNG and look at it — the script's own header says a green exit is
     not a design review.
- **Done when:** One `WROTE <png> | charset | mojibake:<n> | consoleErrors:<n> |
  hOverflow | asserts:ok` line per shot, exit 0, and the PNGs exist.
- **Evidence:** 8 shots written across two runs, all
  `mojibake:0 | consoleErrors:0 | hOverflow:false | asserts:ok`, exit 0. Configs
  at `<SCRATCH>/pixels.json` and `<SCRATCH>/pixels-states.json`. This journey is
  what made J2 verifiable at all after the in-app browser froze.

## J4 — "Score this surface's craft with numbers I can argue with, not adjectives"

- **Persona and situation:** Someone who has been told their agent UI "looks
  like AI slop" and wants the criticism turned into specific, measurable targets
  before they touch any CSS.
- **Goal:** A per-dimension scorecard naming which visual property is weakest.
- **Steps:**
  1. `node scripts/prettify-audit.mjs <config.json>` against the rendered URL.
  2. Read the TOP PRETTIFY TARGETS block — the lowest dimension is the next
     piece of work.
- **Done when:** The VISUAL RUBRIC V1–V9 table prints with a measured subtotal
  and `prettify-audit.json` is written. Exit is always 0: it is advisory by
  design and never blocks.
- **Evidence:** `<SCRATCH>/qa-shots/prettify-audit.json`; run printed
  `MEASURED SUBTOTAL: 10/16 (63%)`, V5 contrast 2 ("0 text nodes below WCAG
  floor"), V9 motion 2, and named V2 spacing (off-4px rate 0.688) and V6
  radius/shadow (9 radii, 4 shadows) as the two zero-scoring targets. Companion
  subtractive inventory `clutter-audit.json` also written
  (`rendered 191 | semantic 97 | controls 13 | hOverflow false | clipped 0`).

## J5 — "Stop me from shipping while a P0 is still open"

- **Persona and situation:** A tech lead who does not trust an agent's own
  "all done" and wants a verdict the agent cannot self-close, plus a record that
  survives the session.
- **Goal:** A written verdict on disk, produced by deterministic checks, that
  refuses to pass when it has nothing to check.
- **Steps:**
  1. `node scripts/qa-memory.mjs init --dir <memory-dir>`.
  2. `node scripts/qa-memory.mjs add-finding --json '{"sev":"P1","area":"...","symptom":"..."}'`,
     then `open` and `regressions` to see the ledger and the mandatory
     re-verify list.
  3. `node scripts/qa-gate.mjs <config.json> --check` **before** any run, to
     confirm the gate fails closed with no state.
  4. `node scripts/qa-gate.mjs <config.json>` to produce the verdict.
- **Done when:** `--check` with no prior state exits **2** (`NO_GATE`, never a
  pass), and the RUN produces `gate-state.json` containing `status`, `blocks`,
  `advisories`, and `inputsHash`.
- **Evidence:** `--check` with absent state → `fail-closed, exit 2`; no-config
  invocation → exit 2; RUN mode → `VERDICT: PASSED -> exit 0` with the seeded P1
  correctly listed as advisory-not-blocking, and
  `<SCRATCH>/qa-gate/gate-state.json` written
  (`"status": "passed"`, `"blocks": []`, `"inputsHash": "aee4d52f2010b36e"`).
  Ledger at `<SCRATCH>/qa-mem/` (fingerprint `735c1c7f6506`).

---

## Journeys every agent surface owes

- **Recovery — covered by J2, step 2.** The `B · fallback` state *is* the
  recovery surface: the model route timed out, and the screen shows the rail
  breaking at the exact hop that degraded, keeps the deck (which is still valid),
  reports `$0.000 · no tokens billed`, and downgrades the seal to `provisional`
  rather than inventing a hash. The user loses no work and is not lied to.
  Captured in `state-B-fallback.png`.
- **Receipt — covered by J2, step 4 and J5, step 4.** In the rendered surface the
  receipt is the Countersigned seal: model id `z-ai/glm-5.2`, tokens 2,650→150,
  cost $0.002, duration 6.0s, and three signer lines (Agent / Validator / Human)
  that state who has signed and who has not. On the CLI side the receipt is
  `gate-state.json`, which records the verdict, its blocks, its advisories, and
  an `inputsHash`.
- **Steering — does not apply, and this is a decision, not an omission.** This
  repo runs no agent on the user's behalf; it is a protocol that the user's own
  coding agent reads and executes. There is no run to interrupt, and no surface in
  this repo on which a mid-flight correction could land — steering happens in the
  host agent's chat, entirely outside anything this repo renders or executes. The
  nearest in-repo analogue is the fail-closed gate in J5, which is a *stop*, not
  a steer.
