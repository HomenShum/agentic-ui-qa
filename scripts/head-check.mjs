#!/usr/bin/env node
/**
 * head-check.mjs — does the page declare a document shell, and does it hold up
 * at every supported width? Runs in real headless Chromium, not by grepping.
 *
 * Usage:  node scripts/head-check.mjs [url] [--repo <dir>]
 *                [--out <json>] [--png-mobile <png>] [--png-desktop <png>]
 *         node scripts/head-check.mjs            # defaults to this repo's demo surface,
 *                                                # writing into promotion/evidence/
 *
 * Four shell assertions, all read off the rendered document:
 *   doctype      document.doctype !== null      — absent => quirks mode
 *   compatMode   === "CSS1Compat"               — "BackCompat" is the quirks box model
 *   lang         <html lang> non-empty          — WCAG 3.1.1 Level A
 *   viewport     <meta name=viewport> contains width=device-width
 *
 * The viewport assertion is the one a grep cannot make honestly, so it is measured
 * the way a phone measures it: a mobile-emulated context (isMobile) at 375 CSS px.
 * With no meta tag Chromium falls back to a ~980px layout viewport and scales the
 * page down; window.innerWidth reports that fallback. `mobileLayoutViewport` in the
 * receipt is that number — it must equal the device width, not 980.
 *
 * scrollWidth vs clientWidth is measured at every supported width and written to the
 * receipt, but it does NOT gate the exit code: this check guards the document shell,
 * and width policy already belongs to pixels.cjs `hOverflow` asserts and your gate.
 * Measured here because the shell is the first thing blamed for an overflow and this
 * receipt is what proves whether it was responsible. On this repo's own demo surface
 * it proved it was not: 320px scrollWidth was 360 both before and after the doctype.
 *
 * TWO MODES, and the receipt says which one ran, because they do not prove the same thing.
 *   mode "rendered"  playwright resolved. Everything above is measured off a live document.
 *   mode "source"    no playwright anywhere (this repo ships zero dependencies, so that is
 *                    the normal case in CI). The three DECLARABLE facts — doctype, lang,
 *                    viewport content — are read from the file's own head and still gate the
 *                    exit code. compatMode and mobileLayoutViewport are recorded `null`,
 *                    never guessed, so a source receipt can never be read as rendered proof.
 * Source mode exists so the shell can be gated where no browser is installed. It is the CI
 * floor, not the proof: REVAMP.md still says verify it rendered. A file:// url is required —
 * a remote url with no browser is a hard error, not a downgrade.
 *
 * Exit 0 = every shell assertion held. Exit 1 = at least one failed (named on stderr).
 * --repo points at any checkout that has playwright installed; omit to walk up from cwd.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));

const DEMO = path.join(repoRoot, 'examples', 'trace-revamp', 'mockup.html');
const url = positional[0] || pathToFileURL(DEMO).href;
const evidence = (name) => path.join(repoRoot, 'promotion', 'evidence', name);
const outJson = flag('--out') || evidence('head-check.json');
const outPng = flag('--png-mobile') || evidence('mobile-375-emulated.png');
const outPngDesktop = flag('--png-desktop') || evidence('desktop-1440.png');
const WIDTHS = [320, 375, 768, 1024, 1440, 1920];

function resolvePlaywright(hint) {
  const roots = [];
  if (hint) roots.push(hint);
  let d = process.cwd();
  for (let i = 0; i < 6; i++) { roots.push(d); const up = path.dirname(d); if (up === d) break; d = up; }
  roots.push(repoRoot);
  for (const r of roots) {
    const pw = path.join(r, 'node_modules', 'playwright');
    if (fs.existsSync(pw)) return require(pw);
  }
  try { return require('playwright'); } catch {}
  return null;
}

const playwright = resolvePlaywright(flag('--repo') || process.env.PLAYWRIGHT_REPO);

const probeShell = () => ({
  doctype: document.doctype ? document.doctype.name : null,
  compatMode: document.compatMode,
  lang: document.documentElement.getAttribute('lang'),
  viewportMeta: document.querySelector('meta[name=viewport]')?.getAttribute('content') ?? null,
  mobileLayoutViewport: window.innerWidth,
});

// The same four facts are read off the file's own head when no browser exists. Only the
// three a document DECLARES are recoverable this way; the two a browser DERIVES stay null.
const shellFromSource = (file) => {
  const head = fs.readFileSync(file, 'utf8').slice(0, 4096);
  return {
    doctype: /<!doctype\s+html[\s>]/i.test(head) ? 'html' : null,
    compatMode: null,
    lang: head.match(/<html[^>]*\slang\s*=\s*["']([^"']*)["']/i)?.[1] || null,
    viewportMeta: head.match(/<meta[^>]+name\s*=\s*["']viewport["'][^>]*\scontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? null,
    mobileLayoutViewport: null,
  };
};

const consoleErrors = [];
const record = { url, capturedAt: new Date().toISOString(), mode: null, shell: null, overflow: {}, consoleErrors };

if (playwright) {
  record.mode = 'rendered';
  const browser = await playwright.chromium.launch();

  // 1. Shell, measured the way a phone measures it: mobile emulation at 375 CSS px.
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const mpage = await mobile.newPage();
  mpage.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  mpage.on('pageerror', (e) => consoleErrors.push(String(e)));
  await mpage.goto(url, { waitUntil: 'networkidle' });
  record.shell = await mpage.evaluate(probeShell);
  fs.mkdirSync(path.dirname(outPng), { recursive: true });
  await mpage.screenshot({ path: outPng, fullPage: false });
  await mobile.close();

  // 2. Horizontal overflow at every supported width.
  const desk = await browser.newContext();
  const dpage = await desk.newPage();
  dpage.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  dpage.on('pageerror', (e) => consoleErrors.push(String(e)));
  await dpage.goto(url, { waitUntil: 'networkidle' });
  for (const width of WIDTHS) {
    await dpage.setViewportSize({ width, height: 900 });
    await dpage.waitForTimeout(120);
    record.overflow[width] = await dpage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    // The widest common desktop width is also the one worth looking at: a shell fix
    // changes the box model document-wide, so the desktop composition has to be
    // re-seen, not assumed unchanged.
    if (width === 1440) await dpage.screenshot({ path: outPngDesktop, fullPage: false });
  }
  await browser.close();
} else if (url.startsWith('file:')) {
  record.mode = 'source';
  record.shell = shellFromSource(fileURLToPath(url));
} else {
  console.error(`FATAL: ${url} can only be measured in a browser and playwright was not found.`);
  console.error('Pass --repo <dir with node_modules/playwright>, or point at a local file.');
  process.exit(1);
}

const s = record.shell;
const failures = [];
// null on the two derived facts means "this mode did not measure it", never "it passed".
if (!s.doctype) failures.push('doctype absent — document renders in quirks mode');
if (s.compatMode !== null && s.compatMode !== 'CSS1Compat') failures.push(`compatMode ${s.compatMode} (want CSS1Compat)`);
if (!s.lang) failures.push('<html lang> absent — WCAG 3.1.1 Level A');
if (!s.viewportMeta || !/width\s*=\s*device-width/.test(s.viewportMeta)) {
  failures.push(`meta[name=viewport] ${s.viewportMeta === null ? 'absent' : JSON.stringify(s.viewportMeta)} — want width=device-width`);
}
if (s.mobileLayoutViewport !== null && s.mobileLayoutViewport !== 375) {
  failures.push(`mobile layout viewport ${s.mobileLayoutViewport}px at a 375px device — page is laid out wide and scaled down`);
}
if (consoleErrors.length) failures.push(`${consoleErrors.length} console error(s)`);

record.overflowWidths = Object.entries(record.overflow)
  .filter(([, m]) => m.scrollWidth > m.clientWidth)
  .map(([width]) => Number(width));
record.failures = failures;
record.passed = failures.length === 0;
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(record, null, 2) + '\n');

const na = (v, suffix = '') => (v === null ? 'not-measured(source mode)' : `${v}${suffix}`);
console.log(`mode:${record.mode} | doctype:${s.doctype} | compatMode:${na(s.compatMode)} | lang:${s.lang} | viewport:${s.viewportMeta} | mobileLayoutViewport:${na(s.mobileLayoutViewport, 'px')}`);
for (const [width, m] of Object.entries(record.overflow)) {
  console.log(`  ${width}px -> scrollWidth ${m.scrollWidth} / clientWidth ${m.clientWidth} ${m.scrollWidth > m.clientWidth ? 'OVERFLOW (reported, not asserted)' : 'ok'}`);
}
console.log(`WROTE ${outJson}`);
if (record.mode === 'rendered') {
  console.log(`WROTE ${outPng}`);
  console.log(`WROTE ${outPngDesktop}`);
}
if (failures.length) {
  console.error(`FAIL head-check (${failures.length})`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(record.mode === 'rendered'
  ? `PASS head-check rendered (doctype + lang + viewport declared, ${record.overflowWidths.length} width(s) overflowing — reported, see receipt)`
  : 'PASS head-check source (doctype + lang + viewport declared in the file; quirks mode and the mobile layout viewport were NOT measured — install playwright for the rendered proof)');
