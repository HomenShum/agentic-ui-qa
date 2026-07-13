#!/usr/bin/env node
/**
 * live-signal.mjs — prove a deploy is ACTUALLY live by grepping raw prod HTML for
 * concrete content signals (agentic-ui-qa §2.3, trap U9).
 *
 * Usage: node <this-skill>/scripts/live-signal.mjs <url> <signal> [signal...]
 * Exit 0 = every signal found in the RAW html. Exit 1 = any missing.
 *
 * IMPORTANT (U9): missing here does NOT prove absent — SPA content may hydrate later.
 * Missing → escalate to pixels.cjs with an `assert` on the rendered DOM before concluding.
 * Never claim "deployed/live/shipped" without either this exiting 0 for your signal or a
 * rendered-DOM assert passing.
 */
const [url, ...signals] = process.argv.slice(2);
if (!url || signals.length === 0) {
  console.error('Usage: node live-signal.mjs <url> <signal> [signal...]');
  process.exit(1);
}
const res = await fetch(url, { redirect: 'follow' });
const html = await res.text();
console.log(`HTTP ${res.status} · ${html.length} bytes · ${url}`);
let missing = 0;
for (const s of signals) {
  const found = html.includes(s);
  if (!found) missing++;
  console.log(`${found ? 'FOUND  ' : 'MISSING'} ${JSON.stringify(s)}`);
}
if (missing) console.log('NOTE: raw-HTML miss ≠ absent after hydration — verify with pixels.cjs assert before concluding (U9).');
process.exit(missing ? 1 : 0);
