# Concerns

Honest list of what is weak, unfinished, or would bite a newcomer. Nothing here is
hidden in a footnote elsewhere.

## Demo surface: historical findings and current scope

`promotion/` and `docs/SIMPLIFICATION_REPORT.md` retain the original structural
pass. Their 320px outer overflow and missing trace announcements were historical
findings; the current source already clamps the outer stage and announces trace,
depth and theme changes. Those fixes are preserved.

The subsequent current-browser baseline found three different defects: the inner
run selector clipped its last control at 320px, enlarged receipt content expanded
beyond the inspector, and denied clipboard writes displayed success. The current
HTML repairs those inner layout and completion-handler seams. A passing source
check does not establish rendered readability or native clipboard behavior; these
require matched pixels and actual permission/success/retry observations. Static
A–E fixtures do not prove provider execution, durable state or human approval.

Historical D4/D5 entries remain in `promotion/PROMOTION_LOG.md`; their dated claims
are not rewritten by this scoped repair. Physical-device, screen-reader and other
browser-engine coverage remain separate from a local Chromium observation.

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

**Writing into `promotion/evidence/` is opt-in.** `head-check.mjs` and
`shell-regression-proof.mjs` both default their receipts into the gitignored `.nodekit/`;
pass `--evidence` (or explicit `--out` / `--png-*` paths) to overwrite the committed
copies. Until 2026-08-13 the defaults pointed at `promotion/evidence/`, so every bare
`node scripts/head-check.mjs` rewrote committed evidence and dirtied the worktree it was
measuring. `test/surface.test.mjs` now runs a bare `head-check` and asserts the committed
receipt is byte-identical afterwards.

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
reports `21/21`.** That document is dated, append-only evidence and was not rewritten.
The count moved because `self-check.mjs` discovers scripts instead of listing them, so
it now also checks the current scripts and `scripts/lib/`.

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
