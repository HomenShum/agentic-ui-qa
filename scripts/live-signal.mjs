#!/usr/bin/env node
/**
 * live-signal.mjs — prove a deploy is ACTUALLY live with concrete raw-response
 * presence signals and/or rendered-DOM selector assertions (agentic-ui-qa §2.3, U9).
 *
 * Legacy presence usage (unchanged):
 *   node live-signal.mjs <url> <signal> [signal...]
 *
 * Rendered-DOM usage (Playwright must be installed in --repo or an ancestor):
 *   node live-signal.mjs <url> --repo <path> \
 *     --rendered-present '[data-testid="app-ready"]' \
 *     --rendered-absent '[data-testid="removed-control"]' \
 *     --stability-ms 5000
 *
 * Exit 0 = every requested assertion passed. Exit 1 = invalid input, navigation error,
 * or any failed assertion. A rendered absence assertion MUST include at least one
 * rendered presence assertion plus an explicit stability window, so a blank/crashed page
 * or a late-mounted removed control cannot pass vacuously.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const safeErrorMessage = (error) => String(error?.message || error)
  .split('\n')[0]
  .replace(/https?:\/\/[^\s'"<>]+/gi, '(redacted-url)');
const USAGE = `Usage:
  node live-signal.mjs <url> <signal> [signal...]
  node live-signal.mjs <url> [--repo <path>] [--wait-ms <ms>] [--timeout-ms <ms>]
    --rendered-present <selector> [--rendered-present <selector> ...]
    [--rendered-absent <selector> ... --stability-ms <ms>]`;

function failUsage(message) {
  if (message) console.error(`ERROR: ${message}`);
  console.error(USAGE);
  process.exit(1);
}

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }
  const [url, ...rest] = argv;
  if (!url) failUsage();

  const options = {
    url,
    rawPresent: [],
    renderedPresent: [],
    renderedAbsent: [],
    repo: undefined,
    waitMs: 500,
    timeoutMs: 45_000,
    stabilityMs: null,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) {
      options.rawPresent.push(arg);
      continue;
    }

    const value = rest[index + 1];
    if (value === undefined || value.startsWith('--')) failUsage(`${arg} requires a value`);
    index += 1;
    if (arg === '--repo') options.repo = value;
    else if (arg === '--wait-ms') {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 60_000) {
        failUsage('--wait-ms must be an integer from 0 to 60000');
      }
      options.waitMs = parsed;
    } else if (arg === '--timeout-ms') {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 60_000) {
        failUsage('--timeout-ms must be an integer from 1000 to 60000');
      }
      options.timeoutMs = parsed;
    } else if (arg === '--stability-ms') {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 60_000) {
        failUsage('--stability-ms must be an integer from 1000 to 60000');
      }
      options.stabilityMs = parsed;
    } else if (arg === '--rendered-present') options.renderedPresent.push(value);
    else if (arg === '--rendered-absent') options.renderedAbsent.push(value);
    else failUsage(`unknown option ${arg}`);
  }

  const hasRendered = options.renderedPresent.length > 0 || options.renderedAbsent.length > 0;
  if (options.rawPresent.length === 0 && !hasRendered) failUsage('provide at least one assertion');
  if (options.renderedAbsent.length > 0 && options.renderedPresent.length === 0) {
    failUsage('--rendered-absent requires --rendered-present as a positive readiness witness');
  }
  if (options.renderedAbsent.length > 0 && options.stabilityMs === null) {
    failUsage('--rendered-absent requires --stability-ms sized to the owning surface\'s known mount bound');
  }
  return options;
}

function safeUrlLabel(value) {
  try {
    const parsed = new URL(value);
    const hash = (part) => createHash('sha256').update(part).digest('hex').slice(0, 12);
    return `${parsed.protocol}//host-sha256-${hash(parsed.host)}/path-sha256-${hash(parsed.pathname)}`;
  } catch {
    return '(invalid-url)';
  }
}

function resolvePlaywright(repoHint) {
  const roots = [];
  if (repoHint) roots.push(path.resolve(repoHint));
  let dir = process.cwd();
  for (let index = 0; index < 7; index += 1) {
    roots.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const root of roots) {
    const candidate = path.join(root, 'node_modules', 'playwright');
    if (fs.existsSync(candidate)) return require(candidate);
  }
  try {
    return require('playwright');
  } catch {
    console.error('FATAL: Playwright not found. Set --repo to a repo with Playwright installed.');
    process.exit(1);
  }
}

async function checkRawPresence(options) {
  if (options.rawPresent.length === 0) return false;
  const response = await fetch(options.url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(options.timeoutMs),
  });
  const html = await response.text();
  // Keep the legacy output shape for callers that record the first line as evidence.
  console.log(`HTTP ${response.status} · ${html.length} bytes · ${safeUrlLabel(response.url || options.url)}`);
  let failed = !response.ok;
  let missingSignal = false;
  if (!response.ok) console.log('FAILED  raw navigation did not return a successful HTTP response');
  for (const signal of options.rawPresent) {
    const found = html.includes(signal);
    if (!found) {
      failed = true;
      missingSignal = true;
    }
    console.log(`${found ? 'FOUND  ' : 'MISSING'} ${JSON.stringify(signal)}`);
  }
  if (missingSignal) {
    console.log('NOTE: a raw-HTML miss does not prove absence after hydration; use rendered-DOM assertions (U9).');
  }
  return failed;
}

async function checkRendered(options) {
  const hasRendered = options.renderedPresent.length > 0 || options.renderedAbsent.length > 0;
  if (!hasRendered) return false;

  const { chromium } = resolvePlaywright(options.repo);
  const browser = await chromium.launch();
  let failed = false;
  try {
    const page = await browser.newPage();
    const response = await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs });
    const status = response?.status();
    console.log(`RENDERED HTTP ${status ?? 'unknown'} · ${safeUrlLabel(page.url() || options.url)}`);
    if (!response || !response.ok()) {
      console.log('FAILED  rendered navigation did not return a successful HTTP response');
      failed = true;
    }

    const countVisible = async (selector) => page.locator(selector).evaluateAll((elements) => elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (typeof element.checkVisibility === 'function') {
        try {
          if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
        } catch {}
      }
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        !element.closest('[hidden],[inert],[aria-hidden="true"]');
    }).length);

    for (const selector of options.renderedPresent) {
      try {
        await page.waitForFunction((candidate) => {
          try {
            return Array.from(document.querySelectorAll(candidate)).some((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              if (typeof element.checkVisibility === 'function') {
                try {
                  if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
                } catch {}
              }
              return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
                style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
                !element.closest('[hidden],[inert],[aria-hidden="true"]');
            });
          } catch {
            return false;
          }
        }, selector, { timeout: Math.min(15_000, options.timeoutMs) });
      } catch {
        // Count and report below; do not expose page text or other runtime data.
      }
    }
    await page.waitForTimeout(options.waitMs);

    for (const selector of options.renderedPresent) {
      const locator = page.locator(selector);
      const count = await locator.count();
      const visibleCount = await countVisible(selector);
      const passed = visibleCount > 0;
      if (!passed) failed = true;
      console.log(`${passed ? 'VISIBLE' : 'MISSING'} rendered selector ${JSON.stringify(selector)} · visible:${visibleCount} total:${count}`);
    }

    if (options.renderedAbsent.length > 0) {
      const maxAbsentCounts = new Map(options.renderedAbsent.map((selector) => [selector, 0]));
      let readinessLost = false;
      const startedAt = Date.now();
      let observedPresent = false;
      do {
        for (const selector of options.renderedPresent) {
          if (await countVisible(selector) === 0) readinessLost = true;
        }
        for (const selector of options.renderedAbsent) {
          const count = await page.locator(selector).count();
          maxAbsentCounts.set(selector, Math.max(maxAbsentCounts.get(selector), count));
          if (count > 0) observedPresent = true;
        }
        const remaining = options.stabilityMs - (Date.now() - startedAt);
        if (observedPresent || remaining <= 0) break;
        await page.waitForTimeout(Math.min(200, remaining));
      } while (true);

      if (readinessLost) {
        failed = true;
        console.log('FAILED  visible readiness witness disappeared during the absence stability window');
      }
      for (const selector of options.renderedAbsent) {
        const maxCount = maxAbsentCounts.get(selector);
        const passed = maxCount === 0;
        if (!passed) failed = true;
        console.log(`${passed ? 'STABLE_ABSENT' : 'PRESENT'} rendered selector ${JSON.stringify(selector)} · max-count:${maxCount} window-ms:${options.stabilityMs}`);
      }
    }
  } finally {
    await browser.close();
  }
  return failed;
}

const options = parseArgs(process.argv.slice(2));
let failed = false;
try {
  failed = (await checkRawPresence(options)) || failed;
  failed = (await checkRendered(options)) || failed;
} catch (error) {
  console.error(`FATAL: ${safeErrorMessage(error)}`);
  failed = true;
}
process.exit(failed ? 1 : 0);
