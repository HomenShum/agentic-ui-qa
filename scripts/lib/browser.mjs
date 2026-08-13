/**
 * Finding a browser, and reporting its errors without leaking the URL under test.
 *
 * Five checks in this repo drive a real browser, and this repo deliberately ships
 * zero dependencies — so none of them can just `import "playwright"`. Each one
 * borrows a Playwright that is already installed in some other checkout on the
 * same machine. That search used to be written out five times and had already
 * drifted: two copies walked six directories up from the working directory and
 * three walked seven, so a checkout six levels up was found by some checks and
 * not others. It is written here once.
 *
 * Search order, first hit wins:
 *   1. the caller's hint  (--repo, or a config's "repo" field, or $PLAYWRIGHT_REPO)
 *   2. the working directory, then each parent, up to seven levels
 *   3. this skill's own clone
 *   4. plain module resolution, in case Playwright really is a dependency here
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const NOT_FOUND = 'FATAL: Playwright not found. Point --repo (or the config\'s "repo" field) at any checkout that has node_modules/playwright installed.';

/**
 * @param {string|undefined} hint  a directory that may contain node_modules/playwright
 * @param {{required?: boolean}} options
 *   required (default true) — exit 1 when nothing is found. Pass false to get null
 *   instead, for a check that has a weaker no-browser mode to fall back to.
 * @returns the playwright module, or null when required is false and none exists
 */
export function resolvePlaywright(hint, { required = true } = {}) {
  const roots = [];
  if (hint) roots.push(path.resolve(hint));
  let dir = process.cwd();
  for (let i = 0; i < 7; i += 1) {
    roots.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  roots.push(skillRoot);

  for (const root of roots) {
    const candidate = path.join(root, 'node_modules', 'playwright');
    if (fs.existsSync(candidate)) return require(candidate);
  }
  try {
    return require('playwright');
  } catch {}

  if (!required) return null;
  console.error(NOT_FOUND);
  process.exit(1);
}

/**
 * The first line of an error, with any URL removed.
 *
 * QA reports get committed and shared. A Playwright timeout quotes the URL it was
 * driving, which for these checks is often a signed preview link or an internal
 * host, so the message is trimmed to its first line and stripped of URLs before
 * anything prints it.
 */
export const safeErrorMessage = (error) => String(error?.message || error)
  .split('\n')[0]
  .replace(/https?:\/\/[^\s'"<>]+/gi, '(redacted-url)');
