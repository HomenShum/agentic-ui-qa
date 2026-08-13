# Integrations

Everything this repository touches outside its own files, and what happens when each
one is unavailable.

## Playwright — the only external tool

**What it is for.** Five scripts drive a real headless Chromium: `live-signal.mjs`
(rendered assertions), `head-check.mjs` (rendered mode), `pixels.cjs`,
`prettify-audit.mjs`, `clutter-audit.mjs`.

**How it is obtained.** Not installed. `scripts/lib/browser.mjs` searches for an
existing `node_modules/playwright` in this order: the caller's hint (`--repo`, a
config's `"repo"` field, or `$PLAYWRIGHT_REPO`), then the working directory and up to
seven parents, then this clone, then ordinary module resolution.

**When it is missing.** Four of the five exit 1 with a message naming the flag to set.
`head-check.mjs` alone continues in `source` mode, reading the three facts a file
declares out of its own head and recording the two a browser derives as `null`. Its
receipt states which mode ran, and a source receipt is never rendered proof.

**Setting it up.** Any checkout with Playwright will do:

    node scripts/head-check.mjs --repo "/path/to/some/repo-with-playwright"

## The network

Only `live-signal.mjs` and the browser-driving scripts reach the network, and only at
a URL the caller passes. `checkRawPresence` uses the platform `fetch` with an
`AbortSignal.timeout`, capped at 60 seconds and validated at parse time. There are no
API keys, no accounts, and no telemetry anywhere in this repository.

## The application under test

The integration that matters most is a directory, not a service: the ledger lives at
`<app-repo>/.qa/memory/` — `runs.jsonl` and `findings.jsonl`. Point any command at it
with `--dir`, or `memoryDir` in the gate config. It is created on demand by
`qa-memory.mjs init`. Nothing about the app's QA history is stored in this clone.

## CI

`.github/workflows/node-platform-conformance.yml` runs two jobs. The first is a
reusable conformance workflow from the wider NodeKit platform, which only checks that
`nodekit.yaml`'s declared proof command names an npm script that exists — it never runs
it. The second job exists because of that gap, and now runs both:

    - run: npm test
    - run: npm run proof

There is no install step, because there is nothing to install; `head-check` therefore
runs in source mode in CI, which is still enough to fail the job if the demo surface
loses its document shell.

`ci/qa-gate.yml` is a *different* thing and is not used by this repository: it is a
drop-in job template for the applications being tested, wiring `qa-gate.mjs` in as a
named check.

## The wider platform, and what is only a reference

`nodekit.yaml` declares this repository to a platform that expects `doctor` / `check` /
`proof` commands and a proof receipt schema. Beyond that, several capabilities named
across the Markdown — BetterPRHandoff, FeatureClipStudio, proofloop — are **referenced,
not vendored and not depended on**. The protocol runs without any of them; each is
something a consumer may add. The same applies to the four external authorities listed
in `promotion/SKILLS.md`: they are pinned in the consuming repo's agent configuration,
never copied in, because a vendored copy is a fork that stops receiving fixes.
