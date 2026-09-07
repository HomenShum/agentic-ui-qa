# Trace example: current repair evidence

A reviewer needs to reach the controls, read the receipt and trust the outcome of Copy. This packet shows where those jobs failed, what changed and what remains below the intended quality bar.

The runtime correction is accepted. The first criterion review records **29 partial observations and 15 untested criteria**. Five partial observations remain 3/5: small typography and the phone introduction's effect on hierarchy, action discovery, disclosure and density. Full dimensions and the overall grade remain null. See [criterion coverage](criterion-coverage.json); merging a fix does not turn those missing observations into passes.

## Matched images

| Job and exact viewport | Earlier observation | Corrected observation |
|---|---|---|
| Reach all run controls, 320×800 | [Clipped selector](controls-before.png) | [Wrapped controls](controls-repaired.png) |
| Read the receipt at doubled fonts, 390×844 | [Clipped receipt text](enlarged-before.png) | [Contained receipt](enlarged-current.png) |
| Read validator words, 390×844 | [Rejected intermediate fragments](words-rejected.png) | [Intact words and visible icons](words-current.png) |
| Recognize a denied copy, 390×844 | [False success](copy-false-success.png) | [Warning survives the prior timer](copy-honest-failure.png) |
| Retry after granting permission, 390×844 | Denied write remains a failure | [Actual granted retry](copy-granted-retry.png) |

Each direct PNG is byte-identical to its raw archive member; [image-map.json](image-map.json) records the mapping. The control and clipboard repairs were observed before the final three-rule CSS correction. Exact script, non-style HTML and copy-feedback CSS continuity preserve that historical behavior evidence. The final images prove the affected layout; they do not represent another clipboard run.

## Source and proof boundaries

The Git base is `852a6d4b2e7f6f15b3fc77187e68e35cc1ecac3f`. The accepted HTML has raw checkout SHA256 `06497436cfd052e85ad9795c81dce477dcfbeade6b213e6da9617be97f99c14b` and canonical served SHA256 `dc62b3a229abcc92459a2bafc0f4eeb9300b1842765d7603936a3608adf4804a`. Different line endings explain these byte identities. The complete script SHA256 is `c3351497829238131f1a76e53704a869da6fb66ac36c43d8a0a5a0aded21c955`. The current handoff and its README link are later documentation changes; they do not change this runtime.

- Source checks: 32 TAP entries, doctor 21, proof 21. Source-mode success establishes no pixel, browser or provider result.
- Original browser baseline: 1,129/1,147 assertions. Preserve its 18 failures.
- Broad intermediate browser run: 1,700/1,700 assertions, including real clipboard denial/retry and all 18 original assertion closures. Its fragmented words were still rejected after looking at pixels.
- Final layout run: 434/434 checks, 10 conditions, 18 receipt states, 28 PNGs independently viewed, 42 visible 11×11 px icons. No new clipboard or provider call.

The final conditions are seven normal viewport pairs (320×800, 360×800, 390×844, 768×1024, 1024×768, 1440×960 and 1920×1080) and computed doubled fonts at 320/390/1440. All final observations preserve protected fixture text and full copy values. The long toolchain wraps within its own field; whole validator items may wrap, while ordinary words remain intact.

The native clipboard run contains 16 application clicks, 14 exact synthetic readbacks and an actual `NotAllowedError`. A separate missing-capability case is explicitly simulated. The displayed GLM/cost/signature data is illustrative. There is no new model run, billing event or real human signature in this proof.

## Inspect the raw material

[evidence.zip](evidence.zip) contains exact original bytes. [evidence-manifest.json](evidence-manifest.json) lists every member's size and SHA256 and the archive hash. Open it with an archive reader, or extract it to a new folder; do not execute archived HTML snapshots. For example, on Windows from this directory:

```powershell
Expand-Archive -LiteralPath .\evidence.zip -DestinationPath .\trace-proof-expanded
```

The packet includes complete final browser observations except the two machine input inventories; selected historical controls/receipt/clipboard states, full historical report JSON, source checks, all criterion references and inert source snapshots. Other states named by the historical reports remain in the preserved operator corpus and are intentionally outside this selected packet. The manifest is the authoritative inventory; no omitted historical screenshot is claimed to be bundled.

The readable scorecard is a projection of the original assessment. Its rows keep the original partial/final scores and deductions, and each evidence alias maps to an exact archive member. Raw receipts can retain original operator paths for provenance; those paths are not setup commands. The archive contains observations, not a portable automation controller or a new test run.

## Resume without overstating readiness

Use [CURRENT_HANDOFF.md](../../CURRENT_HANDOFF.md) for the runnable source/local-browser entry and native test steps. Typography and first-view hierarchy remain below target. Physical touch, native zoom, other engines, assistive technology, measured contrast/performance, first-human usability and complete downstream toolkit adoption remain unverified. The toolkit's advisory audit exit convention does not waive the portfolio's stricter acceptance bar.
