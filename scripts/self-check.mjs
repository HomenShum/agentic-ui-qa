#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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
const scripts = [
  "scripts/clutter-audit.mjs",
  "scripts/live-signal.mjs",
  "scripts/prettify-audit.mjs",
  "scripts/qa-gate.mjs",
  "scripts/qa-memory.mjs",
  "scripts/self-check.mjs",
];

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

const receipt = {
  schemaVersion: "agentic-ui-qa.self-check/v1",
  createdAt: new Date().toISOString(),
  checks,
  limitations: [
    "This validates the QA protocol package itself, not any consumer application's rendered UI.",
    "Application certification still requires target-specific journeys and artifacts.",
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
