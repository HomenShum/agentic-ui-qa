# Current developer handoff

A developer uses this repository to check whether an assistant's screen tells the truth. For example, a failed clipboard write must leave a visible, retryable warning; showing a checkmark would tell the reviewer that an action succeeded when it did not.

This repository supplies the QA protocol and a self-contained trace example. It does not host an application or run a model. Start with [AGENTS.md](../AGENTS.md) when applying the protocol to your own app, or [START_HERE.md](START_HERE.md) for the code walkthrough.

## Start from a clean source checkout

Use Node 20 or later; the accepted local run used Node 22.22.2. The package has no declared dependencies and needs no install for its source checks:

```sh
git clone https://github.com/HomenShum/agentic-ui-qa.git
cd agentic-ui-qa
npm test
npm run doctor
npm run proof
```

The accepted source pass reported 32 TAP entries (31 named behavior cases and one helper file), 21 doctor checks and 21 proof checks. `proof` writes its JSON receipt under `.nodekit/`; it does not run the tests for you.

The browser resolver can borrow Playwright from a named repository, ancestors or the calling installation. Check the reported mode. In a fresh source-only clone, the checks establish source/document structure, not rendered layout. A missing `PLAYWRIGHT_REPO` path does not force source mode if another browser installation is discoverable. The toolkit's visual audits are advisory; exit 0 alone is not a release grade.

## Inspect the example as a reviewer

Open [the worked example](../examples/trace-revamp/README.md) and its `mockup.html`. The page needs no backend or provider. To give clipboard checks a local origin, run the existing helper from the repository root, open the printed URL, and stop the terminal with Ctrl+C when finished:

```sh
node --input-type=module -e "import {resolve} from 'node:path'; import {serveFile} from './scripts/lib/serve.mjs'; console.log((await serveFile(resolve('examples/trace-revamp/mockup.html'),4997)).url)"
```

Use a free port; an occupied 4997 causes an error rather than taking over another server. Keep normal browser clipboard permissions. Direct-file clipboard behavior depends on the browser. This helper serves the same example for every path and does not verify that an application route exists.

1. Select each run A–E. A awaits human review; B is a provisional fallback with no invented candidate hash; C is blocked with two validation reasons; D is incomplete; E contains no trace.
2. Change Human/Pro/Tech depth. Expand the receipt and inspect full digest values through the copy controls. Check keyboard Tab/Shift+Tab, Enter/Space and visible focus as well as pointer clicks.
3. Inspect light/dark themes and exact viewport pairs 320×800, 360×800, 390×844, 768×1024, 1024×768, 1440×960 and 1920×1080. The controls stay inside the inspector. At enlarged text, complete validator words can move to the next line; the long toolchain may wrap inside its own field. The recorded enlargement doubles computed fonts at 320/390/1440; native browser zoom remains a separate check.
4. Deny clipboard access in the browser, click Copy and confirm a warning remains. Grant access and retry explicitly. Only an accepted write produces success feedback. Copying overwrites the clipboard, so use a disposable synthetic value when testing.
5. After a successful copy, deny a subsequent attempt while the success timer is pending. Its failure must remain visible after the earlier timer expires. Missing clipboard capability is a separate case; browser-native absence and an explicitly simulated absence are different evidence.

The run names, model name, tokens, cost and receipt digests are illustrative fixtures. They establish no new provider execution, billing, human approval or durable workflow.

## What changed and what was verified

| Surface | Failure | Current behavior |
|---|---|---|
| Narrow controls | The E run selector could clip at 320px. | Run/depth controls wrap within their available width. |
| Enlarged receipt | Ordinary labels and the long toolchain could clip inside the inspector. | The grid can shrink; labels reflow; wrapping is limited to the field that needs it. |
| Validator labels | An intermediate broad wrapping rule fragmented `ok`, `publish` and `clean`. | The words remain intact beside visible 11×11 px icons; whole items may wrap. |
| Clipboard feedback | A rejected write still showed success. | Success follows write fulfillment; rejection or missing capability leaves an actionable warning and permits retry. |

The accepted browser sequence retains the failed baseline, the rejected intermediate layout and the final correction. The broad intermediate run passed 1,700 assertions, including 18 original failures and real denied/granted clipboard retry, but pixels still rejected fragmented words. The final correction passed 434 targeted checks across 28 screenshots and 18 receipt states; an independent reviewer inspected all 28 images. It made no new clipboard call: exactly unchanged script, markup and copy-feedback styles connect the earlier native clipboard evidence to the final CSS correction.

See the [current proof packet](proof/trace-recovery-20260906/README.md) for matched images, source identities, raw artifacts and criterion coverage. The packet distinguishes a new observation from retained historical evidence. Its original operators' local paths are context, not portable commands.

## Remaining acceptance

This is a verified source/example repair, not certification of every toolkit module or an app that uses it. Physical devices, native browser zoom, other browser engines, assistive technology, measured contrast/performance and first-human comprehension need separate evidence. Full readiness scores remain unassigned where coverage is missing. Shared CI and any later integration must be tied to the actual reviewed commit; local checks do not prove production.

The first 44-criterion review contains 29 partial observations and 15 untested criteria. Five observations remain 3/5: typography, first-view hierarchy, main-action discovery, progressive disclosure and information density. At 390×844, the introduction precedes all example controls; normal receipt metadata remains 10–12 px. Those concrete limitations keep the example below the portfolio's final visual/design target despite the accepted repair.

Preserve `promotion/` as dated history. Apply this protocol to a target app through its own profile, permission boundaries and real artifact-producing journey. The target app's claim is only as strong as that separate proof.
