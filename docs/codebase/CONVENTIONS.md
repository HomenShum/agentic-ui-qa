# Conventions

Patterns you will see repeated. Follow them; a new script that breaks one of these is
harder to trust than one that is merely ugly.

## Every script is a command, not a library

Each file in `scripts/` is invoked as `node scripts/<name>.mjs …` and communicates
entirely through arguments, stdout, a JSON receipt, and an exit code. Nothing imports
them. The two files in `scripts/lib/` are the exception and exist only because more
than one command needed the same thing.

## Exit codes carry the meaning

| Code | Meaning | Example |
|---|---|---|
| 0 | the assertion held | `head-check.mjs` on a page with a document shell |
| 1 | the assertion failed, or the input was invalid | `live-signal.mjs` with an absence claim and no witness |
| 2 | could not run the check at all | `qa-gate.mjs` with no config; `self-check.mjs --json-out` with no path |
| 3 | an error inside the tool itself | `qa-gate.mjs`'s outer `catch` |

Advisory tools are the deliberate exception and say so loudly:
`prettify-audit.mjs` and `clutter-audit.mjs` report and always exit 0 (clutter-audit
reserves 2 for a broken *protected* contract, which is not an opinion about quality).
A check whose exit code no one reads is decoration.

## Print one machine-readable line per assertion, then a verdict

    VISIBLE rendered selector "#spine" · visible:1 total:1
    STABLE_ABSENT rendered selector "#gone" · max-count:0 window-ms:1500

The leading token is the verdict for that assertion, so output can be grepped without
parsing. Files written are announced as `WROTE <absolute path>`.

## Never print a URL, or the page's own text, into a report

QA reports get committed. URLs are hashed (`safeUrlLabel` in `live-signal.mjs`,
`safeUrl` in `clutter-audit.mjs`) and error messages are trimmed to their first line
with URLs stripped (`safeErrorMessage` in `scripts/lib/browser.mjs`). Never print
secret values; environment variable *names* are fine.

## `null` means "not measured", never "passed"

Any field a given mode could not measure is written as `null` and every assertion
guards on it explicitly:

```js
if (s.compatMode !== null && s.compatMode !== 'CSS1Compat') failures.push(…);
```

A check that quietly treats "unknown" as "fine" is the failure this convention exists
to stop.

## State is appended, never edited

The ledger is JSONL. Fixing a defect appends a new line with `status: "fixed"` for the
same fingerprint; the current state is the last line. Nothing rewrites history, which
is why `qa-memory.mjs regressions` can list every P0/P1 ever fixed as a permanent
re-verify sweep.

## Comments explain why, and cite the measurement

The house style is a docblock at the top of each file explaining the *situation* it
exists for, and inline comments only where the reason is not visible in the code —
usually a defect that was actually observed:

```js
// A ledger line that will not parse is the ordinary result of an interrupted append,
// and it may be the one open P0 in the file. This gate's whole contract is that it
// never silently allows, so a record it cannot read blocks rather than disappears.
```

Do not restate what the line does. Do record the failure that made the line necessary.

## Naming

Scripts are named for the question they answer (`head-check`, `live-signal`,
`clutter-audit`), not for their mechanism. Domain words are used consistently and are
worth learning: **finding** (one defect, with a severity), **fingerprint** (`fp`, the
stable id that dedupes re-discoveries), **ledger** (the append-only files), **run** (one
QA pass), **journey** (one persona's path through the app), **the Bar** (the B1–B11
score), **advisory** (reported, never blocks), **witness** (a positive signal that a
page is alive).

## Style

Two-space indent, single quotes, semicolons. `node:`-prefixed imports for the standard
library. No linter is configured and none is needed at this size; `npm run doctor`
syntax-checks every script in `scripts/` and `scripts/lib/`, discovered by reading the
directory rather than from a list.
