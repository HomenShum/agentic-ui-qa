#!/usr/bin/env node
/**
 * shell-regression-proof.mjs — does the gate actually go red?
 *
 * A check that passes before the fix guards nothing, and that is not a hypothetical here:
 * through iteration 1, `scripts/self-check.mjs` only ran `node --check` on head-check.mjs —
 * a syntax parse. Deleting the whole document shell out of the demo surface left both
 * `npm run doctor` and `npm run proof` green at 13/13, exit 0. head-check worked; nothing
 * ran it.
 *
 * So this script performs that exact deletion and demands the opposite outcome. It reverts
 * examples/trace-revamp/mockup.html to the charset-first fragment it was before iteration 1,
 * runs the repo's declared proof, restores the file, and runs the proof again.
 *
 *   PASS  = proof exits non-zero WITHOUT the shell and 0 WITH it.
 *   FAIL  = the gate is decorative; a regression would ship green.
 *
 * Usage:  node scripts/shell-regression-proof.mjs [--out <json>]
 * Writes promotion/evidence/shell-regression-proof.json. It EDITS your worktree (and puts it
 * back), so it refuses to start if mockup.html already has uncommitted changes.
 *
 * Exit 0 = the gate has teeth. 1 = it does not. 2 = could not run the experiment.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mockup = path.join(repoRoot, 'examples', 'trace-revamp', 'mockup.html');
const argv = process.argv.slice(2);
const outIndex = argv.indexOf('--out');
const outJson = outIndex === -1
  ? path.join(repoRoot, 'promotion', 'evidence', 'shell-regression-proof.json')
  : path.resolve(repoRoot, argv[outIndex + 1] ?? '');

// The literal iteration-1 diff, backwards. Capturing the charset line and keeping it is the
// point: the fragment being restored is the one REVAMP.md used to ask for, not a broken file.
const SHELL_RE = /<!doctype html>\r?\n<html lang="en">\r?\n(<meta charset="utf-8">\r?\n)<meta name="viewport" content="width=device-width, initial-scale=1">\r?\n/i;

const dirty = spawnSync('git', ['status', '--porcelain', '--', mockup], { cwd: repoRoot, encoding: 'utf8' });
if (dirty.status === 0 && dirty.stdout.trim()) {
  console.error('FATAL: examples/trace-revamp/mockup.html has uncommitted changes. Commit or stash them first — this script rewrites that file.');
  process.exit(2);
}

const original = fs.readFileSync(mockup, 'utf8');
if (!SHELL_RE.test(original)) {
  console.error('FATAL: mockup.html does not open with the four-line shell this proof removes.');
  console.error('The head changed shape — update SHELL_RE here so the experiment still reverts what iteration 1 added.');
  process.exit(2);
}

const runProof = () => {
  const r = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', 'self-check.mjs')], { cwd: repoRoot, encoding: 'utf8' });
  const lines = `${r.stdout}${r.stderr}`.split('\n').map((l) => l.trim()).filter(Boolean);
  return { command: 'node scripts/self-check.mjs', exitCode: r.status, output: lines.slice(-4) };
};

let withoutShell;
try {
  fs.writeFileSync(mockup, original.replace(SHELL_RE, '$1'), 'utf8');
  withoutShell = runProof();
} finally {
  fs.writeFileSync(mockup, original, 'utf8');
}
const withShell = runProof();

const passed = withoutShell.exitCode !== 0 && withShell.exitCode === 0;
const record = {
  schemaVersion: 'agentic-ui-qa.shell-regression-proof/v1',
  capturedAt: new Date().toISOString(),
  experiment: 'revert examples/trace-revamp/mockup.html to the pre-iteration-1 charset-first fragment, run the declared proof, restore',
  expectation: 'non-zero without the document shell, zero with it',
  withoutShell,
  withShell,
  passed,
};
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(record, null, 2)}\n`);

console.log(`without shell -> exit ${withoutShell.exitCode}  ${withoutShell.output.at(-1) ?? ''}`);
console.log(`with shell    -> exit ${withShell.exitCode}  ${withShell.output.at(-1) ?? ''}`);
console.log(`WROTE ${outJson}`);
if (!passed) {
  console.error('FAIL shell-regression-proof — the gate does not go red when the document shell is deleted.');
  process.exit(1);
}
console.log('PASS shell-regression-proof — deleting the document shell turns the declared proof red.');
