// The walkthrough has to match the commit it ships with.
//
// The person: someone who cloned this repository today and opened the CodeTour to
// find out how a QA pass runs. A tour step that lands on the wrong line — because
// somebody inserted a function above it — is worse than no tour at all: it teaches
// them something false and they have no way to know. So the tours are checked here
// rather than by whoever remembers to look.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

const toursDir = path.join(repoRoot, '.tours');
const tours = fs.readdirSync(toursDir).filter((name) => name.endsWith('.tour'));

test('there are tours to check', () => {
  assert.ok(tours.length >= 3, `expected at least 3 tours, found ${tours.length}`);
});

for (const name of tours) {
  test(`${name} points at real files and real lines`, () => {
    const tour = JSON.parse(fs.readFileSync(path.join(toursDir, name), 'utf8'));
    assert.ok(tour.title, 'a tour needs a title');
    assert.ok(Array.isArray(tour.steps) && tour.steps.length > 0, 'a tour needs steps');

    tour.steps.forEach((step, index) => {
      const where = `${name} step ${index + 1} (${step.file}:${step.line})`;
      const target = path.join(repoRoot, step.file);
      assert.ok(fs.existsSync(target), `${where} — file does not exist`);

      const lines = fs.readFileSync(target, 'utf8').split('\n');
      assert.ok(Number.isInteger(step.line) && step.line >= 1, `${where} — line must be a positive integer`);
      assert.ok(step.line <= lines.length, `${where} — file has only ${lines.length} lines`);
      // A step that lands on a blank line is the usual symptom of code shifting underneath it.
      assert.notEqual(lines[step.line - 1].trim(), '', `${where} — lands on a blank line`);
      assert.ok(step.description && step.description.length > 40, `${where} — needs a real explanation`);
    });
  });
}

// START_HERE.md quotes file and line references too, and they rot the same way.
test('START_HERE.md cites files that exist', () => {
  const doc = fs.readFileSync(path.join(repoRoot, 'docs', 'START_HERE.md'), 'utf8');
  const cited = new Set([...doc.matchAll(/`((?:scripts|test)\/[\w./-]+\.(?:mjs|cjs))`/g)].map((m) => m[1]));
  assert.ok(cited.size >= 6, `expected START_HERE to cite several source files, found ${cited.size}`);
  for (const file of cited) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `START_HERE.md cites ${file}, which does not exist`);
  }
});
