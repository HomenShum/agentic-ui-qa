# Concerns

Honest list of what is weak, unfinished, or would bite a newcomer. Nothing here is
hidden in a footnote elsewhere.

## Open defects on the demo surface

These are tracked in `promotion/PROMOTION_LOG.md` and were left alone on purpose:
fixing them is feature work on the product, and this pass was structural.

| | Defect | Evidence |
|---|---|---|
| D2 | `examples/trace-revamp/mockup.html` overflows horizontally at 320px — `scrollWidth` 360 against `clientWidth` 320 | `promotion/evidence/head-check.json` → `overflowWidths: [320]`; unchanged before and after the document-shell fix, which killed the quirks-mode hypothesis |
| D4/D5 | minor, in the ledger | `promotion/PROMOTION_LOG.md` |
| — | the `aria-live` region at `mockup.html:413` is only ever written for "Digest copied" (`:819`), so switching the whole trace announces nothing to a screen reader | condition 6 in `promotion/PRODUCT_GOAL.md` |

## Coverage gaps

**The browser scripts have no automated tests.** `pixels.cjs`, `prettify-audit.mjs`,
`clutter-audit.mjs`, and the rendered halves of `live-signal.mjs` and `head-check.mjs`
are exercised by hand and the run is recorded in
[`../SIMPLIFICATION_REPORT.md`](../SIMPLIFICATION_REPORT.md). Automating them needs a
Playwright install, which the zero-dependency constraint forbids in this package. The
honest options are a separate opt-in workflow that installs Playwright in CI, or
leaving them attended. They are currently attended.

**`shell-regression-proof.mjs` is not in the suite** because it rewrites a tracked file.
It refuses to run against a dirty worktree, which makes it safe but not automatable in
the ordinary way.

**Advisory tools are unasserted by design.** `prettify-audit.mjs` and
`clutter-audit.mjs` always exit 0. Their numbers move with any UI change and nothing
catches a regression in the auditors themselves.

## Sharp edges

**`shell-regression-proof.mjs` edits your working tree.** It deletes four lines out of
`examples/trace-revamp/mockup.html`, runs the proof, and puts them back in a `finally`.
If it is killed between the two, restore with
`git checkout -- examples/trace-revamp/mockup.html`.

**The regex it deletes with is literal.** `SHELL_RE` matches the exact four-line head of
the demo page. Reformat that head and the proof exits 2 with an explanation rather than
passing wrongly — but it does need updating by hand.

**`head-check.mjs` writes into `promotion/evidence/` by default.** Running it without
`--out` and `--png-mobile` / `--png-desktop` overwrites committed evidence. `self-check`
always passes explicit paths into the gitignored `.nodekit/` for exactly this reason.

**Two module systems.** `scripts/pixels.cjs` is CommonJS in a `"type": "module"`
package. Its path is a published command that other repositories' QA profiles hard-code,
so it was not renamed; it reaches the shared resolver through a dynamic `import()`.

## Known measurement quirks

**knip reports one unlisted dependency**, `playwright` at `scripts/lib/browser.mjs:52`.
That is intentional — the package declares no dependencies and borrows a browser from
elsewhere. It was left visible rather than silenced, so the next reader sees it and
finds it explained here rather than discovering a config that hides findings.

**`npm run proof` does not run `npm test`.** The declared proof belongs to the promotion
loop, and changing what it asserts is that loop's decision. CI runs both.

**The scorecard in `promotion/PRODUCT_GOAL.md` quotes `15/15` for the self-check; it now
reports `18/18`.** That document is dated, append-only evidence and was not rewritten.
The count moved because `self-check.mjs` discovers scripts instead of listing them, so
it now also checks `scripts/lib/`.

## Things a newcomer will misread

**The Markdown is the product, not documentation of the product.** Eighteen root
`.md` files look like documentation sprawl. They are the protocol's modules; an agent
reads one when a pass sends it there. `docs/codebase/STRUCTURE.md` has the table saying
which to open when.

**`promotion/` is not source and is not current opinion.** It is the product loop's
dated history — a scorecard from a specific iteration, an append-only defect ledger, and
committed evidence. Do not rewrite it to match today.

**`ci/qa-gate.yml` is not this repo's CI.** It is a template for the applications being
tested. This repo's CI is `.github/workflows/node-platform-conformance.yml`.

## Not a concern, though it looks like one

`prettify-audit.mjs` and `clutter-audit.mjs` always exiting 0 is deliberate, stated in
both headers, and load-bearing: visual polish must never be able to block a deploy, or
the gate starts trading trust for taste.
