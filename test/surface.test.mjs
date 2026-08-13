// The checks that look at an actual page, exercised without a browser installed.
//
// The person: an engineer wiring these checks into CI on a machine that has Node
// and nothing else. Two things must hold for them. A check that cannot see a real
// browser must still catch the mistakes a file DECLARES (no doctype, no lang, no
// viewport tag) -- and it must never let a receipt from that weaker mode be read
// as browser-rendered proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { run, workspace, repoRoot } from './helpers.mjs';

const SHELL = [
  '<!doctype html>',
  '<html lang="en">',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>t</title><p>hello</p>',
].join('\n');

// Force source mode regardless of what is installed on the machine running the tests,
// so this file asserts one behaviour instead of two.
const sourceMode = { env: { ...process.env, PLAYWRIGHT_REPO: path.join(repoRoot, 'test', 'no-playwright-here') } };

function headCheck(dir, html) {
  const page = path.join(dir, 'page.html');
  fs.writeFileSync(page, html, 'utf8');
  return run('head-check.mjs', [
    pathToFileURL(page).href, '--out', path.join(dir, 'head-check.json'),
  ], sourceMode);
}

test('a complete document shell passes', () => {
  const dir = workspace('shell-ok');
  const { code, out } = headCheck(dir, SHELL);
  assert.equal(code, 0, out);
  assert.match(out, /PASS head-check source/);
});

test('a source-mode receipt can never be mistaken for rendered proof', () => {
  const dir = workspace('shell-mode');
  headCheck(dir, SHELL);
  const receipt = JSON.parse(fs.readFileSync(path.join(dir, 'head-check.json'), 'utf8'));
  assert.equal(receipt.mode, 'source');
  // The two facts only a browser can derive stay null. Null means "not measured", never "passed".
  assert.equal(receipt.shell.compatMode, null);
  assert.equal(receipt.shell.mobileLayoutViewport, null);
});

test('a fragment with no doctype fails, and says why', () => {
  const dir = workspace('shell-fragment');
  const { code, out } = headCheck(dir, '<meta charset="utf-8"><p>hello</p>');
  assert.equal(code, 1);
  assert.match(out, /quirks mode/);
});

test('a page with no lang fails on the accessibility rule that requires it', () => {
  const dir = workspace('shell-lang');
  const { code, out } = headCheck(dir, SHELL.replace(' lang="en"', ''));
  assert.equal(code, 1);
  assert.match(out, /WCAG 3\.1\.1/);
});

test('a page that would be laid out wide and scaled down on a phone fails', () => {
  const dir = workspace('shell-viewport');
  const { code, out } = headCheck(dir, SHELL.replace(/<meta name="viewport"[^>]*>/, ''));
  assert.equal(code, 1);
  assert.match(out, /width=device-width/);
});

test('a remote page with no browser is an error, never a downgrade to source mode', () => {
  const { code, out } = run('head-check.mjs', ['https://example.com/'], sourceMode);
  assert.equal(code, 1);
  assert.match(out, /can only be measured in a browser/);
});

test("this repo's own demo surface passes its own shell check", () => {
  const dir = workspace('shell-demo');
  const { code, out } = run('head-check.mjs', [
    pathToFileURL(path.join(repoRoot, 'examples', 'trace-revamp', 'mockup.html')).href,
    '--out', path.join(dir, 'head-check.json'),
  ], sourceMode);
  assert.equal(code, 0, out);
});

// ---------------------------------------------------------------- live-signal
//
// The trap this guards: "the control is gone" is the easiest claim in QA to fake.
// A blank page, or a page that crashed before mounting anything, makes every
// absence assertion true. So absence is only accepted alongside a positive witness
// that the page is up, held for a named window of time.

test('asking for nothing is a usage error, not a pass', () => {
  const { code, out } = run('live-signal.mjs', ['https://example.com/']);
  assert.equal(code, 1);
  assert.match(out, /at least one assertion/);
});

test('proving something is absent requires proving the page is alive', () => {
  const { code, out } = run('live-signal.mjs', [
    'https://example.com/', '--rendered-absent', '[data-testid="gone"]',
  ]);
  assert.equal(code, 1);
  assert.match(out, /requires --rendered-present/);
});

test('proving something is absent requires a stability window', () => {
  const { code, out } = run('live-signal.mjs', [
    'https://example.com/',
    '--rendered-present', '[data-testid="ready"]',
    '--rendered-absent', '[data-testid="gone"]',
  ]);
  assert.equal(code, 1);
  assert.match(out, /requires --stability-ms/);
});

test('out-of-range timings are rejected rather than quietly clamped', () => {
  for (const args of [['--wait-ms', '99999'], ['--timeout-ms', '10'], ['--stability-ms', '0']]) {
    const { code } = run('live-signal.mjs', ['https://example.com/', 'signal', ...args]);
    assert.equal(code, 1, `${args.join(' ')} should be rejected`);
  }
});

// ---------------------------------------------------------------- the repo's own proof

test('the declared proof passes on a clean checkout and writes a receipt', () => {
  const dir = workspace('doctor');
  const receipt = path.join(dir, 'self-check.json');
  const { code, out } = run('self-check.mjs', ['--json-out', receipt]);
  assert.equal(code, 0, out);
  const parsed = JSON.parse(fs.readFileSync(receipt, 'utf8'));
  assert.equal(parsed.passed, true);
  assert.ok(parsed.checks.length > 0);
  // The receipt has to say what it did NOT prove, or a green tick reads wider than it is.
  assert.ok(parsed.limitations.length > 0);
});

test('--json-out with no path is refused instead of writing somewhere surprising', () => {
  assert.equal(run('self-check.mjs', ['--json-out']).code, 2);
});
