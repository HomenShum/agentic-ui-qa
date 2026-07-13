#!/usr/bin/env node
/**
 * pixels.cjs — headless pixel capture for agentic-ui-qa (universal).
 * Survives frozen in-app browser screenshots (trap U1).
 *
 * Usage:  node <this-skill>/scripts/pixels.cjs <config.json>
 *
 * config.json:
 * {
 *   "repo": "D:/VSCode Projects/parity-studio",   // ANY repo with playwright installed;
 *                                                  // omit to auto-walk up from cwd
 *   "url": "https://app.example.com/",
 *   "outDir": "C:/.../qa-20260713-0100",
 *   "viewport": { "width": 1512, "height": 812 },
 *   "assert": ["AppName"],                         // rendered-DOM substrings
 *   "shots": [
 *     { "name": "home-light", "scheme": "light", "fullPage": true },
 *     { "name": "home-dark", "clicks": ["text=Get started", "[aria-label=\"Switch to dark theme\"]"],
 *       "waitMs": 700, "viewport": { "width": 375, "height": 812 } }
 *   ]
 * }
 *
 * Per shot: WROTE <png> | charset | mojibake:<n> | consoleErrors:<n> | hOverflow | asserts
 * Exit 0 = all navigations + asserts ok; 1 = any failed.
 * NOTE on "scheme": emulates prefers-color-scheme at context creation (before goto).
 * App shells that theme via their own toggle (trap U11) need a click on that toggle instead —
 * and you must READ the PNG to confirm it is actually dark.
 * After running: READ each PNG. A green exit is not a design review.
 */
const fs = require('fs');
const path = require('path');

function resolvePlaywright(repoHint) {
  const roots = [];
  if (repoHint) roots.push(repoHint);
  // walk up from cwd
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

const cfgPath = process.argv[2];
if (!cfgPath) { console.error('Usage: node pixels.cjs <config.json>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const { chromium } = resolvePlaywright(cfg.repo);
const outDir = cfg.outDir || path.join(process.cwd(), 'qa-out');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  let failed = false;
  for (const shot of cfg.shots || [{ name: 'default', scheme: 'light', fullPage: true }]) {
    const vp = shot.viewport || cfg.viewport || { width: 1512, height: 812 };
    const ctx = await browser.newContext({
      viewport: vp,
      colorScheme: shot.scheme === 'dark' ? 'dark' : 'light',
      deviceScaleFactor: 2,
      reducedMotion: shot.reducedMotion ? 'reduce' : 'no-preference',
    });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push('PAGEERR ' + String(e.message).slice(0, 200)));
    try {
      await page.goto(shot.url || cfg.url, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) {
      console.error('NAVFAIL', shot.name, e.message.split('\n')[0]);
      failed = true; await ctx.close(); continue;
    }
    await page.waitForTimeout(shot.waitMs ?? 400);
    for (const sel of shot.clicks || []) {
      try { await page.click(sel, { timeout: 3000 }); await page.waitForTimeout(250); }
      catch (e) { console.log('  CLICKMISS', shot.name, sel, '-', e.message.split('\n')[0]); }
    }
    await page.waitForTimeout(250);
    const { moji, missing, overflow, charset } = await page.evaluate((asserts) => {
      const text = document.body.innerText;
      return {
        moji: (text.match(/Â·|â|Ã[-¿]/g) || []).length,
        missing: (asserts || []).filter((s) => !text.includes(s)),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        charset: document.characterSet,
      };
    }, shot.assert || cfg.assert || []);
    const file = path.join(outDir, shot.name + '.png');
    await page.screenshot({ path: file, fullPage: shot.fullPage !== false });
    const assertMsg = missing.length ? 'MISSING(' + missing.join('; ') + ')' : 'ok';
    if (missing.length) failed = true;
    console.log(`WROTE ${file} | charset:${charset} | mojibake:${moji} | consoleErrors:${consoleErrors.length} | hOverflow:${overflow} | asserts:${assertMsg}`);
    for (const c of consoleErrors.slice(0, 5)) console.log('  console.error:', c);
    await ctx.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
