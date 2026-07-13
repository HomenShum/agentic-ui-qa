#!/usr/bin/env node
/**
 * qa-gate.mjs — run agentic-ui-qa as an UNATTENDED deploy gate.
 *
 * Lineage: proofloop-fork + NodeProof. The invariant this file enforces is the same
 * one both of those enforce: **DETERMINISTIC CHECKS DECIDE, THE LLM ONLY EXPLAINS.**
 * This wrapper is 100% deterministic — it never calls a model. It runs three things,
 * folds the memory ledger (the persisted verdict) in, and exits on a fixed contract:
 *
 *   1. live-signal.mjs   — is prod ACTUALLY live right now? (raw-HTML signal grep, trap U9)
 *   2. the memory sweep  — qa-memory.mjs `regressions` + a direct read of findings.jsonl:
 *                          any OPEN P0, or any fixed-then-REGRESSED P0/P1, blocks.
 *   3. prettify-audit.mjs — VISUAL RUBRIC V1..V9. ADVISORY ONLY — captured, never blocks
 *                          (matches PRETTIFY.md: prettify is additive to trust, not a gate).
 *   + Bar-drop check     — if the latest recorded run scored a Bar dim below the sanctioned
 *                          floor, that scored-dim drop blocks.
 *
 * WHAT BLOCKS A DEPLOY (exit 1): any open P0 · any regressed fixed-finding · a missing/failed
 *   live-signal · a Bar drop on a scored dim (B1..B11). See GATING.md for the rationale.
 * WHAT STAYS ADVISORY (never blocks): prettify V1..V9 · open P1/P2 findings · the sweep's
 *   re-verify reminder list. Advisory findings are reported so a human/agent can act, but
 *   they never flip the verdict — a stronger model earns wider action, never looser honesty.
 *
 * EXIT-CODE CONTRACT (fail-closed; never silently allows):
 *   0  PASSED       — every deterministic check green; nothing in a blocking state.
 *   1  BLOCKED      — >=1 deterministic block. Reasons are printed and written to gate-state.json.
 *   2  NO_GATE      — misconfigured / nothing to check (no config, invalid config, or an
 *                     unconfigured gate). An unconfigured gate is NEVER a pass.
 *   3  INTERNAL     — an unexpected error in the gate itself. Still safe: never allows.
 *
 * USAGE:
 *   node qa-gate.mjs <config.json>            RUN mode: run every check, write verdict, exit on it
 *   node qa-gate.mjs <config.json> --check    CHECK mode: read the last gate-state.json, DO NOT
 *                                             re-run (NodeProof `gate --check` analog; absent
 *                                             state file => exit 2, fail-closed)
 *   node qa-gate.mjs <config.json> --json     also print the full verdict record to stdout
 *
 * CONFIG (config.json — all paths absolute or resolved from cwd):
 * {
 *   "app": "NodeSlide / parity-studio",
 *   "repo": "D:/VSCode Projects/parity-studio",         // repo with playwright (for prettify)
 *   "memoryDir": "D:/VSCode Projects/parity-studio/.qa/memory",  // default <cwd>/.qa/memory
 *   "outDir": "D:/VSCode Projects/parity-studio/.qa/gate",       // gate-state.json target
 *   "live": {                                            // deterministic live-signal gate
 *     "url": "https://parity-studio.vercel.app/?domain=nodeslide",
 *     "signals": ["NodeSlide", "reviewable"]             // ALL must be present in raw HTML
 *   },
 *   "prettify": {                                        // ADVISORY. object = inline audit config,
 *     "url": "https://parity-studio.vercel.app/?domain=nodeslide",  //   string path = external
 *     "scheme": "light"                                  //   config file, false = skip.
 *   },
 *   "gate": {
 *     "blockOnOpenP0": true,        // default true
 *     "blockOnRegressed": true,     // default true
 *     "blockOnLiveSignal": true,    // default true (only when live.* configured)
 *     "blockOnBarDrop": true,       // default true
 *     "barFloor": { "B1": 2, "B2": 2, ... }  // sanctioned floor; omit => compare to prev run
 *   }
 * }
 *
 * DESIGN NOTES (why it is shaped like the proofloop/NodeProof gate):
 * - The MEMORY LEDGER is the persisted verdict (like NodeProof's gate-state.json): the last
 *   human/agent QA pass wrote runs.jsonl + findings.jsonl; this gate reads that state and adds
 *   two fresh deterministic re-checks (live-signal now, Bar-floor now). Unattended, that is a
 *   coherent question: "given the last recorded pass, is anything in a blocking state RIGHT NOW?"
 * - gate-state.json is schema-versioned and its keys are sorted (deterministic CAS) so a Stop
 *   hook / CI can read the verdict byte-stably without re-running (see GATING.md).
 * - Sub-scripts are spawned via process.execPath (node) + absolute path — no shell, no PATH
 *   dependence, Windows-safe. prettify-audit's exit code is IGNORED by design (advisory).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const EXIT = { PASS: 0, BLOCKED: 1, NO_GATE: 2, INTERNAL: 3 };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = 'agentic-ui-qa-gate-v1';

// ---- deterministic JSON (sorted keys) for a byte-stable verdict / CAS hash ----
function stableStringify(obj) {
  const seen = new WeakSet();
  const norm = (v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return null;
      seen.add(v);
      if (Array.isArray(v)) return v.map(norm);
      return Object.keys(v).sort().reduce((a, k) => { a[k] = norm(v[k]); return a; }, {});
    }
    return v;
  };
  return JSON.stringify(norm(obj), null, 2);
}

const readLines = (f) =>
  fs.existsSync(f)
    ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    : [];

// latest finding event per fingerprint (later line wins — same reducer as qa-memory.mjs)
function latestByFp(findingsFile) {
  const m = new Map();
  for (const f of readLines(findingsFile)) if (f && f.fp) m.set(f.fp, f);
  return m;
}

function runNode(script, args, opts = {}) {
  const started = Date.now();
  const res = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: opts.timeout ?? 120000 });
  return {
    command: `node ${path.basename(script)} ${args.join(' ')}`.trim(),
    exitCode: res.status === null ? (res.signal ? 128 : 3) : res.status,
    ms: Date.now() - started,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    spawnError: res.error ? String(res.error.message || res.error) : null,
  };
}

function fail(msg, code) {
  console.error(`qa-gate: ${msg}`);
  process.exit(code);
}

// ---------------------------------------------------------------- main
try {
  const argv = process.argv.slice(2);
  const checkMode = argv.includes('--check');
  const jsonOut = argv.includes('--json');
  const configPath = argv.find((a) => !a.startsWith('--'));

  if (!configPath) fail('usage: node qa-gate.mjs <config.json> [--check] [--json]', EXIT.NO_GATE);
  const cfgAbs = path.resolve(configPath);
  if (!fs.existsSync(cfgAbs)) fail(`config not found: ${cfgAbs}`, EXIT.NO_GATE);

  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(cfgAbs, 'utf8')); }
  catch (e) { fail(`config is not valid JSON (${e.message}) — fail-closed, exit 2`, EXIT.NO_GATE); }

  const memoryDir = path.resolve(cfg.memoryDir || path.join(process.cwd(), '.qa', 'memory'));
  const outDir = path.resolve(cfg.outDir || path.join(memoryDir, '..', 'gate'));
  const stateFile = path.join(outDir, 'gate-state.json');
  const RUNS = path.join(memoryDir, 'runs.jsonl');
  const FINDINGS = path.join(memoryDir, 'findings.jsonl');
  const g = cfg.gate || {};
  const opt = (k, d) => (g[k] === undefined ? d : g[k]);

  // ----- CHECK mode: read the persisted verdict, do not re-run (fail-closed if absent)
  if (checkMode) {
    if (!fs.existsSync(stateFile)) fail(`--check: no gate-state.json at ${stateFile} — fail-closed, exit 2`, EXIT.NO_GATE);
    const prev = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const code = prev.status === 'passed' ? EXIT.PASS : prev.status === 'failed' ? EXIT.BLOCKED : EXIT.NO_GATE;
    console.log(`qa-gate --check: ${String(prev.status).toUpperCase()} (verdict @ ${prev.ts}) -> exit ${code}`);
    if (jsonOut) console.log(stableStringify(prev));
    process.exit(code);
  }

  const blocks = [];      // { check, reason, evidence, sev }
  const advisories = [];  // { check, note }
  const checks = [];      // per-check receipts for gate-state.json

  // ---- G1 · live-signal (deterministic; fail-closed) --------------------------
  const live = cfg.live;
  const liveConfigured = !!(live && live.url && Array.isArray(live.signals) && live.signals.length);
  if (liveConfigured && opt('blockOnLiveSignal', true)) {
    const r = runNode(path.join(HERE, 'live-signal.mjs'), [live.url, ...live.signals]);
    const pass = r.exitCode === 0;
    checks.push({ name: 'live-signal', command: r.command, pass, ms: r.ms, exitCode: r.exitCode });
    const firstLine = (r.stdout.trim().split('\n')[0]) || r.stderr.trim().split('\n')[0] || '';
    if (!pass) {
      blocks.push({
        check: 'live-signal', sev: 'P0',
        reason: `prod live-signal FAILED (exit ${r.exitCode}) — cannot prove ${JSON.stringify(live.signals)} present at ${live.url}`,
        evidence: firstLine || r.spawnError || 'no output',
      });
    } else {
      advisories.push({ check: 'live-signal', note: `all ${live.signals.length} signals present — ${firstLine}` });
    }
  } else if (liveConfigured) {
    advisories.push({ check: 'live-signal', note: 'configured but blockOnLiveSignal=false (advisory only)' });
  }

  // ---- G2 · memory: open P0 + regressed fixed-findings (deterministic) --------
  const findings = latestByFp(FINDINGS);
  const openStates = new Set(['open', 'regressed']);
  const isP0 = (s) => String(s) === 'P0';
  const isP01 = (s) => /^P[01]$/.test(String(s));
  const seenBlockFp = new Set();

  if (opt('blockOnRegressed', true)) {
    for (const f of findings.values()) {
      if (f.status === 'regressed' && isP01(f.sev)) {
        seenBlockFp.add(f.fp);
        blocks.push({ check: 'memory-regression', sev: f.sev, reason: `REGRESSED ${f.sev} ${f.fp} · ${f.area}: ${f.symptom}`, evidence: f.evidence || 'n/a' });
      }
    }
  }
  if (opt('blockOnOpenP0', true)) {
    for (const f of findings.values()) {
      if (openStates.has(f.status) && isP0(f.sev) && !seenBlockFp.has(f.fp)) {
        seenBlockFp.add(f.fp);
        blocks.push({ check: 'memory-open-p0', sev: 'P0', reason: `OPEN P0 ${f.fp} · ${f.area}: ${f.symptom}`, evidence: f.evidence || 'n/a' });
      }
    }
  }
  // open P1/P2 -> advisory backlog (never blocks)
  for (const f of findings.values()) {
    if (openStates.has(f.status) && !seenBlockFp.has(f.fp) && !isP0(f.sev)) {
      advisories.push({ check: 'memory-open', note: `${f.sev} ${f.status} ${f.fp} · ${f.area}: ${f.symptom}` });
    }
  }

  // run the canonical regression sweep so it is literally executed + captured (advisory guidance)
  let sweepText = '';
  if (fs.existsSync(FINDINGS)) {
    const sweep = runNode(path.join(HERE, 'qa-memory.mjs'), ['regressions', '--dir', memoryDir]);
    sweepText = sweep.stdout.trim();
    if (sweepText) advisories.push({ check: 'regression-sweep', note: `mandatory re-verify list (see gate-state.json.sweep):\n${sweepText}` });
  }

  // ---- G3 · Bar drop on a scored dim (deterministic) --------------------------
  const runs = readLines(RUNS);
  const latestRun = runs.length ? runs[runs.length - 1] : null;
  const latestBar = latestRun && latestRun.bar ? latestRun.bar : null;
  let barFloor = g.barFloor || null;
  let floorSource = barFloor ? 'config.gate.barFloor' : null;
  if (!barFloor && runs.length >= 2) {
    const prevBar = runs[runs.length - 2].bar;
    if (prevBar) { barFloor = prevBar; floorSource = 'previous run (runs.jsonl)'; }
  }
  if (opt('blockOnBarDrop', true) && barFloor && latestBar) {
    for (const dim of Object.keys(barFloor)) {
      const floorV = Number(barFloor[dim]);
      const nowV = latestBar[dim] === undefined ? null : Number(latestBar[dim]);
      if (nowV !== null && !Number.isNaN(floorV) && !Number.isNaN(nowV) && nowV < floorV) {
        blocks.push({ check: 'bar-drop', sev: 'P1', reason: `${dim} dropped ${floorV} -> ${nowV} vs floor (${floorSource})`, evidence: `latest run ${latestRun.ts}` });
      }
    }
  }

  // ---- prettify-audit (ADVISORY ALWAYS — captured, exit code ignored) ---------
  let prettify = null;
  if (cfg.prettify !== false) {
    let prettifyArg = null;
    fs.mkdirSync(outDir, { recursive: true });
    if (typeof cfg.prettify === 'string') {
      prettifyArg = path.resolve(cfg.prettify);
    } else if (cfg.prettify && typeof cfg.prettify === 'object') {
      const pc = { repo: cfg.repo, outDir, ...cfg.prettify };
      if (!pc.url) pc.url = live && live.url;
      if (pc.url) { const pf = path.join(outDir, 'prettify-config.json'); fs.writeFileSync(pf, JSON.stringify(pc, null, 2)); prettifyArg = pf; }
    } else if (live && live.url) {
      const pc = { repo: cfg.repo, outDir, url: live.url };
      const pf = path.join(outDir, 'prettify-config.json'); fs.writeFileSync(pf, JSON.stringify(pc, null, 2)); prettifyArg = pf;
    }
    if (prettifyArg) {
      const r = runNode(path.join(HERE, 'prettify-audit.mjs'), [prettifyArg], { timeout: 180000 });
      const reportFile = path.join(outDir, 'prettify-audit.json');
      if (fs.existsSync(reportFile)) {
        try {
          const rep = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          prettify = { aggregate: rep.aggregate, targets: (rep.targets || []).map((t) => ({ id: t.id, name: t.name, score: t.score, why: t.why })) };
          advisories.push({ check: 'prettify-audit', note: `VISUAL RUBRIC ${rep.aggregate?.score}/${rep.aggregate?.max} (${rep.aggregate?.pct}%) — advisory, never blocks` });
        } catch { advisories.push({ check: 'prettify-audit', note: 'ran but report JSON unreadable — advisory, ignored' }); }
      } else {
        advisories.push({ check: 'prettify-audit', note: `unavailable (exit ${r.exitCode}${r.stderr ? ': ' + r.stderr.trim().split('\n')[0] : ''}) — advisory, ignored` });
      }
    } else {
      advisories.push({ check: 'prettify-audit', note: 'no url to audit — skipped (advisory)' });
    }
  }

  // ---- verdict ----------------------------------------------------------------
  // an EMPTY (freshly-init'd) ledger has files on disk but zero content — that is NOT a
  // configured gate. Require real content (a live check, a recorded run, or a finding).
  const gateConfigured = liveConfigured || findings.size > 0 || runs.length > 0;
  let status, code;
  if (!gateConfigured) {
    status = 'no_gate'; code = EXIT.NO_GATE; // unconfigured gate is NEVER a pass
  } else if (blocks.length) {
    status = 'failed'; code = EXIT.BLOCKED;
  } else {
    status = 'passed'; code = EXIT.PASS;
  }

  const record = {
    schema: SCHEMA,
    status,
    ts: new Date().toISOString(),
    app: cfg.app || null,
    executor: process.env.PROOFLOOP_AGENT_SOURCE || (process.env.CLAUDECODE ? 'claude-code' : process.env.CODEX_HOME || process.env.CODEX_SANDBOX ? 'codex' : (process.env.CI ? 'ci' : 'local')),
    blocks,
    advisories,
    checks,
    prettify,
    barFloorSource: floorSource,
    latestRun: latestRun ? { ts: latestRun.ts, bar: latestBar, executor: latestRun.executor || null } : null,
    sweep: sweepText || null,
    memoryDir,
  };
  record.inputsHash = crypto.createHash('sha256').update(stableStringify({ blocks, checks, barFloor, latestBar, live })).digest('hex').slice(0, 16);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(stateFile, stableStringify(record) + '\n', 'utf8');

  // ---- human summary ----------------------------------------------------------
  console.log(`\n=== agentic-ui-qa GATE · ${cfg.app || cfgAbs} · ${record.executor} ===`);
  for (const c of checks) console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name} (exit ${c.exitCode}, ${c.ms}ms)`);
  if (blocks.length) {
    console.log(`\nBLOCKING (${blocks.length}) — deterministic, decides the exit code:`);
    for (const b of blocks) console.log(`  ✗ [${b.sev} · ${b.check}] ${b.reason}\n      evidence: ${b.evidence}`);
  }
  if (advisories.length) {
    console.log(`\nADVISORY (${advisories.length}) — reported, never blocks:`);
    for (const a of advisories) console.log(`  · [${a.check}] ${a.note.split('\n')[0]}`);
  }
  console.log(`\nVERDICT: ${status.toUpperCase()}  ->  exit ${code}`);
  console.log(`gate-state.json: ${stateFile}`);
  if (status === 'no_gate') console.log('(no_gate is NOT a pass — configure live.signals or run a QA pass first)');
  if (jsonOut) console.log('\n' + stableStringify(record));

  process.exit(code);
} catch (e) {
  console.error('qa-gate INTERNAL ERROR (fail-closed, never allows):', e && e.stack ? e.stack : String(e));
  process.exit(EXIT.INTERNAL);
}
