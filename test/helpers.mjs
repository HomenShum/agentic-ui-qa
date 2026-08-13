// Shared plumbing for the behaviour tests: run a script the way an agent runs it
// (a real child process, a real exit code) and give each test its own throwaway
// workspace so tests can run in any order.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Run one of this repo's scripts and return { code, out } — out is stdout+stderr. */
export function run(script, args = [], options = {}) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', script), ...args], {
    encoding: 'utf8',
    timeout: 60_000,
    ...options,
  });
  return { code: result.status, out: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

/** A fresh empty directory that is deleted when the process exits. */
export function workspace(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `aqa-${name}-`));
  process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Write a findings ledger verbatim — including deliberately malformed lines. */
export function writeLedger(dir, lines) {
  const memory = path.join(dir, '.qa', 'memory');
  fs.mkdirSync(memory, { recursive: true });
  fs.writeFileSync(path.join(memory, 'findings.jsonl'), lines.join('\n') + '\n', 'utf8');
  return memory;
}

export function gateConfig(dir, memoryDir, extra = {}) {
  const file = path.join(dir, 'gate.json');
  fs.writeFileSync(file, JSON.stringify({
    app: 'test', memoryDir, outDir: path.join(dir, '.qa', 'gate'), prettify: false, ...extra,
  }), 'utf8');
  return file;
}
