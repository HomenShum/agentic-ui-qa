#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredDocs = [
  "SKILL.md",
  "PLATFORM.md",
  "GATING.md",
  "HANDOFF.md",
  "PROOF.md",
  "BAR-DEFAULTS.md",
];
// Discovered, not listed. A hand-written list is a second place to remember to edit,
// and it had already fallen behind: scripts/lib/ existed and was checked by nothing.
const list = (dir) => readdirSync(path.join(root, dir))
  .filter((name) => /\.(mjs|cjs)$/.test(name))
  .map((name) => `${dir}/${name}`);
const scripts = [...list("scripts"), ...list("scripts/lib")].sort();

const checks = [];
for (const relative of requiredDocs) {
  checks.push({ id: `document:${relative}`, passed: existsSync(path.join(root, relative)) });
}
for (const relative of scripts) {
  const absolute = path.join(root, relative);
  const result = spawnSync(process.execPath, ["--check", absolute], {
    cwd: root,
    encoding: "utf8",
  });
  checks.push({
    id: `syntax:${relative}`,
    passed: result.status === 0,
    detail: result.status === 0 ? null : (result.stderr || result.stdout).trim(),
  });
}

// The demo surface has to be a document, not a fragment (REVAMP.md step 4 and its
// "Non-negotiables at every tier" line). Listing head-check.mjs above only ran
// `node --check` on it — a syntax parse — so deleting the four-line shell out of
// mockup.html left `npm run doctor` and `npm run proof` green at 13/13, exit 0.
// Run the check; do not parse it. Artifacts go to the gitignored .nodekit/ so a
// doctor run never rewrites the committed evidence under promotion/evidence/.
const artifacts = path.join(root, ".nodekit");
const headCheck = spawnSync(
  process.execPath,
  [
    path.join(root, "scripts", "head-check.mjs"),
    "--out", path.join(artifacts, "head-check.json"),
    "--png-mobile", path.join(artifacts, "head-check-mobile-375.png"),
    "--png-desktop", path.join(artifacts, "head-check-desktop-1440.png"),
  ],
  { cwd: root, encoding: "utf8" },
);
checks.push({
  id: "shell:examples/trace-revamp/mockup.html",
  passed: headCheck.status === 0,
  detail: headCheck.status === 0 ? null : (headCheck.stderr || headCheck.stdout || "").trim(),
});

const receipt = {
  schemaVersion: "agentic-ui-qa.self-check/v1",
  createdAt: new Date().toISOString(),
  checks,
  limitations: [
    "This validates the QA protocol package itself, not any consumer application's rendered UI.",
    "Application certification still requires target-specific journeys and artifacts.",
    "The demo-surface shell check runs rendered when a Playwright checkout resolves and from the file's source otherwise; .nodekit/head-check.json records which mode ran.",
  ],
  passed: checks.every((check) => check.passed),
};

const outputIndex = process.argv.indexOf("--json-out");
if (outputIndex >= 0) {
  const output = process.argv[outputIndex + 1];
  if (!output) {
    console.error("--json-out requires a path");
    process.exit(2);
  }
  const absolute = path.resolve(root, output);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  console.log(`WROTE ${absolute}`);
}

console.log(`${receipt.passed ? "PASS" : "FAIL"} agentic-ui-qa self-check (${checks.filter((check) => check.passed).length}/${checks.length})`);
for (const check of checks.filter((entry) => !entry.passed)) {
  console.error(`  FAIL ${check.id}${check.detail ? `: ${check.detail}` : ""}`);
}
process.exitCode = receipt.passed ? 0 : 1;
