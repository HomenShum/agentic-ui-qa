#!/usr/bin/env node
/**
 * qa-memory.mjs — append-only QA memory for agentic-ui-qa (proofloop-style: remember
 * every failure; the corpus only grows). Dependency-free. Memory lives in the TARGET
 * app's repo (default `<app-repo>/.qa/memory/`), NOT in the skill clone — each app's
 * QA history stays with (and as private as) that app.
 *
 * Files (JSONL, append-only — never rewrite history):
 *   runs.jsonl      one line per QA pass: {ts, executor, journeys, bar, gates, evidenceDir}
 *   findings.jsonl  one line per finding EVENT: {ts, id, fp, sev, area, symptom, rootCause,
 *                   evidence, fix, status}  — status: open|fixed|regressed|wontfix.
 *                   Re-appending the same fp with a new status IS the state change.
 *
 * Commands (all take --dir <memory-dir>; default ./.qa/memory):
 *   init                                   create the dir + empty ledgers
 *   add-run     --json '<{...}>'           append a pass record
 *   add-finding --json '<{...}>'           append a finding event (fp auto-derived if absent)
 *   open                                   list findings whose LATEST status is open|regressed
 *   regressions                            list every finding ever marked fixed (P0/P1) —
 *                                          this is the mandatory re-verify sweep for the
 *                                          next pass; a failed re-verify => append status
 *                                          "regressed" (never delete the fixed event)
 *   history                                bar-score time series from runs.jsonl (drift view)
 *
 * Fingerprint (fp): sha256 of lowercase(area + "|" + symptom with digits/paths/ids
 * stripped), first 12 hex — stable across runs so the same defect dedupes even when
 * line numbers or deck ids differ.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
};
const DIR = path.resolve(flag('dir', path.join(process.cwd(), '.qa', 'memory')));
const RUNS = path.join(DIR, 'runs.jsonl');
const FINDINGS = path.join(DIR, 'findings.jsonl');

const readLines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const append = (f, obj) => fs.appendFileSync(f, JSON.stringify(obj) + '\n', 'utf8');
const fpOf = (area, symptom) =>
  crypto.createHash('sha256')
    .update((String(area) + '|' + String(symptom).replace(/[0-9]+|[A-Za-z]:\\\S+|\/\S+\.\w+|deck_\w+|ref_\w+/g, '#')).toLowerCase())
    .digest('hex').slice(0, 12);

// latest status per fingerprint
function latestByFp() {
  const m = new Map();
  for (const f of readLines(FINDINGS)) m.set(f.fp, f); // later lines overwrite = latest event wins
  return m;
}

switch (cmd) {
  case 'init': {
    fs.mkdirSync(DIR, { recursive: true });
    for (const f of [RUNS, FINDINGS]) if (!fs.existsSync(f)) fs.writeFileSync(f, '', 'utf8');
    console.log('OK init', DIR);
    break;
  }
  case 'add-run': {
    fs.mkdirSync(DIR, { recursive: true });
    const rec = JSON.parse(flag('json', '{}'));
    rec.ts = rec.ts || new Date().toISOString();
    append(RUNS, rec);
    console.log('OK run appended', rec.ts, '| total runs:', readLines(RUNS).length);
    break;
  }
  case 'add-finding': {
    fs.mkdirSync(DIR, { recursive: true });
    const rec = JSON.parse(flag('json', '{}'));
    if (!rec.area || !rec.symptom) { console.error('FATAL: finding needs at least {area, symptom}'); process.exit(1); }
    rec.ts = rec.ts || new Date().toISOString();
    rec.fp = rec.fp || fpOf(rec.area, rec.symptom);
    rec.status = rec.status || 'open';
    const prev = latestByFp().get(rec.fp);
    append(FINDINGS, rec);
    console.log(prev
      ? `OK appended (KNOWN fp ${rec.fp}; was "${prev.status}" @ ${prev.ts} -> now "${rec.status}")`
      : `OK appended (NEW fp ${rec.fp}, status "${rec.status}")`);
    break;
  }
  case 'open': {
    const rows = [...latestByFp().values()].filter((f) => f.status === 'open' || f.status === 'regressed');
    rows.sort((a, b) => String(a.sev).localeCompare(String(b.sev)));
    for (const f of rows) console.log(`${f.sev}\t${f.fp}\t${f.status}\t${f.area}\t${f.symptom}`);
    console.log(`# ${rows.length} open/regressed`);
    break;
  }
  case 'regressions': {
    // every fp EVER marked fixed at sev P0/P1 -> permanent re-verify list (corpus only grows)
    const everFixed = new Map();
    for (const f of readLines(FINDINGS)) if (f.status === 'fixed' && /^P[01]$/.test(String(f.sev))) everFixed.set(f.fp, f);
    for (const f of everFixed.values()) console.log(`${f.sev}\t${f.fp}\t${f.area}\t${f.symptom}\tREVERIFY(evidence was: ${f.evidence || 'n/a'})`);
    console.log(`# ${everFixed.size} regression checks (mandatory at pass start; on failure append status "regressed")`);
    break;
  }
  case 'history': {
    for (const r of readLines(RUNS)) {
      const bar = r.bar ? Object.entries(r.bar).map(([k, v]) => `${k}:${v}`).join(' ') : '(no bar)';
      console.log(`${r.ts}\t${r.executor || '?'}\t${bar}\t${r.evidenceDir || ''}`);
    }
    break;
  }
  default:
    console.error('Usage: qa-memory.mjs <init|add-run|add-finding|open|regressions|history> [--dir <memory-dir>] [--json <record>]');
    process.exit(1);
}
