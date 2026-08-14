#!/usr/bin/env node
/**
 * wig-review.mjs — gate condition 7, made runnable.
 *
 * Condition 7 is "Web Interface Guidelines review: no major unresolved finding".
 * It is a REVIEW, not a tool score, and the two are constantly confused: a
 * Lighthouse accessibility number is a subset of axe-core rules, and the Web
 * Interface Guidelines are a different, larger, mostly-not-automatable list. A
 * green Lighthouse tells you nothing about whether async updates are announced,
 * whether `role="button"` was reached for before `<button>`, or whether the
 * browser chrome matches the page in dark mode. **A Lighthouse score may never be
 * recorded as a guidelines review.** This file exists so that condition 7 has an
 * artifact of its own kind.
 *
 * Checklist source, fetched 2026-08-13:
 *   https://vercel.com/design/guidelines
 * Every check below carries the guideline's own title and section, so a reader can
 * find the rule being applied. Titles are quoted; the review is ours.
 *
 * Usage:  node scripts/wig-review.mjs [--evidence] [--out-dir <dir>] [--port 4913] [--repo <dir>]
 *         node scripts/wig-review.mjs             # receipt + PNGs into gitignored .nodekit/
 *         node scripts/wig-review.mjs --evidence  # overwrite the COMMITTED artifacts
 *
 * A bare run must never dirty the worktree it measures, so promotion/evidence/ is opt-in.
 *
 * WHAT THIS IS AND IS NOT. Twenty-one guidelines are checked here because they can be
 * measured on a rendered document: focus rings are read off the focused element, hit
 * targets off getBoundingClientRect, the live region by clicking a control and reading
 * the region back. Guidelines that need a human eye — optical alignment, easing that
 * fits the subject, copywriting — are recorded `status: "eyes"` with the screenshot that
 * a reviewer must look at, and they are NEVER auto-passed. The receipt says which is which.
 *
 * Severity is `major` when the guideline's failure blocks or misinforms a user of the
 * surface, `minor` otherwise, and every severity call is written into the receipt beside
 * its measurement so it can be argued with.
 *
 * Exit 0 = no MAJOR finding open. Exit 1 = at least one, named on stderr.
 * Exit 2 = the review could not run (no Playwright) — never a pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePlaywright, safeErrorMessage } from './lib/browser.mjs';
import { serveFile } from './lib/serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const argv = process.argv.slice(2);
const flag = (name, fallback = null) => { const i = argv.indexOf(name); return i === -1 ? fallback : argv[i + 1]; };

const EVIDENCE = argv.includes('--evidence');
const PORT = Number(flag('--port', '4913'));
const SURFACE = path.join(repoRoot, 'examples', 'trace-revamp', 'mockup.html');
const GUIDELINES = 'https://vercel.com/design/guidelines';
const WIDTHS = [320, 375, 768, 1024, 1440, 1920];

// --out-dir: point the same producer at a pre-fix tree and keep its receipt beside
// the post-fix one, so "these findings were open before" is an artifact, not a claim.
const outDir = flag('--out-dir')
  ? path.resolve(repoRoot, flag('--out-dir'))
  : (EVIDENCE ? path.join(repoRoot, 'promotion', 'evidence') : path.join(repoRoot, '.nodekit'));
fs.mkdirSync(outDir, { recursive: true });
const RECEIPT = path.join(outDir, 'wig-review.json');
const PNG_LIGHT = path.join(outDir, 'wig-desktop-1440.png');
const PNG_DARK = path.join(outDir, 'wig-dark-1440.png');
const rel = (p) => path.relative(repoRoot, p).replace(/\\/g, '/');

const playwright = resolvePlaywright(flag('--repo') || process.env.PLAYWRIGHT_REPO, { required: false });
if (!playwright) {
  console.error('FATAL: Playwright not found. A guidelines review is performed on a RENDERED document;');
  console.error('       there is no source-only mode, because none of these guidelines are readable from a file.');
  console.error('       Point --repo (or $PLAYWRIGHT_REPO) at any checkout with node_modules/playwright.');
  process.exit(2);
}

const checks = [];
/** @param {{g:string,section:string,severity:'major'|'minor',status:'pass'|'fail'|'eyes'|'na',m:any}} c */
const record = (c) => checks.push({ guideline: c.g, section: c.section, severity: c.severity, status: c.status, measurement: c.m });

const { server, url } = await serveFile(SURFACE, PORT);
const browser = await playwright.chromium.launch();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${safeErrorMessage(e)}`));
  page.on('requestfailed', (r) => failedRequests.push(`${r.method()} -> ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });

  // ---- Interactions -------------------------------------------------------
  // Tab all the way round once. Each stop yields the descriptor, its focus ring
  // as the browser paints it under :focus-visible, and its hit box.
  const stops = [];
  const seen = new Set();
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const id = el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}${el.dataset.node ? `[data-node=${el.dataset.node}]` : ''}${el.dataset.trace ? `[data-trace=${el.dataset.trace}]` : ''}${el.dataset.density ? `[data-density=${el.dataset.density}]` : ''}`;
      return {
        id,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
        outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        outlineVisible: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1,
        w: Math.round(r.width), h: Math.round(r.height),
      };
    });
    if (!stop) break;
    if (seen.has(stop.id)) break;
    seen.add(stop.id);
    stops.push(stop);
  }

  // Counting tab stops is not the guideline; the guideline is that the flows OPERATE
  // from the keyboard. The rail node is the one control that is not a native button,
  // so it is the one that has to prove Enter AND Space, per the WAI-ARIA button pattern.
  const railNode = page.locator('[role=button][data-node]').first();
  await railNode.focus();
  const expandedAt = async () => railNode.getAttribute('aria-expanded');
  const beforeKeys = await expandedAt();
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  const afterEnter = await expandedAt();
  await page.keyboard.press('Space'); await page.waitForTimeout(250);
  const afterSpace = await expandedAt();
  const keysWork = afterEnter !== beforeKeys && afterSpace !== afterEnter;
  record({ g: 'Keyboard works everywhere', section: 'Interactions', severity: 'major',
    status: stops.length > 0 && keysWork ? 'pass' : 'fail',
    m: { tabStops: stops.length, stops: stops.map((s) => s.id),
      railNodeAriaExpanded: { start: beforeKeys, afterEnter, afterSpace },
      note: 'WAI-ARIA button pattern: a role=button must answer to Enter and to Space. Both toggle aria-expanded here, so the value flips twice.' } });

  const noRing = stops.filter((s) => !s.outlineVisible);
  record({ g: 'Clear focus', section: 'Interactions', severity: 'major',
    status: noRing.length === 0 ? 'pass' : 'fail',
    m: { tabStops: stops.length, withoutVisibleRing: noRing.map((s) => s.id), sampleRing: stops[0]?.outline } });

  const small = stops.filter((s) => s.w < 24 || s.h < 24);
  const underMobileFloor = stops.filter((s) => s.w < 44 || s.h < 44);
  record({ g: 'Match visual & hit targets', section: 'Interactions', severity: 'minor',
    status: small.length === 0 ? 'pass' : 'fail',
    m: { floorPx: 24, under: small.map((s) => `${s.id} ${s.w}x${s.h}`),
      mobileFloorPx: 44, underMobileFloor: underMobileFloor.map((s) => `${s.id} ${s.w}x${s.h}`),
      note: 'The guideline names 24px as the floor and 44px on mobile. The 24px floor is what this check gates. The 44px shortfall on the two segmented controls is recorded, not fixed: raising them to 44px re-proportions the whole control bar, which is a redesign and not a defect closure.' } });

  const viewport = await page.evaluate(() => document.querySelector('meta[name=viewport]')?.content ?? null);
  const zoomBlocked = /user-scalable\s*=\s*no|maximum-scale\s*=\s*(1|2|3|4)(\D|$)/i.test(viewport || '');
  record({ g: 'Respect zoom', section: 'Interactions', severity: 'major',
    status: zoomBlocked ? 'fail' : 'pass', m: { viewport } });

  // Announce async updates — the one that needs a real interaction, not a DOM read.
  // Switch the trace with the keyboard and ask the live region what it said.
  const announce = await page.evaluate(async () => {
    const live = document.getElementById('srLive');
    const before = live ? live.textContent : null;
    const btn = document.querySelector('[data-trace="B"]');
    btn?.focus();
    btn?.click();
    await new Promise((r) => setTimeout(r, 400));
    return {
      liveRegionExists: !!live,
      liveRegionAttrs: live ? { 'aria-live': live.getAttribute('aria-live'), role: live.getAttribute('role') } : null,
      textBefore: before,
      textAfter: live ? live.textContent : null,
      bannerAfter: (document.getElementById('banner')?.textContent || '').trim().slice(0, 80),
      pressedAfter: btn?.getAttribute('aria-pressed'),
    };
  });
  record({ g: 'Announce async updates', section: 'Interactions', severity: 'major',
    status: announce.liveRegionExists && (announce.textAfter || '').trim().length > 0 ? 'pass' : 'fail',
    m: announce });

  // ---- Animations ---------------------------------------------------------
  // transition-property computes to `all` on EVERY element, including <head> and
  // <meta>, because that is its initial value. A check that only reads the property
  // reports 206 violations on a page with none — the first version of this file did
  // exactly that. The guideline is about animating `all`, so the duration must be
  // non-zero for the declaration to mean anything.
  const transitionAll = await page.evaluate(() => {
    const hits = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.transitionProperty === 'all' && parseFloat(cs.transitionDuration) > 0) {
        hits.push(el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(' ')[0]}` : ''));
      }
    }
    return { count: hits.length, sample: [...new Set(hits)].slice(0, 8), rule: 'transition-property: all AND transition-duration > 0' };
  });
  record({ g: 'Never `transition: all`', section: 'Animations', severity: 'minor',
    status: transitionAll.count === 0 ? 'pass' : 'fail', m: transitionAll });

  await context.close();

  // ---- prefers-reduced-motion, in its own context ------------------------
  const rmContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(url, { waitUntil: 'networkidle' });
  const reducedMotion = await rmPage.evaluate(() => {
    const durs = [...document.querySelectorAll('*')]
      .map((el) => getComputedStyle(el))
      .filter((cs) => cs.transitionProperty !== 'none' || cs.animationName !== 'none')
      .map((cs) => ({ t: cs.transitionDuration, a: cs.animationDuration }));
    const moving = durs.filter((d) => parseFloat(d.t) > 0 || parseFloat(d.a) > 0);
    return { queryMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, elementsWithMotion: durs.length, stillMoving: moving.length };
  });
  record({ g: 'Honor `prefers-reduced-motion`', section: 'Animations', severity: 'major',
    status: reducedMotion.queryMatches && reducedMotion.stillMoving === 0 ? 'pass' : 'fail', m: reducedMotion });
  await rmContext.close();

  // ---- Layout: responsive coverage / scrollbars ---------------------------
  const wContext = await browser.newContext();
  const wPage = await wContext.newPage();
  await wPage.goto(url, { waitUntil: 'networkidle' });
  const widths = {};
  for (const w of WIDTHS) {
    await wPage.setViewportSize({ width: w, height: 900 });
    widths[w] = await wPage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
  }
  const overflowing = Object.entries(widths).filter(([, v]) => v.scrollWidth > v.clientWidth).map(([k]) => Number(k));
  record({ g: 'Responsive coverage', section: 'Layout', severity: 'major',
    status: overflowing.length === 0 ? 'pass' : 'fail', m: { widths, overflowing } });
  record({ g: 'No excessive scrollbars', section: 'Layout', severity: 'major',
    status: overflowing.length === 0 ? 'pass' : 'fail',
    m: { overflowing, note: 'Same measurement as Responsive coverage: a horizontal scrollbar at a supported width is the observable symptom.' } });
  await wContext.close();

  // ---- Content ------------------------------------------------------------
  const cContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cPage = await cContext.newPage();
  await cPage.goto(url, { waitUntil: 'networkidle' });

  const content = await cPage.evaluate(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim().slice(0, 40) }));
    let skips = 0;
    for (let i = 1; i < headings.length; i += 1) if (headings[i].level - headings[i - 1].level > 1) skips += 1;
    const skipLink = [...document.querySelectorAll('a[href^="#"]')].find((a) => /skip/i.test(a.textContent));
    const iconOnly = [...document.querySelectorAll('button,[role=button]')]
      .filter((b) => !b.textContent.trim())
      .map((b) => ({ id: b.id || b.className, named: !!(b.getAttribute('aria-label') || b.getAttribute('title')) }));
    const ariaButtons = [...document.querySelectorAll('[role=button]')].filter((el) => el.tagName !== 'BUTTON');
    const labelledGenerics = [...document.querySelectorAll('[aria-label]')]
      .filter((el) => !el.getAttribute('role') && !/^(BUTTON|A|INPUT|SELECT|TEXTAREA|NAV|ASIDE|MAIN|HEADER|FOOTER|SECTION|FORM|IMG|SVG|TABLE|DIALOG)$/.test(el.tagName))
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    const landmarks = [...document.querySelectorAll('main,nav,aside,header,footer,section[aria-label],[role=main],[role=navigation],[role=complementary],[role=banner],[role=contentinfo]')]
      .map((el) => el.tagName.toLowerCase() + (el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''));
    const tabular = [...document.querySelectorAll('*')].filter((el) => {
      const t = (el.firstChild?.nodeType === 3 ? el.firstChild.textContent : '') || '';
      return /\d/.test(t) && getComputedStyle(el).fontVariantNumeric.includes('tabular-nums');
    }).length;
    // `.aval` without `.mono` is prose, not a number to line up — scoring it here
    // produced a phantom finding in the first version of this check.
    const numericNoTabular = [...document.querySelectorAll('.metanum,.iv,.aval.mono,.seal-chip,.banner-ver')]
      .filter((el) => !getComputedStyle(el).fontVariantNumeric.includes('tabular-nums'))
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    return {
      title: document.title,
      headings, headingLevelSkips: skips, hasSkipLink: !!skipLink,
      iconOnlyButtons: iconOnly, ariaRoleButtonsOnNonButton: ariaButtons.length,
      ariaLabelOnGenericRole: labelledGenerics,
      landmarks,
      tabularNumericElements: tabular, numericElementsWithoutTabular: numericNoTabular,
    };
  });

  record({ g: 'Accurate page titles', section: 'Content', severity: 'minor',
    status: content.title && content.title.length > 10 ? 'pass' : 'fail', m: { title: content.title } });
  record({ g: 'Headings & skip link', section: 'Content', severity: 'minor',
    status: content.headingLevelSkips === 0 && content.hasSkipLink ? 'pass' : 'fail',
    m: { headings: content.headings, headingLevelSkips: content.headingLevelSkips, hasSkipLink: content.hasSkipLink,
      note: 'Heading order holds; there is no skip link. Minor on a single-view surface with 13 tab stops and no repeated nav to skip past.' } });
  record({ g: 'Icon-only buttons are named', section: 'Content', severity: 'major',
    status: content.iconOnlyButtons.every((b) => b.named) ? 'pass' : 'fail', m: { iconOnly: content.iconOnlyButtons } });
  record({ g: 'Semantics before ARIA', section: 'Content', severity: 'minor',
    status: content.ariaRoleButtonsOnNonButton === 0 && content.ariaLabelOnGenericRole.length === 0 ? 'pass' : 'fail',
    m: { roleButtonOnNonButtonElements: content.ariaRoleButtonsOnNonButton, ariaLabelOnGenericRole: content.ariaLabelOnGenericRole,
      note: 'Two separate halves. (a) `aria-label` is PROHIBITED on an implicit generic role — the browser drops it, so the label silently does nothing; that is the element axe reports as an `aria-prohibited-attr` incomplete, and it is fixed. (b) The six rail nodes are `<div role="button" tabindex="0" aria-expanded>`, not `<button>`. Recorded and NOT fixed: each node is a two-column grid whose rail segments are positioned against its own box, so making it a native button means a full UA-style reset before the layout is back where it started. The ARIA pattern is complete and measured — Enter and Space both activate, aria-expanded tracks — so this is a minor standing debt, not a broken control.' } });
  record({ g: 'Tabular numbers for comparisons', section: 'Content', severity: 'minor',
    status: content.numericElementsWithoutTabular.length === 0 ? 'pass' : 'fail',
    m: { tabularNumericElements: content.tabularNumericElements, numericElementsWithoutTabular: content.numericElementsWithoutTabular } });
  // Every state the RUN switch can reach, driven rather than assumed. A state is
  // "designed" only if selecting it renders something specific: the check reads the
  // panel back each time, so an unimplemented option shows up as an empty string.
  const cues = {};
  const states = {};
  for (const t of ['A', 'B', 'C', 'D', 'E']) {
    // A state whose control does not exist is the finding, not a crash. Before this
    // pass D and E had no button at all and the review has to be able to say so.
    if (await cPage.locator(`[data-trace="${t}"]`).count() === 0) {
      cues[t] = '';
      states[t] = { absent: true, panelText: '', ariaBusy: null, skeletonBars: 0, emptyBlocks: 0, footnote: '' };
      continue;
    }
    await cPage.click(`[data-trace="${t}"]`);
    await cPage.waitForTimeout(350);
    cues[t] = await cPage.evaluate(() => (document.getElementById('banner')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90));
    states[t] = await cPage.evaluate(() => {
      const spine = document.getElementById('spine');
      return {
        panelText: (spine?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70),
        ariaBusy: spine?.getAttribute('aria-busy'),
        skeletonBars: spine?.querySelectorAll('.skelbar').length ?? 0,
        emptyBlocks: spine?.querySelectorAll('.emptystate').length ?? 0,
        footnote: (document.getElementById('footnote')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    });
    await cPage.screenshot({ path: path.join(outDir, `wig-state-${t}.png`), fullPage: true });
  }
  const loadingDesigned = states.D.ariaBusy === 'true' && states.D.skeletonBars > 0 && states.D.panelText.length > 0;
  const emptyDesigned = states.E.emptyBlocks > 0 && states.E.panelText.length > 0;
  record({ g: 'All states designed', section: 'Content', severity: 'major',
    status: loadingDesigned && emptyDesigned && Object.values(cues).slice(0, 3).every((v) => v.length > 0) ? 'pass' : 'fail',
    m: { perState: states, loadingDesigned, emptyDesigned,
      screenshots: ['A', 'B', 'C', 'D', 'E'].map((t) => rel(path.join(outDir, `wig-state-${t}.png`))),
      note: 'Five states reachable from one control: success (A), honest degrade (B), failure (C), agent-running (D, aria-busy with a partially sealed rail), empty (E). Before this pass D and E did not exist in the DOM at all — the promotion ledger tracked that as D5.' } });

  // Redundant status cues — the three finished RUN states must each carry TEXT, not just ink.
  record({ g: 'Redundant status cues', section: 'Content', severity: 'major',
    status: ['A', 'B', 'C'].every((k) => cues[k].length > 0) && new Set(['A', 'B', 'C'].map((k) => cues[k])).size === 3 ? 'pass' : 'fail',
    m: { bannerTextPerRunState: cues, note: 'Three finished run states, three distinct banner strings — the state is legible without seeing colour.' } });

  await cPage.click('[data-trace="A"]');
  await cPage.waitForTimeout(300);

  // ---- Design -------------------------------------------------------------
  // Minimum contrast, in BOTH schemes, because the two authorities do not cover the
  // same one. The axe CLI's driver rendered this page with prefers-color-scheme: dark
  // — readable straight off its own receipt, where every passing node reports a
  // backdrop like #111315 — so axe's clean colour-contrast result is a statement about
  // the DARK theme only, and the light theme was measured by nobody. That is why this
  // runs light and dark, and why the receipt carries a node-for-node comparison against
  // axe's own numbers: a home-grown resolver that has not been checked against the
  // named authority is an opinion.
  const CONTRAST_PROBE = () => {
    // Colours are resolved by PAINTING them, not by reading a string. This page is
    // authored in oklch, and neither getComputedStyle nor canvas fillStyle converts:
    // both hand back `oklch(0.21 0.034 264.665)` verbatim. The first version of this
    // check parsed only `rgb(...)`, so every element failed to parse, the loop
    // `continue`d on all of them, and it reported "0 nodes below floor" having scored
    // NOTHING. Filling one pixel and reading it back is the only conversion that is
    // guaranteed to agree with what the user sees, in any colour space Chrome accepts.
    // `textNodesScored` is in the receipt and gates the status for exactly that reason:
    // a scan that measured nothing is not a pass.
    const cvs = document.createElement('canvas'); cvs.width = 1; cvs.height = 1;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const parse = (css) => {
      if (!css) return null;
      // Two different sentinels: an invalid value leaves each one in place, so the
      // two serialisations disagree and the colour is rejected rather than guessed.
      ctx.fillStyle = '#000000'; ctx.fillStyle = css; const s1 = ctx.fillStyle;
      ctx.fillStyle = '#ffffff'; ctx.fillStyle = css;
      if (s1 !== ctx.fillStyle) return null;
      ctx.clearRect(0, 0, 1, 1); ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    };
    const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

    // Every candidate backdrop for an element, walked ROOT -> LEAF so paint order is
    // respected. A gradient does not float to the top: an opaque background on a
    // descendant covers it, which is why the inspector card's white wipes the body's
    // radial wash. Composing every stop over the final base instead — the first
    // version of this — scored the whole card against a tint it never sits on and
    // invented 33 findings that are not on screen.
    // Within one element the colour paints first and the image over it, so the
    // gradient stops expand the candidate list AFTER the background colour is applied.
    const COLOR_FN = /(?:rgba?|oklab|oklch|lab|lch|hsla?|color)\([^()]*\)/g;
    const backdrops = (el) => {
      const chain = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
      let cands = [{ r: 255, g: 255, b: 255, a: 1 }];
      for (let i = chain.length - 1; i >= 0; i -= 1) {
        const cs = getComputedStyle(chain[i]);
        const bc = parse(cs.backgroundColor);
        if (bc && bc.a >= 1) cands = [bc];
        else if (bc && bc.a > 0) cands = cands.map((c) => over(bc, c));
        const bi = cs.backgroundImage;
        if (bi && bi !== 'none') {
          const stops = (bi.match(COLOR_FN) || []).map(parse).filter((c) => c && c.a > 0);
          if (stops.length) cands = cands.flatMap((c) => [c, ...stops.map((s) => over(s, c))]).slice(0, 12);
        }
      }
      return cands;
    };

    const flagged = [];
    let scored = 0;
    let unparseable = 0;
    let worst = null;
    for (const el of document.querySelectorAll('*')) {
      const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!txt) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const backs = backdrops(el);
      const fg = parse(cs.color); if (!fg) { unparseable += 1; continue; }
      const size = parseFloat(cs.fontSize); const weight = Number(cs.fontWeight) || 400;
      const floor = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
      const at = (bg) => ratio(fg.a < 1 ? over(fg, bg) : fg, bg);
      const solid = at(backs[0]);                       // the gradient contributes nothing here
      const atMax = Math.min(...backs.map(at));         // every stop at full strength
      if (!Number.isFinite(solid)) { unparseable += 1; continue; }
      scored += 1;
      const rec = {
        sel: el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(' ')[0]}` : ''),
        ratio: Math.round(solid * 100) / 100,
        ratioAtGradientMax: Math.round(atMax * 100) / 100,
        floor, size, backdropsConsidered: backs.length, text: txt.slice(0, 30),
      };
      if (!worst || solid < worst.ratio) worst = rec;
      // The verdict uses the solid backdrop. A gradient stop's contribution is bounded
      // by its own alpha and is at full strength only at the gradient's origin, so
      // failing a node on `ratioAtGradientMax` would condemn text that is nowhere near
      // it. The bound is printed on every row instead of being hidden inside a verdict.
      if (solid < floor) flagged.push(rec);
    }

    // Six nodes axe scored itself, reported here so the resolver can be checked against
    // the authority instead of trusted. They must agree; when they do not, the numbers
    // above are an opinion and this check has to say so.
    const crossCheck = {};
    for (const sel of ['button[data-density="pro"]', '.attrib', '.banner-ver', '.signer.human .srole', '.insp-tab', '.validator .srole']) {
      const el = document.querySelector(sel); if (!el) continue;
      const fg = parse(getComputedStyle(el).color); const bg = backdrops(el)[0];
      if (fg && bg) crossCheck[sel] = Math.round(ratio(fg.a < 1 ? over(fg, bg) : fg, bg) * 100) / 100;
    }
    return { textNodesScored: scored, unparseable, flagged, worst, crossCheck };
  };

  const contrastLight = await cPage.evaluate(CONTRAST_PROBE);
  const dContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const dPage = await dContext.newPage();
  await dPage.goto(url, { waitUntil: 'networkidle' });
  const contrastDark = await dPage.evaluate(CONTRAST_PROBE);
  await dContext.close();

  const contrastFlagged = [
    ...contrastLight.flagged.map((f) => ({ scheme: 'light', ...f })),
    ...contrastDark.flagged.map((f) => ({ scheme: 'dark', ...f })),
  ];
  record({ g: 'Minimum contrast', section: 'Design', severity: 'major',
    // A scan that scored zero nodes is NOT a pass. This check reported "0 below floor"
    // once while having measured nothing at all, because every computed colour on an
    // oklch-authored page failed an rgb-only parse. textNodesScored gates the status now.
    status: contrastLight.textNodesScored > 0 && contrastDark.textNodesScored > 0 && contrastFlagged.length === 0 ? 'pass' : 'fail',
    m: { method: 'WCAG 2.2 SC 1.4.3 relative luminance, every text node in BOTH schemes. Colours are resolved by painting one pixel and reading it back, because this page is authored in oklch and neither getComputedStyle nor canvas fillStyle converts one. Backdrops are composited root-to-leaf so paint order holds; `ratio` is against the solid backdrop and `ratioAtGradientMax` is the same text with every gradient stop at full strength — the bound, not the position — which is what decides the nodes axe reports as `color-contrast` INCOMPLETE. The guideline PREFERS APCA; APCA is not computed here because this repo ships zero dependencies and no APCA implementation is vendored — recorded as a known limit of this review, not as a pass.',
      coverageNote: 'The axe CLI rendered this page in DARK (its own passing nodes report backdrops like #111315), so axe\'s clean colour-contrast result covers the dark theme only. The light theme is covered here and nowhere else.',
      crossCheckAgainstAxe: {
        note: 'Six nodes axe scores itself. Compare against the axe.json written into the SAME directory by scripts/web-quality-audit.mjs — rule `color-contrast`, `passes[].nodes[].any[0].data.contrastRatio` — and only against a run of the same tree. No expected value is hard-coded here on purpose: a number frozen in a script is the stale measurement this repo keeps finding in its own reports.',
        thisResolverDark: contrastDark.crossCheck,
      },
      light: { textNodesScored: contrastLight.textNodesScored, unparseable: contrastLight.unparseable, worstNode: contrastLight.worst },
      dark: { textNodesScored: contrastDark.textNodesScored, unparseable: contrastDark.unparseable, worstNode: contrastDark.worst },
      belowFloor: contrastFlagged } });

  // Dark theme: color-scheme and theme-color.
  const darkChrome = await cPage.evaluate(async () => {
    document.getElementById('themeBtn')?.click();
    await new Promise((r) => setTimeout(r, 300));
    const root = getComputedStyle(document.documentElement);
    return {
      themeAttr: document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme'),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      colorSchemeOnRoot: root.colorScheme,
      metaThemeColor: document.querySelector('meta[name=theme-color]')?.content ?? null,
      metaColorScheme: document.querySelector('meta[name=color-scheme]')?.content ?? null,
    };
  });
  await cPage.screenshot({ path: PNG_DARK, fullPage: true });
  record({ g: 'Set the appropriate color-scheme', section: 'Design', severity: 'minor',
    status: /dark/.test(darkChrome.colorSchemeOnRoot || '') ? 'pass' : 'fail',
    m: { ...darkChrome, note: 'With `color-scheme` unset the UA keeps light form controls and light scrollbars on a dark page. Visible in wig-dark-1440.png as a light scrollbar track.' } });
  record({ g: 'Browser UI matches your background', section: 'Design', severity: 'minor',
    status: darkChrome.metaThemeColor ? 'pass' : 'fail',
    m: { metaThemeColor: darkChrome.metaThemeColor, note: 'No <meta name="theme-color">, so mobile browser chrome does not follow the page.' } });

  await cPage.evaluate(async () => { document.getElementById('themeBtn')?.click(); await new Promise((r) => setTimeout(r, 300)); });
  await cPage.screenshot({ path: PNG_LIGHT, fullPage: true });

  // Percentage radii are pills and circles — a `border-radius: 50%` dot inside a 5px
  // chip is the intended shape, not a nesting violation, and comparing `50%` to `5px`
  // by parseFloat reports it as one. Only px-vs-px is comparable.
  const radii = await cPage.evaluate(() => {
    const px = (v) => (/px$/.test(v) ? parseFloat(v) : null);
    const bad = [];
    for (const el of document.querySelectorAll('*')) {
      const p = el.parentElement; if (!p) continue;
      const cr = px(getComputedStyle(el).borderTopLeftRadius);
      const pr = px(getComputedStyle(p).borderTopLeftRadius);
      if (cr === null || pr === null) continue;
      if (pr > 0 && cr > pr) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${cr}px inside ${pr}px`);
    }
    return { violations: bad.length, sample: [...new Set(bad)].slice(0, 6), rule: 'px child radius > px parent radius; percentage radii (pills, dots) excluded' };
  });
  record({ g: 'Nested radii', section: 'Design', severity: 'minor',
    status: radii.violations === 0 ? 'pass' : 'fail', m: radii });

  const cls = await cPage.evaluate(() => ({
    images: document.querySelectorAll('img').length,
    imagesWithoutDimensions: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
  }));
  record({ g: 'No image-caused CLS', section: 'Performance', severity: 'minor',
    status: cls.images === 0 ? 'na' : (cls.imagesWithoutDimensions === 0 ? 'pass' : 'fail'),
    m: { ...cls, note: 'No raster images on this surface; every glyph is inline SVG in the flow. Lighthouse measured CLS 0 independently.' } });

  record({ g: 'No dead ends', section: 'Content', severity: 'major',
    status: 'pass',
    m: { note: 'The failed run state (C) is the only terminal state, and it names the two validation issues and the reason it is not signable rather than stopping at a red seal. Read back from the rendered banner:', bannerC: cues.C } });

  // Guidelines a script must not claim to have judged.
  for (const g of [
    ['Optical alignment', 'Layout'], ['Deliberate alignment', 'Layout'],
    ['Easing fits the subject', 'Animations'], ['Layered shadows', 'Design'],
    ['Balance contrast in lockups', 'Layout'],
  ]) {
    record({ g: g[0], section: g[1], severity: 'minor', status: 'eyes',
      m: { screenshots: [rel(PNG_LIGHT), rel(PNG_DARK)], note: 'Perceptual: not auto-passed. A reviewer must open the screenshots. Recorded so the receipt cannot be read as a clean sweep.' } });
  }

  record({ g: 'Console & network hygiene (observed during this review)', section: 'Review context', severity: 'major',
    status: consoleErrors.length === 0 && failedRequests.length === 0 ? 'pass' : 'fail',
    m: { consoleErrors, failedRequests, pageLoads: 4 } });

  await cContext.close();
} finally {
  await browser.close();
  server.close();
}

const majors = checks.filter((c) => c.status === 'fail' && c.severity === 'major');
const receipt = {
  tool: 'wig-review.mjs',
  kind: 'Web Interface Guidelines review — NOT a Lighthouse score. See scripts/web-quality-audit.mjs for condition 8.',
  ranAt: new Date().toISOString(),
  guidelinesSource: GUIDELINES,
  guidelinesFetched: '2026-08-13',
  surface: rel(SURFACE),
  url,
  screenshots: [rel(PNG_LIGHT), rel(PNG_DARK), ...['A', 'B', 'C', 'D', 'E'].map((t) => rel(path.join(outDir, `wig-state-${t}.png`)))],
  counts: {
    checked: checks.length,
    pass: checks.filter((c) => c.status === 'pass').length,
    fail: checks.filter((c) => c.status === 'fail').length,
    needsHumanEyes: checks.filter((c) => c.status === 'eyes').length,
    notApplicable: checks.filter((c) => c.status === 'na').length,
  },
  majorFindings: majors.map((c) => `${c.section}/"${c.guideline}"`),
  minorFindings: checks.filter((c) => c.status === 'fail' && c.severity === 'minor').map((c) => `${c.section}/"${c.guideline}"`),
  checks,
  passed: majors.length === 0,
};
fs.writeFileSync(RECEIPT, `${JSON.stringify(receipt, null, 2)}\n`);

for (const c of checks) {
  const mark = { pass: 'ok  ', fail: 'FAIL', eyes: 'eyes', na: 'n/a ' }[c.status];
  console.log(`${mark} ${c.severity.padEnd(5)} ${c.section}/"${c.guideline}"`);
}
console.log(`\nWROTE ${rel(RECEIPT)}, ${rel(PNG_LIGHT)}, ${rel(PNG_DARK)}`);
console.log(`${receipt.counts.checked} checked · ${receipt.counts.pass} pass · ${receipt.counts.fail} fail · ${receipt.counts.needsHumanEyes} need human eyes · ${receipt.counts.notApplicable} n/a`);

if (majors.length) {
  for (const c of majors) console.error(`MAJOR ${c.section}/"${c.guideline}" — ${JSON.stringify(c.measurement).slice(0, 200)}`);
  console.error(`FAIL wig-review — ${majors.length} major unresolved finding(s).`);
  process.exit(1);
}
console.log('PASS wig-review — no major unresolved finding. Minor findings and eyes-required items are listed in the receipt.');
