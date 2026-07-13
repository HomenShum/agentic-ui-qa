# PRETTIFY.md — the presentation-only polish subsystem (B9, measured and driven)

SKILL.md scores **B9 Visual craft** as one 0–2 vibe. REVAMP.md describes structural
redesign. Neither MEASURES prettiness with a machine signal nor DRIVES a
presentation-level polish loop. This file closes that gap: it explodes B9 into a
measurable **VISUAL RUBRIC (V1–V9)**, runs a **PRETTIFY LOOP** that generates and judges
restyle candidates, and enforces the guardrails that keep polish honest.

Motivating report: the skill "guided the improvements but did not automatically redesign
the interface." PRETTIFY makes B9 an objective function a loop can optimize — while the
constraint below makes sure it can never optimize away trust.

---

## THE INVIOLABLE CONSTRAINT (read first, every pass)

**Prettification is presentation-only and ADDITIVE to trust/operability — never a
tradeoff.** A prettify change may touch **tokens, spacing, type, color, radius, shadow,
motion ONLY.** It must **NOT**:

- alter DOM structure, or add/reorder/remove elements;
- rename or remove `data-testid` / `id` / `aria-*` / stable roles (protects **B8**);
- remove, hide, or soften any honest state — degraded / failed / empty / timeout (**B5**);
- hide or de-emphasize provenance (model id, cost, tokens, receipt) for aesthetics (**B2**);
- change copy semantics — labels, verdicts, error cause+next-step (**B10**).

Every prettify pass **RE-RUNS B1–B10 and proves zero regression before "done."**
**Beauty that costs trust is a P0, not an improvement** — it is reverted, not shipped.

The guardrails in §3 make this enforceable, not aspirational: an a11y-tree snapshot diff
catches structural/label drift, a masked pixel diff catches blanked honest-states, and a
contrast re-run catches the classic "lightened the gray for elegance, dropped body text
under 4.5:1" regression.

---

## 1. The VISUAL RUBRIC — B9 decomposed (V1–V9)

Each sub-dimension scores **0 = absent/broken · 1 = present but weak · 2 = strong**, and
where measurable carries a **machineSignal** computed by `scripts/prettify-audit.mjs`
(§2). V8 is vision-only; a no-vision model scores it `DEFERRED(no-vision)` (same rule as
B9 in SKILL §4). The audit's measured subtotal is a proxy, not the verdict — the
vision-judge and guardrails decide.

| id | Sub-dimension | 0 | 2 (strong) | machineSignal (prettify-audit) | Ref |
|----|---------------|---|-----------|--------------------------------|-----|
| **V1** | Type-scale discipline | no scale — every heading a one-off size | ≤7 distinct font-sizes on a deliberate ramp | `fontSizes.unique` (>10 = sprawl, ≤7 = disciplined); the sorted `scale` shows near-dupes (13/13.5/14) | Refactoring UI; css-analyzer `font-sizes.unique` |
| **V2** | Spacing / grid rhythm | arbitrary px everywhere, no rhythm | all spacing on a 4/8 scale, ≤~12 distinct values | `spacing.offGrid4Rate` (>0.15 weak) + `spacing.uniqueValues` (>~10 = no scale) | 8pt Grid System |
| **V3** | Color restraint & token adherence | palette sprawl / raw hexes off the token set | ≤~12 text colors, all in the app token allowlist; hue classifies, never decorates | `textColors.unique` (>~12 sprawl) + `offAllowlistCount` (any off-token literal caps the score at 1) | CSS Stats; stylelint-declaration-strict-value |
| **V4** | Hierarchy (weight + size + value) | one weight, flat — hierarchy carried by hue | grayscale-first: ≥2 weights, a size ramp, and de-emphasis via a gray value-ramp not extra hues | `fontWeights.unique` (<2 = flat) + `textColors.histogram` read as tints vs hues | Refactoring UI (design-in-grayscale) |
| **V5** | Contrast / legibility (WCAG) | body text under 4.5:1 | 0 text nodes under WCAG SC 1.4.3 (4.5:1 normal / 3:1 large) | `contrast.flagged` per-node (see §2 caveat on gradient/image backgrounds) | WCAG 2.2 SC 1.4.3 + WebAIM; APCA for the tighter internal bar |
| **V6** | Radius / shadow / elevation consistency | ad-hoc corners + shadows, no defined levels | ≤4 radii, ≤4 shadow levels, icons snapped to a size set (16/20/24) | `radii.unique`, `shadows.unique`, `icons.uniqueSizes` (each >4 = ad-hoc) | Design Lint taxonomy |
| **V7** | Alignment / edge discipline | elements drift off every left edge | block content clusters on a few shared left-edges | `alignment.strayRate` (fraction off the 8 dominant left-edges; >0.45 weak) | CSS Auditing Tools (specificity/layout groups) |
| **V8** | State polish (empty / loading / error) | states unstyled or missing | empty teaches the first action, loading is honest-staged, error states are designed and legible | **vision-only** — capture empty+loading+error PNGs; not derivable from one static DOM read | UICrit region-grounded critique |
| **V9** | Motion restraint | long/auto-playing/infinite motion, no reduced-motion path | feedback ~150–300ms, ≤400ms, no un-guarded infinite loops, collapses under `prefers-reduced-motion` | `motion.over400ms`, `motion.animatedInfinite`, `motion.reducedMotionActive` (long motion while active = fail) | prefers-reduced-motion C39 / SC 2.3.3 |

Read the audit's **TOP PRETTIFY TARGETS** (lowest V first, with element selectors) as the
restyle backlog. The lowest sub-dimension is the pass's target — same "revamp the lowest
score" shape as SKILL §7, scoped to presentation.

---

## 2. `scripts/prettify-audit.mjs` — the measurement half

Dependency-free (resolves Playwright from a `repo` field exactly like `pixels.cjs`).
Loads a URL (+ optional `clicks`/`scheme`/`waitMs` for SPA entry), runs a single
`page.evaluate` over VISIBLE elements, and emits a scored JSON + a human summary of the
V1–V9 signals with the offending element selectors. **Advisory: it always exits 0** — the
judge and guardrails decide pass/fail, never this script.

```
# quick
node <skill>/scripts/prettify-audit.mjs https://app.example.com/
# full (SPA entry, token allowlist, dark, JSON to outDir)
node <skill>/scripts/prettify-audit.mjs config.json
#   config: { repo, url, outDir, scheme, clicks[], waitMs, tokenAllowlist[] }
```

It reports: distinct font-sizes + the sorted scale (V1); spacing histogram + off-4/8px
rate (V2); distinct text colors + off-allowlist list (V3); distinct font-weights (V4);
per-node WCAG contrast with the worst offenders (V5); radius/shadow/icon-size variety
(V6); left-edge stray rate (V7); transition/animation durations + reduced-motion state
(V9); and focus-visible rule presence (A5/B8 advisory). V8 is marked vision-only.

**Two honest limitations to state in the report (do not silently trust the number):**
1. **Contrast can over-flag.** `getComputedStyle` cannot see `background-image` gradients,
   images, or filter/opacity compositing — a button painted by a gradient reports its
   background as transparent and composites up to white, yielding false low-contrast
   flags (e.g. the NodeSlide "Generate 3 directions" gradient button flags 1:1 white-on-
   white). Treat V5 flags as *candidates the vision-judge confirms*, not verdicts. Real
   below-4.5:1 body text on a flat background IS a genuine P0.
2. **One static read misses states.** The audit sees the DOM as captured; V8 (empty/
   loading/error polish) and hover/focus styling need the vision-judge over captured PNGs.

Smoke-tested against live prod NodeSlide (`?domain=nodeslide`, click "Explore the
sample") — see the skill's build notes for the exact output; it exits 0 and names V1/V2/
V5/V6/V7 as that surface's weakest craft dimensions.

---

## 3. The PRETTIFY LOOP

One iteration raises the lowest sub-dimension without regressing B1–B10.

**0. Baseline the invariants (BEFORE any change).**
- `pixels.cjs` → PNGs of every honest state (live / degraded / failed / empty), both
  themes, the profile's viewports. **Mask** the honest-state regions (degraded badge,
  provenance receipt) so a later pixel diff can prove they were untouched.
- Capture the **a11y-tree snapshot** of each surface (Playwright `toMatchAriaSnapshot`, or
  a serialized `read_page` accessibility tree if that's your bridge). This is the
  structure/label baseline the restyle must not move.
- Record the **B1–B10 scores** and the honest-state inventory you must preserve.

**1. Measure.** `prettify-audit.mjs` → JSON + summary. The lowest V-dimension with the
element selectors is the target. If nothing is sub-2 and you can view pixels, hand to the
vision-judge for taste (V4 hierarchy read, V8 states, one signature element).

**2. Generate PRESENTATION-ONLY candidates.** For the weak dimension, produce 2–3
restyle candidates as **token/CSS diffs only** — grounded in REFERENCES.md's rubric refs
for that dimension (Refactoring UI for V1/V4, 8pt Grid for V2, CSS Stats for V3, Design
Lint for V6). Each candidate touches only tokens/spacing/type/color/radius/shadow/motion.
Route every value through the token layer (the app's CSS variables) — a candidate that
invents a raw hex or off-scale px is rejected before judging (mirrors
stylelint-declaration-strict-value / constyble thresholds). Generators like v0 / Google
Stitch may PROPOSE candidates, but their output is admitted only through the §4 guardrails
first — a "variation" may not smuggle in DOM/testid changes.

**3. Vision-judge each rendered candidate.** Render every candidate to PNG (`pixels.cjs`),
then a **vision-capable model** scores each against the fixed V1–V9 rubric (region-
grounded critique, UICrit-style: bbox + issue + severity). To score *on-brand* rather than
generic-good, prepend the studio's **TASTE PREAMBLE** from `TASTE.md` §A (durable taste
signals mined from prior accept/decline/ship events) — selection becomes argmax over
(rubric + taste adherence). Without it the judge optimizes toward tasteful-generic. Pin the rubric text across
candidates, **shuffle candidate order** per judging call, and log score+rationale (guards
the documented position/verbosity/self-preference judge biases). Selection = **argmax on
the rubric, ties broken by guardrail pass.** A **no-vision model DEFERS** this step and
either applies only the deterministic audit-driven fixes (snap spacing to the 8pt scale,
collapse near-dupe font-sizes, cap the palette) or hands off to a vision pass — it never
guesses taste from the DOM.

**4. Apply the winner.** Token/CSS diff only.

**5. Re-audit + pixel-verify + RE-RUN B1–B10.**
- `prettify-audit.mjs` again → confirm the target V-dimension went UP and no other went
  down. Emit the **before/after delta** (e.g. `V1 font-sizes 14 → 6`) as a machine artifact.
- `pixels.cjs` again → the look changed where intended; the **masked honest-state regions
  are pixel-identical** (a decorative sweep must never blank a degraded badge or receipt).
- **Re-score B1–B10** and diff the a11y snapshot (§4). Any regression → revert (§4).

**6. Loop** to the next-lowest dimension, or stop at the Definition of Done (§5).

---

## 4. Guardrails (how the inviolable constraint becomes enforceable)

Run ALL of these on every candidate before it can be called "applied." Any failure = the
candidate is **rejected/reverted**, and if it shipped, the regression is a **P0**.

| Guard | Mechanism | Fails when |
|-------|-----------|-----------|
| **Structure/label unchanged (B8/B2)** | a11y-tree snapshot diff — capture before, assert byte-equal after (Playwright `toMatchAriaSnapshot`, order- & case-sensitive; or serialized a11y tree) | any node / accessible-name / order / testid / aria delta |
| **Honest states preserved (B5)** | masked `pixels.cjs` diff over the degraded/failed/empty/timeout regions + a text assert that the state labels still render | a masked region changed, or a state label vanished/softened |
| **Provenance intact (B2)** | assert model-id / cost / tokens / receipt nodes still present and legible (re-run their contrast) | any provenance field hidden, moved off-view, or dropped under contrast |
| **Copy semantics unchanged (B10)** | diff visible text content of labels/verdicts/errors before vs after | any label/verdict/error-copy change (that's a REVAMP/content edit, not prettify) |
| **Contrast floor held (V5)** | re-run per-node WCAG after every color/token change | any text node dropped below 4.5:1 (3:1 large) — the classic "elegant lighter gray" regression |
| **Motion degrades honestly (V9)** | assert added motion collapses under `prefers-reduced-motion: reduce`, ≤400ms feedback, no un-guarded infinite loops | reduced-motion active but animation still runs; >400ms feedback; infinite w/o override |
| **Token-routed (V3/V2)** | every changed value is a `var()`/token, on the 4/8 scale, in the palette | a raw literal or off-scale value was introduced |

Regenerate the a11y-snapshot baseline **only** after an intentional STRUCTURAL change
(that's REVAMP, not prettify) — never during a restyle.

---

## 5. Composition with REVAMP.md + Definition of Done

- **PRETTIFY = the presentation-only mode.** Use it when structure/copy/provenance are
  already right and the surface just reads as un-designed (weak type scale, off-grid
  spacing, palette sprawl, inconsistent elevation, unpolished states). It never changes
  what the UI says or exposes — only how it looks.
- **REVAMP S1–S6 = the structural mode.** Use it when the fix requires surfacing hidden
  data, adding a proposal/diff affordance, restructuring layout, or rewriting copy — i.e.
  when the DOM/content itself must change. REVAMP may *end* with a PRETTIFY pass, but a
  PRETTIFY pass may never *become* a REVAMP (the moment it needs to touch structure/copy,
  stop and switch modes).
- A REVAMP that lands a new component runs PRETTIFY over it before "done"; a PRETTIFY pass
  that discovers the ugliness is actually a missing state or hidden field escalates to
  REVAMP S1–S6.

**PRETTIFY done when:** the target V-dimension rose (before/after audit delta pasted) ·
the vision-judge confirms the rendered look improved (or DEFERRED(no-vision) with the
deterministic fixes applied) · **all §4 guardrails pass** (a11y snapshot byte-equal,
masked honest-states pixel-identical, provenance intact, copy unchanged, contrast held,
motion honest) · **B1–B10 re-scored with zero regression** · memory updated (SKILL §9:
the pass appended, any beauty-cost-trust finding logged as P0). If any guardrail failed,
the pass is not done — it is reverted.

---

## References backing each signal (verified; see the skill's research ledger)

Rubric/thresholds: Refactoring UI (grayscale-first hierarchy, constrained type/space
scales) · Project Wallace css-analyzer + CSS Stats (uniqueness ratios) · constyble +
stylelint-declaration-strict-value (token enforcement thresholds) · 8pt Grid (off-grid
rate) · WCAG 2.2 SC 1.4.3 + WebAIM + APCA (contrast floors) · Design Lint (radius/shadow/
icon consistency) · prefers-reduced-motion C39 / SC 2.3.3 (motion restraint) · CSS
Auditing Tools (per-dimension sub-scorecard framing).

Loop/guardrails: Playwright `toMatchAriaSnapshot` (structure-unchanged gate) +
`toHaveScreenshot` with masks (localized pixel proof) · reg-suit / BackstopJS / Chromatic
(CI baseline management) · Storybook a11y (axe-core) (per-component contrast/label gate) ·
UICrit (region-grounded critique) · MLLM-as-UI-Judge (MLLM aesthetic score calibrated to
humans — trust only where correlation is high, else human-gate) · LLM-as-a-Judge
best-practices (argmax-on-fixed-rubric, shuffle order, log rationale) · v0 / Google Stitch
(candidate generators, admitted only through the guardrails) · VisualJudge +
harness4visuals-etl (native vision-judge + persistent taste memory).
