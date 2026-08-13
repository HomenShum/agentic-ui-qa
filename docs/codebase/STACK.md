# Stack

## The short version

Node 22, no dependencies, no build, no server, no framework. The executable part is
eleven files under `scripts/`. Everything else is Markdown that a coding agent reads.

## What is actually installed

| Layer | Choice | Where to see it |
|---|---|---|
| Runtime | Node ≥ 20, ES modules (`"type": "module"`) | `package.json` `engines` |
| Dependencies | **none**, production or development | `package.json` has no `dependencies` or `devDependencies` block |
| Test runner | Node's built-in `node --test` | `package.json` `scripts.test` |
| Browser automation | Playwright, **borrowed not installed** | `scripts/lib/browser.mjs` |
| CI | GitHub Actions, two jobs | `.github/workflows/node-platform-conformance.yml` |
| Package manifest for the wider platform | `nodekit.yaml` | declares `proof.command: npm run proof` |

## Why there are no dependencies

This repository is cloned into other people's projects as an agent skill —
`~/.claude/skills/agentic-ui-qa`, or anywhere an agent can be pointed at it. A skill
that requires `npm install`, and a browser download at that, is a skill people do not
install. So the constraint is deliberate and it shapes two things a newcomer will
otherwise find odd:

1. **Playwright is found, not required.** Five scripts need a real browser. They search
   for a `node_modules/playwright` in a directory the caller names, then in the working
   directory and its parents, then in this clone. `scripts/lib/browser.mjs` is the only
   place that search exists.
2. **The test runner is Node's own.** `node --test` has shipped in Node since v18 and is
   stable in v20+. Adding Vitest or Jest to a zero-dependency package would cost more
   than it returns.

## Commands

    npm test        # 31 behaviour tests (node --test)
    npm run doctor  # this repo's self-check: required docs exist, every script parses,
                    # and the demo surface still has a document shell — 18/18
    npm run proof   # the same self-check, writing a receipt to .nodekit/

`npm run build` does not exist and is not missing anything: nothing is compiled or
bundled. The scripts run from source.

## Versions and how to change them

Node's version is pinned in two places that must agree: `engines.node` in
`package.json` (`>=20`) and `node-version: 22` in the CI workflow. The one external
tool, Playwright, has no pinned version here by design — whatever the borrowed
checkout has is what runs, and `head-check.mjs` records which mode it managed to run in
so a receipt never overstates what was measured.
