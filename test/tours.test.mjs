// The walkthrough has to match the commit it ships with.
//
// The person: someone who cloned this repository today and opened the CodeTour to
// find out how a QA pass runs. A tour step that lands on the wrong line — because
// somebody inserted a function above it — is worse than no tour at all: it teaches
// them something false and they have no way to know. So the tours are checked here
// rather than by whoever remembers to look.
//
// What this file learned the hard way: checking that the cited LINE NUMBER is in
// range proves anchor *stability*, not anchor *correctness*, and a walkthrough's
// whole value is correctness. That check passes while a step points at the wrong
// symbol. So every citation — a `.tour` step and every `(line N)` in START_HERE.md —
// carries the text it expects to find there, and the assertion is that the cited
// line CONTAINS it. When the anchor moves the guard fails and names the step; when
// the anchor is simply wrong it fails on the first run.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

const toursDir = path.join(repoRoot, '.tours');
const tours = fs.readdirSync(toursDir).filter((name) => name.endsWith('.tour'));
// Split on /\r?\n/: a checkout with autocrlf leaves CRLF in the worktree, and a trailing
// \r breaks both the citation regexes and the line comparison below.
const linesOf = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8').split(/\r?\n/);

test('there are tours to check', () => {
  assert.ok(tours.length >= 3, `expected at least 3 tours, found ${tours.length}`);
});

for (const name of tours) {
  test(`${name} points at real files and the lines it names`, () => {
    const tour = JSON.parse(fs.readFileSync(path.join(toursDir, name), 'utf8'));
    assert.ok(tour.title, 'a tour needs a title');
    assert.ok(Array.isArray(tour.steps) && tour.steps.length > 0, 'a tour needs steps');

    tour.steps.forEach((step, index) => {
      const where = `${name} step ${index + 1} (${step.file}:${step.line})`;
      assert.ok(fs.existsSync(path.join(repoRoot, step.file)), `${where} — file does not exist`);

      const lines = linesOf(step.file);
      assert.ok(Number.isInteger(step.line) && step.line >= 1, `${where} — line must be a positive integer`);
      assert.ok(step.line <= lines.length, `${where} — file has only ${lines.length} lines`);

      // The anchor-correctness assertion. Without it, a step that drifted onto an
      // unrelated line still passes as long as that line is non-blank.
      assert.ok(step.symbol, `${where} — needs "symbol": the text the cited line must contain`);
      assert.ok(
        lines[step.line - 1].includes(step.symbol),
        `${where} — expected to contain ${JSON.stringify(step.symbol)}, found ${JSON.stringify(lines[step.line - 1].trim())}`,
      );
      assert.ok(step.description && step.description.length > 40, `${where} — needs a real explanation`);
    });
  });
}

// START_HERE.md is the same walkthrough in prose, and its citations rot the same way.
// Its format is fixed so it can be checked: a "**File:**" line naming files in backticks,
// then a "**Symbol:**" line where every "(line N)" is preceded by the backticked text
// that line contains.
test('START_HERE.md cites lines that contain the text it quotes', () => {
  const doc = fs.readFileSync(path.join(repoRoot, 'docs', 'START_HERE.md'), 'utf8').split(/\r?\n/);
  let files = [];
  let checked = 0;

  doc.forEach((text, index) => {
    const at = `START_HERE.md:${index + 1}`;

    const fileLine = text.match(/^\*\*File:\*\* (.+)$/);
    if (fileLine) {
      files = [...fileLine[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      assert.ok(files.length > 0, `${at} — a **File:** line must name its file(s) in backticks`);
      for (const file of files) {
        assert.ok(fs.existsSync(path.join(repoRoot, file)), `${at} cites ${file}, which does not exist`);
      }
      return;
    }
    if (!text.startsWith('**Symbol:**')) return;
    assert.ok(files.length > 0, `${at} — a **Symbol:** line with no **File:** above it`);

    // Every line reference must be preceded by backticked text, with no other backtick
    // between them — so the quote belongs to that reference and not to a neighbour.
    const refs = [...text.matchAll(/\(line (\d+)\)/g)];
    const quoted = [...text.matchAll(/`([^`]+)`[^`]*?\(line (\d+)\)/g)];
    assert.equal(
      quoted.length, refs.length,
      `${at} — every "(line N)" must be preceded by the backticked text that line contains: ${text}`,
    );

    if (refs.length === 0) {
      // An unnumbered citation still has to resolve: the quote must appear in a cited file.
      const quote = text.match(/`([^`]+)`/)?.[1];
      assert.ok(quote, `${at} — a **Symbol:** line must quote something in backticks`);
      assert.ok(
        files.some((file) => linesOf(file).some((line) => line.includes(quote))),
        `${at} — ${JSON.stringify(quote)} appears in none of ${files.join(', ')}`,
      );
      checked += 1;
      return;
    }

    for (const [, symbol, lineNumber] of quoted) {
      const line = Number(lineNumber);
      const hit = files.find((file) => (linesOf(file)[line - 1] ?? '').includes(symbol));
      assert.ok(
        hit,
        `${at} — line ${line} of ${files.join(' / ')} does not contain ${JSON.stringify(symbol)}; ` +
        `found ${JSON.stringify((linesOf(files[0])[line - 1] ?? '<past end of file>').trim())}`,
      );
      checked += 1;
    }
  });

  // A guard that passes on a document with the citations deleted is not a guard.
  assert.ok(checked >= 12, `expected START_HERE to carry its checkable citations, verified only ${checked}`);
});
