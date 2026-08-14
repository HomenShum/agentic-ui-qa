#!/usr/bin/env node
/**
 * web-quality-audit.mjs — gate condition 8, made runnable.
 *
 * Condition 8 is "web-quality audit (accessibility, performance, Core Web Vitals):
 * no major unresolved finding". Until now this repo scored it UNVERIFIED because
 * the two authorities were not installed. They install from npm on demand; nothing
 * has to be vendored. So the condition was never blocked by the environment, only
 * by nobody having run it.
 *
 * Usage:  node scripts/web-quality-audit.mjs [--evidence] [--out-dir <dir>] [--port 4913] [--url <url>]
 *         node scripts/web-quality-audit.mjs             # receipts into gitignored .nodekit/
 *         node scripts/web-quality-audit.mjs --evidence  # overwrite the COMMITTED receipts
 *
 * A bare run must never dirty the worktree it is measuring — same rule head-check.mjs
 * follows — so writing into promotion/evidence/ is opt-in.
 *
 * What actually runs, both against a real Chrome over HTTP (not file://, because
 * Lighthouse cannot audit a file:// URL and axe's driver will not navigate one):
 *
 *   npx --yes lighthouse@13.4.1 <url> --output=json --output-path=<f> --chrome-flags="--headless"
 *   npx --yes @axe-core/cli@4.13.0 <url> --save <f>
 *
 * The exact command strings land in the receipt, so a reader can re-issue them by
 * hand without reading this file.
 *
 * THE EXIT CODE IS THE GATE, and it is deliberately narrow. "No major unresolved
 * finding" is scored as:
 *   - zero axe violations of impact `serious` or `critical`
 *   - Lighthouse accessibility >= 0.90
 *   - Lighthouse performance   >= 0.90
 * Anything else — `moderate`/`minor` axe items, best-practices, SEO — is recorded in
 * the receipt and printed, but does not fail the exit code, because those are not
 * major findings and a gate that blocks on them teaches people to bypass it.
 *
 * The two tools do NOT measure the same thing and neither one is a Web Interface
 * Guidelines review (condition 7). Lighthouse's accessibility category is itself
 * axe-core, run against a smaller rule subset in a throttled mobile emulation; the
 * axe CLI run is desktop, unthrottled, full ruleset. They disagree on purpose and
 * both numbers are kept.
 *
 * Exit 0 = no major finding. Exit 1 = at least one, named on stderr. Exit 2 = a tool
 * did not run at all (npm registry unreachable, no Chrome) — never a pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serveFile } from './lib/serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const EVIDENCE = argv.includes('--evidence');
const PORT = Number(flag('--port', '4913'));
const SURFACE = path.join(repoRoot, 'examples', 'trace-revamp', 'mockup.html');

// --out-dir exists so the same producer can be pointed at a pre-fix tree and its
// receipt kept beside the post-fix one. A check that was green before the fix was
// guarding nothing, and this repo has shipped that bug once already (D6).
const outDir = flag('--out-dir')
  ? path.resolve(repoRoot, flag('--out-dir'))
  : (EVIDENCE ? path.join(repoRoot, 'promotion', 'evidence') : path.join(repoRoot, '.nodekit'));
fs.mkdirSync(outDir, { recursive: true });

const LH_RAW = path.join(outDir, 'lighthouse.json');
const AXE_RAW = path.join(outDir, 'axe.json');
const RECEIPT = path.join(outDir, 'web-quality-audit.json');

const LIGHTHOUSE = 'lighthouse@13.4.1';
const AXE = '@axe-core/cli@4.13.0';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const q = (s) => (/[\s"]/.test(s) ? `"${s}"` : s);

/**
 * ASYNC on purpose, and this is not a style choice. The first version used
 * spawnSync, which blocks the event loop — including the HTTP server two lines
 * up that is serving the page being audited. Lighthouse requested the URL, Node
 * could not answer while it was blocked waiting for Lighthouse, and the run hung
 * until the 15-minute timeout. A measurement rig that deadlocks against its own
 * server produces no measurement at all.
 */
function run(command) {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, cwd: repoRoot });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const kill = setTimeout(() => child.kill(), 10 * 60_000);
    child.on('close', (status) => { clearTimeout(kill); resolve({ status, stdout, stderr }); });
  });
}

const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
};

const served = flag('--url') ? null : await serveFile(SURFACE, PORT);
const url = flag('--url', served.url);

const lhCmd = `${npx} --yes ${LIGHTHOUSE} ${q(url)} --output=json --output-path=${q(LH_RAW)} --chrome-flags="--headless" --quiet`;
// axe's --save joins its argument onto the cwd unconditionally, so an absolute
// Windows path becomes `C:\repo\C:\Users\...` and the write fails with ENOENT.
// It must be given a path relative to the cwd the process is spawned in.
const axeCmd = `${npx} --yes ${AXE} ${q(url)} --save ${q(path.relative(repoRoot, AXE_RAW).replace(/\\/g, '/'))}`;

console.log(`RUN  ${lhCmd}`);
const lh = await run(lhCmd);
console.log(`RUN  ${axeCmd}`);
const axe = await run(axeCmd);

served?.server.close();

const lhJson = readJson(LH_RAW);
const axeJson = readJson(AXE_RAW);

const hard = [];
if (!lhJson) hard.push(`lighthouse produced no JSON (exit ${lh.status}): ${lh.stderr.trim().split('\n').pop() || 'no stderr'}`);
if (!axeJson) hard.push(`axe produced no JSON (exit ${axe.status}): ${axe.stderr.trim().split('\n').pop() || 'no stderr'}`);
if (hard.length) {
  for (const h of hard) console.error(`FATAL ${h}`);
  process.exit(2);
}

const cat = (id) => lhJson.categories?.[id]?.score ?? null;
const audit = (id) => lhJson.audits?.[id]?.numericValue ?? null;

// The axe CLI writes an array, one entry per URL audited.
const axeRun = Array.isArray(axeJson) ? axeJson[0] : axeJson;
const violations = axeRun?.violations ?? [];
const incomplete = axeRun?.incomplete ?? [];

/**
 * Which committed producer resolves each axe `incomplete` rule, and how. An
 * incomplete axe cannot decide is only closed by a measurement that can.
 */
const RESOLVED_BY = {
  'color-contrast':
    'scripts/wig-review.mjs — Design/"Minimum contrast". axe cannot composite a '
    + 'gradient backdrop; wig-review resolves every gradient colour stop the browser '
    + 'reports and scores each text node against its WORST stop.',
};
const byImpact = violations.reduce((acc, v) => {
  acc[v.impact || 'unknown'] = (acc[v.impact || 'unknown'] || 0) + 1;
  return acc;
}, {});
const major = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

const receipt = {
  tool: 'web-quality-audit.mjs',
  ranAt: new Date().toISOString(),
  surface: path.relative(repoRoot, SURFACE).replace(/\\/g, '/'),
  url,
  commands: [lhCmd, axeCmd],
  exitCodes: { lighthouse: lh.status, axe: axe.status },
  lighthouse: {
    version: lhJson.lighthouseVersion,
    userAgent: lhJson.environment?.hostUserAgent,
    scores: {
      performance: cat('performance'),
      accessibility: cat('accessibility'),
      'best-practices': cat('best-practices'),
      seo: cat('seo'),
    },
    coreWebVitals: {
      lcpMs: audit('largest-contentful-paint'),
      cls: lhJson.audits?.['cumulative-layout-shift']?.numericValue ?? null,
      tbtMs: audit('total-blocking-time'),
      fcpMs: audit('first-contentful-paint'),
      siMs: audit('speed-index'),
    },
    failedAudits: Object.values(lhJson.audits || {})
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
      .map((a) => ({ id: a.id, title: a.title, score: a.score }))
      .sort((a, b) => a.score - b.score),
  },
  axe: {
    testEngine: axeRun?.testEngine?.version ?? null,
    counts: { violations: violations.length, passes: axeRun?.passes?.length ?? null, incomplete: axeRun?.incomplete?.length ?? null },
    byImpact,
    violations: violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes?.length ?? 0,
      targets: (v.nodes || []).slice(0, 5).map((n) => n.target?.join(' ')),
    })),
    // `incomplete` is axe saying "I could not decide", not "this is fine". It is
    // recorded here in full because condition 8 is "no major UNRESOLVED finding" —
    // an undecided serious item is unresolved until a human or another producer
    // resolves it, and `resolvedBy` names which one did.
    incomplete: incomplete.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes?.length ?? 0,
      reason: v.nodes?.[0]?.any?.[0]?.message ?? null,
      resolvedBy: RESOLVED_BY[v.id] ?? null,
    })),
  },
};

const failures = [];
for (const v of major) failures.push(`axe ${v.impact} — ${v.id}: ${v.help} (${v.nodes?.length ?? 0} nodes)`);
for (const v of incomplete) {
  if ((v.impact === 'serious' || v.impact === 'critical') && !RESOLVED_BY[v.id]) {
    failures.push(`axe ${v.impact} INCOMPLETE — ${v.id}: undecided on ${v.nodes?.length ?? 0} node(s), no producer resolves it`);
  }
}
if ((cat('accessibility') ?? 0) < 0.9) failures.push(`lighthouse accessibility ${cat('accessibility')} < 0.90`);
if ((cat('performance') ?? 0) < 0.9) failures.push(`lighthouse performance ${cat('performance')} < 0.90`);

receipt.majorFindings = failures;
receipt.passed = failures.length === 0;
fs.writeFileSync(RECEIPT, `${JSON.stringify(receipt, null, 2)}\n`);

const s = receipt.lighthouse.scores;
const v = receipt.lighthouse.coreWebVitals;
console.log(`\nLIGHTHOUSE ${lhJson.lighthouseVersion}  perf ${s.performance} · a11y ${s.accessibility} · best-practices ${s['best-practices']} · seo ${s.seo}`);
console.log(`CWV        LCP ${Math.round(v.lcpMs)}ms · CLS ${v.cls} · TBT ${Math.round(v.tbtMs)}ms · FCP ${Math.round(v.fcpMs)}ms`);
console.log(`AXE        ${violations.length} violations ${JSON.stringify(byImpact)} · ${receipt.axe.counts.passes} passes · ${receipt.axe.counts.incomplete} incomplete`);
console.log(`WROTE      ${path.relative(repoRoot, LH_RAW).replace(/\\/g, '/')}, ${path.relative(repoRoot, AXE_RAW).replace(/\\/g, '/')}, ${path.relative(repoRoot, RECEIPT).replace(/\\/g, '/')}`);

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`FAIL web-quality-audit — ${failures.length} major finding(s).`);
  process.exit(1);
}
console.log('PASS web-quality-audit — no major finding (0 serious/critical axe, a11y and perf >= 0.90).');
