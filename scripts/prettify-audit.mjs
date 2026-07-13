#!/usr/bin/env node
/**
 * prettify-audit.mjs — machine-measurable VISUAL RUBRIC signals for agentic-ui-qa B9.
 * The measurement half of PRETTIFY.md: turns rendered pixels into a repeatable
 * "design-token discipline" scorecard instead of a 0/2 vibe. ADVISORY, never pass/fail —
 * it always exits 0. The judge + guardrails (PRETTIFY.md) decide; this only reports.
 *
 * Grounded in the verified research (see PRETTIFY.md "References backing each signal"):
 *   Refactoring UI (grayscale-first hierarchy), Project Wallace css-analyzer / CSS Stats
 *   (uniqueness ratios), 8pt Grid (off-grid rate), WCAG 2.2 SC 1.4.3 + WebAIM (contrast
 *   floor), Design Lint (radius/shadow/icon consistency), prefers-reduced-motion / SC 2.3.3.
 *
 * DEPENDENCY-FREE: resolves Playwright from a `repo` field exactly like pixels.cjs.
 *
 * Usage:
 *   node <this-skill>/scripts/prettify-audit.mjs <config.json>
 *   node <this-skill>/scripts/prettify-audit.mjs <url>            # quick, defaults
 *
 * config.json:
 * {
 *   "repo": "D:/VSCode Projects/parity-studio",  // any repo with playwright; omit = walk up from cwd
 *   "url": "https://app.example.com/",
 *   "outDir": "C:/.../qa-20260713",              // JSON report written here (optional)
 *   "viewport": { "width": 1512, "height": 812 },
 *   "scheme": "light",                            // or "dark"
 *   "clicks": ["text=Explore the sample"],        // pre-audit navigation (SPA entry)
 *   "waitMs": 1200,                               // settle time after clicks (SPA hydrate)
 *   "tokenAllowlist": ["#0a0a0a", "rgb(10,10,10)"] // OPTIONAL app token colors; off-list = flagged
 * }
 *
 * Output: a scored JSON ({ rubric: {V1..V9}, top prettify targets w/ selectors }) plus a
 * human summary to stdout. Exit 0 always (report is advisory).
 * After running: hand the JSON to the PRETTIFY vision-judge; re-run after a restyle for the delta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

async function resolvePlaywright(repoHint) {
  const roots = [];
  if (repoHint) roots.push(repoHint);
  let d = process.cwd();
  for (let i = 0; i < 6; i++) { roots.push(d); const p = path.dirname(d); if (p === d) break; d = p; }
  for (const r of roots) {
    const pw = path.join(r, 'node_modules', 'playwright');
    if (fs.existsSync(pw)) return require(pw);
  }
  try { return require('playwright'); } catch {}
  console.error('FATAL: playwright not found. Set "repo" in the config to a repo that has it (pnpm install there).');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) { console.error('Usage: node prettify-audit.mjs <config.json | url>'); process.exit(1); }
let cfg;
if (/^https?:\/\//i.test(arg)) cfg = { url: arg };
else cfg = JSON.parse(fs.readFileSync(arg, 'utf8'));
if (!cfg.url) { console.error('FATAL: config needs a "url".'); process.exit(1); }

const { chromium } = await resolvePlaywright(cfg.repo);
const vp = cfg.viewport || { width: 1512, height: 812 };

// ---------- the in-page measurement (runs in the browser over VISIBLE elements) ----------
function pageProbe(allowlist) {
  // -- helpers --
  const parseColor = (s) => {
    if (!s) return null;
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const contrast = (fg, bg) => {
    const L1 = lum(fg), L2 = lum(bg);
    const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  };
  const composite = (fg, bg) => { // fg over bg by alpha
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  };
  // effective background: walk ancestors, composite non-transparent bg colors
  const effBg = (el) => {
    let acc = { r: 255, g: 255, b: 255, a: 1 }; // page default white; overwritten below
    const stack = [];
    let n = el;
    while (n && n.nodeType === 1) { stack.push(n); n = n.parentElement; }
    // resolve from root down so nearer ancestors composite on top
    let base = null;
    for (let i = stack.length - 1; i >= 0; i--) {
      const bc = parseColor(getComputedStyle(stack[i]).backgroundColor);
      if (bc && bc.a > 0) base = base ? composite(bc, base) : (bc.a < 1 ? composite(bc, { r: 255, g: 255, b: 255, a: 1 }) : bc);
    }
    // fall back to documentElement bg if nothing painted
    if (!base) {
      const hb = parseColor(getComputedStyle(document.body).backgroundColor) || parseColor(getComputedStyle(document.documentElement).backgroundColor);
      base = hb && hb.a > 0 ? (hb.a < 1 ? composite(hb, { r: 255, g: 255, b: 255, a: 1 }) : hb) : acc;
    }
    return base;
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
  const selectorOf = (el) => {
    if (el.id) return '#' + el.id;
    let s = el.tagName.toLowerCase();
    const tid = el.getAttribute('data-testid');
    if (tid) return s + '[data-testid="' + tid + '"]';
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    return s;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false;
    return true;
  };

  const all = Array.from(document.querySelectorAll('*')).filter(visible);
  const textNodesHaveText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

  const fontSizes = new Map();     // px -> count
  const fontWeights = new Map();
  const textColors = new Map();    // hex -> count
  const spacing = new Map();       // px -> count (margins/padding/gap)
  const radii = new Map();
  const shadows = new Map();
  const iconSizes = new Map();     // "w x h" for svg/i
  const leftEdges = new Map();     // rounded left px -> count
  const transitions = [];          // {sel, durMs}
  const contrastFlags = [];        // {sel, ratio, size, weight, fg, bg, text}
  let animatedInfinite = 0;
  let reducedMotionActive = false;
  try { reducedMotionActive = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  const bump = (map, k) => map.set(k, (map.get(k) || 0) + 1);
  const parseDur = (s) => (s || '').split(',').map((v) => {
    v = v.trim(); if (v.endsWith('ms')) return parseFloat(v); if (v.endsWith('s')) return parseFloat(v) * 1000; return 0;
  });

  for (const el of all) {
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();

    // spacing (only nonzero)
    for (const prop of ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'columnGap', 'rowGap']) {
      const v = parseFloat(cs[prop]);
      if (v && v > 0 && v < 400) bump(spacing, Math.round(v));
    }
    // radius
    for (const prop of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']) {
      const v = parseFloat(cs[prop]);
      if (v && v > 0 && v < 200) bump(radii, Math.round(v));
    }
    // shadow
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow.slice(0, 80));

    // motion
    for (const d of parseDur(cs.transitionDuration)) if (d > 0) transitions.push({ sel: selectorOf(el), durMs: d });
    for (const d of parseDur(cs.animationDuration)) if (d > 0) transitions.push({ sel: selectorOf(el), durMs: d });
    if (cs.animationIterationCount && cs.animationIterationCount.includes('infinite')) animatedInfinite++;

    // icon sizes
    if (tag === 'svg' || tag === 'i') {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w > 0 && h > 0 && w < 128) bump(iconSizes, w + 'x' + h);
    }

    // left-edge clustering (block-ish elements only)
    const r = el.getBoundingClientRect();
    if (r.width > 40 && r.height > 8) bump(leftEdges, Math.round(r.left));

    // typography + color: only elements that directly render text (skip SVG <text>,
    // whose computed font-size is in SVG user units and pollutes the real UI type-scale)
    if (textNodesHaveText(el) && !el.closest('svg')) {
      const fsz = parseFloat(cs.fontSize);
      if (!(fsz >= 6)) continue; // ignore sub-6px noise / non-rendered text metrics
      if (fsz) bump(fontSizes, Math.round(fsz * 10) / 10);
      const fw = parseInt(cs.fontWeight, 10);
      if (fw) bump(fontWeights, fw);
      const fg = parseColor(cs.color);
      if (fg && fg.a > 0) {
        bump(textColors, hex(fg));
        // contrast
        const bg = effBg(el);
        const solidFg = fg.a < 1 ? composite(fg, bg) : fg;
        const ratio = contrast(solidFg, bg);
        const isLarge = fsz >= 24 || (fsz >= 18.66 && fw >= 700);
        const floor = isLarge ? 3 : 4.5;
        if (ratio < floor) {
          const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
          contrastFlags.push({ sel: selectorOf(el), ratio: Math.round(ratio * 100) / 100, size: fsz, weight: fw, fg: hex(solidFg), bg: hex(bg), text: txt });
        }
      }
    }
  }

  // focus-visible presence: scan stylesheets for :focus-visible / :focus rules
  let focusVisibleRules = 0, focusRules = 0;
  try {
    for (const ss of Array.from(document.styleSheets)) {
      let rules; try { rules = ss.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        const sel = rule.selectorText || '';
        if (sel.includes(':focus-visible')) focusVisibleRules++;
        else if (sel.includes(':focus')) focusRules++;
      }
    }
  } catch (e) {}

  const mapObj = (m) => Object.fromEntries(Array.from(m.entries()).sort((a, b) => b[1] - a[1]));
  const sortedKeys = (m) => Array.from(m.keys()).sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b))));

  // off-grid spacing (not multiple of 4)
  const spacingVals = Array.from(spacing.entries());
  const spacingTotal = spacingVals.reduce((s, [, c]) => s + c, 0);
  const offGrid4 = spacingVals.filter(([v]) => v % 4 !== 0).reduce((s, [, c]) => s + c, 0);
  const offGrid8 = spacingVals.filter(([v]) => v % 8 !== 0 && v % 4 !== 0).reduce((s, [, c]) => s + c, 0);

  // off-allowlist colors
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, '');
  const allow = (allowlist || []).map(norm);
  const offToken = allow.length ? Array.from(textColors.keys()).filter((c) => !allow.includes(norm(c))) : [];

  // left-edge clustering: fraction of block elements NOT on the top-8 edges
  const edgeEntries = Array.from(leftEdges.entries()).sort((a, b) => b[1] - a[1]);
  const edgeTotal = edgeEntries.reduce((s, [, c]) => s + c, 0);
  const topEdges = edgeEntries.slice(0, 8).reduce((s, [, c]) => s + c, 0);
  const alignStray = edgeTotal ? Math.round((1 - topEdges / edgeTotal) * 1000) / 1000 : 0;

  const longTransitions = transitions.filter((t) => t.durMs > 400);

  return {
    counts: {
      visibleElements: all.length,
      textElements: Array.from(fontSizes.values()).reduce((s, c) => s + c, 0),
    },
    fontSizes: { unique: fontSizes.size, scale: sortedKeys(fontSizes), histogram: mapObj(fontSizes) },
    fontWeights: { unique: fontWeights.size, values: sortedKeys(fontWeights) },
    textColors: { unique: textColors.size, offAllowlistCount: offToken.length, offAllowlist: offToken.slice(0, 12), histogram: mapObj(textColors) },
    spacing: { uniqueValues: spacing.size, scale: sortedKeys(spacing), totalDecls: spacingTotal, offGrid4Count: offGrid4, offGrid4Rate: spacingTotal ? Math.round((offGrid4 / spacingTotal) * 1000) / 1000 : 0, offGrid8Count: offGrid8 },
    radii: { unique: radii.size, values: sortedKeys(radii) },
    shadows: { unique: shadows.size },
    icons: { uniqueSizes: iconSizes.size, sizes: Array.from(iconSizes.keys()) },
    contrast: { flagged: contrastFlags.length, worst: contrastFlags.sort((a, b) => a.ratio - b.ratio).slice(0, 12) },
    alignment: { distinctLeftEdges: leftEdges.size, strayRate: alignStray },
    motion: { reducedMotionActive, animatedInfinite, transitionsWithDuration: transitions.length, over400ms: longTransitions.length, over400msSamples: longTransitions.slice(0, 6) },
    focus: { focusVisibleRules, focusRules },
  };
}

// ---------- scoring: raw signals -> V1..V9 (0/1/2) ----------
function score(p) {
  const rubric = {};
  const targets = [];
  const push = (id, name, s, why, evidence) => { rubric[id] = { name, score: s, why }; if (s < 2 && evidence) targets.push({ id, name, score: s, why, evidence }); };

  // V1 type-scale discipline — Refactoring UI / css-analyzer font-sizes.unique
  const fs = p.fontSizes.unique;
  push('V1', 'Type-scale discipline', fs <= 7 ? 2 : fs <= 10 ? 1 : 0,
    `${fs} distinct font-sizes (<=7 disciplined, >10 sprawl)`,
    fs > 7 ? { scale: p.fontSizes.scale } : null);

  // V2 spacing / grid rhythm — 8pt Grid off-grid rate + distinct values
  const og = p.spacing.offGrid4Rate, sv = p.spacing.uniqueValues;
  const v2 = (og <= 0.1 && sv <= 12) ? 2 : (og <= 0.2 || sv <= 18) ? 1 : 0;
  push('V2', 'Spacing / grid rhythm', v2,
    `off-4px rate ${og} (<=0.10 good), ${sv} distinct spacing values (<=12 good)`,
    v2 < 2 ? { offGrid4Rate: og, offGrid4Count: p.spacing.offGrid4Count, uniqueValues: sv, scale: p.spacing.scale } : null);

  // V3 color restraint & token adherence — CSS Stats unique colors + strict-value off-token
  const tc = p.textColors.unique, off = p.textColors.offAllowlistCount;
  let v3;
  if (off > 0) v3 = tc <= 12 ? 1 : 0; // any off-token literal caps at 1
  else v3 = tc <= 12 ? 2 : tc <= 20 ? 1 : 0;
  push('V3', 'Color restraint & token adherence', v3,
    `${tc} distinct text colors (<=12 good)${off ? `, ${off} off-allowlist` : ''}`,
    v3 < 2 ? { uniqueTextColors: tc, offAllowlist: p.textColors.offAllowlist } : null);

  // V4 hierarchy — grayscale-first: needs >=2 weights AND a value ramp (multiple text colors as tints, not hues)
  const fw = p.fontWeights.unique;
  const v4 = fw >= 2 ? 2 : fw === 1 ? 0 : 1;
  push('V4', 'Hierarchy (weight + size + value)', v4,
    `${fw} distinct font-weights (>=2 needed for weight hierarchy)`,
    v4 < 2 ? { fontWeights: p.fontWeights.values } : null);

  // V5 contrast / a11y — WCAG SC 1.4.3 floor, hard P0-adjacent
  const cf = p.contrast.flagged;
  const v5 = cf === 0 ? 2 : cf <= 3 ? 1 : 0;
  push('V5', 'Contrast / legibility (WCAG)', v5,
    `${cf} text nodes below WCAG floor (0 = pass)`,
    cf > 0 ? { flagged: cf, worst: p.contrast.worst } : null);

  // V6 radius/shadow/elevation consistency — Design Lint analog
  const rr = p.radii.unique, sh = p.shadows.unique, ic = p.icons.uniqueSizes;
  const v6 = (rr <= 4 && sh <= 4 && ic <= 4) ? 2 : (rr <= 6 && sh <= 6) ? 1 : 0;
  push('V6', 'Radius / shadow / elevation consistency', v6,
    `${rr} radii, ${sh} shadows, ${ic} icon sizes (each <=4 = defined levels)`,
    v6 < 2 ? { radii: p.radii.values, shadows: sh, iconSizes: p.icons.sizes } : null);

  // V7 alignment — left-edge clustering
  const sr = p.alignment.strayRate;
  const v7 = sr <= 0.25 ? 2 : sr <= 0.45 ? 1 : 0;
  push('V7', 'Alignment / edge discipline', v7,
    `${sr} of block elements off the 8 dominant left-edges (<=0.25 good)`,
    v7 < 2 ? { strayRate: sr, distinctLeftEdges: p.alignment.distinctLeftEdges } : null);

  // V8 state polish (empty/loading/error) — NOT machine-measurable here; vision-judge owns it
  rubric.V8 = { name: 'State polish (empty / loading / error)', score: null, why: 'vision-judge only — capture empty+loading+error PNGs; not derivable from one static DOM read' };

  // V9 motion restraint — prefers-reduced-motion + SC 2.3.3
  const inf = p.motion.animatedInfinite, over = p.motion.over400ms;
  // if reduced-motion is active and animations still run long, that's the real failure
  let v9;
  if (p.motion.reducedMotionActive) v9 = (over === 0 && inf === 0) ? 2 : 0;
  else v9 = (over === 0 && inf === 0) ? 2 : (over + inf <= 3) ? 1 : 0;
  push('V9', 'Motion restraint', v9,
    `${over} transitions >400ms, ${inf} infinite animations${p.motion.reducedMotionActive ? ' (reduced-motion ACTIVE — should be ~0)' : ''}`,
    v9 < 2 ? { over400ms: over, animatedInfinite: inf, samples: p.motion.over400msSamples } : null);

  // focus-visible advisory (feeds B8/A5, not a V-dim by itself)
  const focusOk = (p.focus.focusVisibleRules + p.focus.focusRules) > 0;

  const measured = Object.values(rubric).filter((r) => typeof r.score === 'number');
  const total = measured.reduce((s, r) => s + r.score, 0);
  const max = measured.length * 2;
  targets.sort((a, b) => a.score - b.score);

  return { rubric, targets, focusOk, aggregate: { measuredDims: measured.length, score: total, max, pct: Math.round((total / max) * 100) } };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: vp,
    colorScheme: cfg.scheme === 'dark' ? 'dark' : 'light',
    deviceScaleFactor: 1,
    reducedMotion: cfg.reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(cfg.url, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) {
    console.error('NAVFAIL', e.message.split('\n')[0]);
    await browser.close();
    process.exit(0); // advisory: never hard-fail
  }
  await page.waitForTimeout(cfg.waitMs ?? 800);
  for (const sel of cfg.clicks || []) {
    try { await page.click(sel, { timeout: 4000 }); await page.waitForTimeout(cfg.clickWaitMs ?? 600); }
    catch (e) { console.log('CLICKMISS', sel, '-', e.message.split('\n')[0]); }
  }
  await page.waitForTimeout(cfg.settleMs ?? 500);

  let probe;
  try {
    probe = await page.evaluate(pageProbe, cfg.tokenAllowlist || []);
  } catch (e) {
    console.error('PROBEFAIL', e.message.split('\n')[0]);
    await browser.close();
    process.exit(0);
  }
  await browser.close();

  const scored = score(probe);
  const report = { url: cfg.url, scheme: cfg.scheme || 'light', viewport: vp, when: new Date().toISOString(), signals: probe, ...scored };

  // write JSON if outDir
  if (cfg.outDir) {
    fs.mkdirSync(cfg.outDir, { recursive: true });
    const jf = path.join(cfg.outDir, 'prettify-audit.json');
    fs.writeFileSync(jf, JSON.stringify(report, null, 2));
    console.log('WROTE', jf);
  }

  // human summary
  const R = scored.rubric;
  console.log('\n=== PRETTIFY AUDIT · ' + cfg.url + ' · ' + (cfg.scheme || 'light') + ' · ' + vp.width + 'x' + vp.height + ' ===');
  console.log('visible elements: ' + probe.counts.visibleElements + ' · focus styles: ' + (scored.focusOk ? 'present' : 'ABSENT (A5/B8 flag)'));
  console.log('VISUAL RUBRIC (V1-V9, 2=strong 1=weak 0=absent, V8=vision-only):');
  for (const id of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9']) {
    const r = R[id];
    const s = r.score === null ? 'n/a' : r.score;
    console.log('  ' + id + ' ' + String(s).padEnd(3) + r.name.padEnd(38) + ' — ' + r.why);
  }
  console.log('MEASURED SUBTOTAL: ' + scored.aggregate.score + '/' + scored.aggregate.max + ' (' + scored.aggregate.pct + '%) across ' + scored.aggregate.measuredDims + ' machine dims');
  if (scored.targets.length) {
    console.log('\nTOP PRETTIFY TARGETS (lowest first — feed to the vision-judge / restyle step):');
    for (const t of scored.targets.slice(0, 6)) {
      console.log('  [' + t.id + ' score ' + t.score + '] ' + t.name + ' — ' + t.why);
      if (t.evidence && t.evidence.worst) for (const w of t.evidence.worst.slice(0, 4)) console.log('      contrast ' + w.ratio + ':1  ' + w.sel + '  fg ' + w.fg + ' on ' + w.bg + '  "' + w.text + '"');
      else if (t.evidence && t.evidence.scale) console.log('      scale: ' + JSON.stringify(t.evidence.scale));
      else if (t.evidence) console.log('      ' + JSON.stringify(t.evidence).slice(0, 160));
    }
  } else {
    console.log('\nNo sub-2 machine dimensions — hand to the vision-judge for taste (V8 states, hierarchy read, signature element).');
  }
  console.log('\n(advisory report — exit 0 by design; PRETTIFY.md judge + guardrails decide)\n');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(0); });
