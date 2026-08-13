// The QA ledger, exercised the way the person who owns it uses it.
//
// The person: an engineer running a QA pass on their own app. They record what
// they found, they fix it, and weeks later someone else re-runs the pass and has
// to be told about the old defect again. Two programs read that same file --
// `qa-memory.mjs` (the human view) and `qa-gate.mjs` (the deploy gate) -- so
// these tests pin the ONE reduction rule both must agree on: for a given defect
// fingerprint, the last line written wins.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { run, workspace, writeLedger, gateConfig } from './helpers.mjs';

const finding = (over) => JSON.stringify({
  ts: '2026-01-01T00:00:00Z', sev: 'P0', area: 'consent', symptom: 'egress with no opt-in',
  status: 'open', ...over,
});

test('the same defect found twice gets one fingerprint, even with different line numbers', () => {
  const dir = workspace('fp');
  const add = (symptom) => run('qa-memory.mjs', [
    'add-finding', '--dir', path.join(dir, '.qa', 'memory'),
    '--json', JSON.stringify({ sev: 'P1', area: 'trace', symptom }),
  ]);
  const first = add('fake success at mockup.html:412');
  const second = add('fake success at mockup.html:987');
  assert.equal(first.code, 0);
  assert.equal(second.code, 0);
  // Second time round the tool must recognise it, not open a duplicate ticket.
  assert.match(second.out, /KNOWN fp/);
});

test('a finding needs at least an area and a symptom', () => {
  const dir = workspace('fp-required');
  const { code, out } = run('qa-memory.mjs', [
    'add-finding', '--dir', path.join(dir, '.qa', 'memory'), '--json', '{"area":"trace"}',
  ]);
  assert.equal(code, 1);
  assert.match(out, /needs at least/);
});

test('fixing a defect closes it; a later regression re-opens it', () => {
  const dir = workspace('lifecycle');
  const memory = writeLedger(dir, [
    finding({ fp: 'aaaaaaaaaaaa', status: 'open' }),
    finding({ fp: 'aaaaaaaaaaaa', status: 'fixed', ts: '2026-01-02T00:00:00Z' }),
    finding({ fp: 'bbbbbbbbbbbb', area: 'provenance', symptom: 'fabricated model id', status: 'open' }),
  ]);
  const open = run('qa-memory.mjs', ['open', '--dir', memory]);
  assert.equal(open.code, 0);
  assert.doesNotMatch(open.out, /aaaaaaaaaaaa/, 'a fixed defect must not still read as open');
  assert.match(open.out, /bbbbbbbbbbbb/);

  // Every P0/P1 ever fixed stays on the permanent re-verify list. The corpus only grows.
  const sweep = run('qa-memory.mjs', ['regressions', '--dir', memory]);
  assert.match(sweep.out, /aaaaaaaaaaaa/);
  assert.match(sweep.out, /1 regression checks/);
});

test('an unknown command explains itself instead of doing something surprising', () => {
  const { code, out } = run('qa-memory.mjs', ['frobnicate']);
  assert.equal(code, 1);
  assert.match(out, /Usage/);
});

// ---------------------------------------------------------------- the gate

test('no config at all is not a pass', () => {
  assert.equal(run('qa-gate.mjs', []).code, 2);
  assert.equal(run('qa-gate.mjs', ['/definitely/not/here.json']).code, 2);
});

test('a config that is not valid JSON is not a pass', () => {
  const dir = workspace('badjson');
  const file = path.join(dir, 'gate.json');
  fs.writeFileSync(file, '{ this is not json');
  assert.equal(run('qa-gate.mjs', [file]).code, 2);
});

test('an empty ledger with nothing configured is not a pass', () => {
  const dir = workspace('empty');
  const memory = writeLedger(dir, []);
  const { code, out } = run('qa-gate.mjs', [gateConfig(dir, memory)]);
  assert.equal(code, 2, 'an unconfigured gate must never read as green');
  assert.match(out, /NO_GATE|no_gate/i);
});

test('an open P0 blocks the deploy', () => {
  const dir = workspace('p0');
  const memory = writeLedger(dir, [finding({ fp: 'aaaaaaaaaaaa', status: 'open' })]);
  const { code, out } = run('qa-gate.mjs', [gateConfig(dir, memory)]);
  assert.equal(code, 1);
  assert.match(out, /OPEN P0/);
});

test('an open P1 is reported but does not block', () => {
  const dir = workspace('p1');
  const memory = writeLedger(dir, [finding({ fp: 'cccccccccccc', sev: 'P1', status: 'open' })]);
  const { code, out } = run('qa-gate.mjs', [gateConfig(dir, memory)]);
  assert.equal(code, 0);
  assert.match(out, /ADVISORY/);
});

test('a defect that was fixed and came back blocks even at P1', () => {
  const dir = workspace('regressed');
  const memory = writeLedger(dir, [
    finding({ fp: 'dddddddddddd', sev: 'P1', status: 'fixed' }),
    finding({ fp: 'dddddddddddd', sev: 'P1', status: 'regressed', ts: '2026-02-01T00:00:00Z' }),
  ]);
  const { code, out } = run('qa-gate.mjs', [gateConfig(dir, memory)]);
  assert.equal(code, 1);
  assert.match(out, /REGRESSED/);
});

test('--check reads the last verdict and refuses when there is none', () => {
  const dir = workspace('check');
  const memory = writeLedger(dir, [finding({ fp: 'eeeeeeeeeeee', sev: 'P1', status: 'open' })]);
  const config = gateConfig(dir, memory);
  assert.equal(run('qa-gate.mjs', [config, '--check']).code, 2, 'no stored verdict must fail closed');
  assert.equal(run('qa-gate.mjs', [config]).code, 0);
  const after = run('qa-gate.mjs', [config, '--check']);
  assert.equal(after.code, 0);
  assert.match(after.out, /PASSED/);
});

// The reason both programs must share one reader. A JSONL ledger is appended to by
// whatever agent ran last; a half-written final line is its ordinary failure mode.
test('a half-written ledger line is reported, never silently skipped', () => {
  const dir = workspace('corrupt');
  const memory = writeLedger(dir, [
    finding({ fp: 'aaaaaaaaaaaa', status: 'fixed' }),
    '{"ts":"2026-01-03T00:00:00Z","fp":"ffffffffffff","sev":"P0","area":"provenance","stat',
  ]);
  const gate = run('qa-gate.mjs', [gateConfig(dir, memory)]);
  assert.notEqual(gate.code, 0, 'a gate that cannot read its own ledger must not report PASSED');
  assert.match(gate.out, /unreadable|corrupt|parse/i);

  const view = run('qa-memory.mjs', ['open', '--dir', memory]);
  assert.doesNotMatch(view.out, /at async|Node\.js v/, 'must name the bad line, not dump a stack trace');
  assert.match(view.out, /line 2/i);
});
