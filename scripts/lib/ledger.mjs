/**
 * Reading the QA ledger — the one rule both readers have to agree on.
 *
 * The ledger is two append-only JSONL files that live in the app being tested,
 * one line per QA pass and one line per finding EVENT. Nothing is ever edited or
 * deleted: when a defect is fixed, a new line for the same fingerprint is
 * appended with status "fixed". So the state of a defect is simply its LAST line.
 *
 * Two programs read it: `qa-memory.mjs`, which shows a person what is open, and
 * `qa-gate.mjs`, which decides whether a deploy may proceed. They used to each
 * carry their own copy of this reader, and the copies disagreed about a line that
 * will not parse — the ordinary result of an append that was interrupted. The
 * gate dropped the bad line and printed PASSED; the viewer crashed with a stack
 * trace. Reading the file happens here now, and a line that cannot be read is
 * always returned, never dropped, so each caller can act on it deliberately:
 * the viewer names the line, the gate refuses to pass.
 */
import fs from 'node:fs';

/**
 * @returns {{records: object[], unreadable: {line: number, text: string}[]}}
 *   records — every line that parsed, in file order
 *   unreadable — every line that did not, with its 1-based line number
 */
export function readLedger(file) {
  const records = [];
  const unreadable = [];
  if (!fs.existsSync(file)) return { records, unreadable };
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((text, index) => {
    if (!text.trim()) return;
    try {
      records.push(JSON.parse(text));
    } catch {
      unreadable.push({ line: index + 1, text: text.slice(0, 120) });
    }
  });
  return { records, unreadable };
}

/**
 * The current state of every defect: last line wins for a given fingerprint.
 * @returns {{byFingerprint: Map<string, object>, unreadable: {line: number, text: string}[]}}
 */
export function latestByFingerprint(file) {
  const { records, unreadable } = readLedger(file);
  const byFingerprint = new Map();
  for (const record of records) if (record && record.fp) byFingerprint.set(record.fp, record);
  return { byFingerprint, unreadable };
}

/** One line per damaged record, for a caller that prints rather than blocks. */
export const describeUnreadable = (unreadable, file) =>
  unreadable.map((entry) => `WARNING: ${file} line ${entry.line} is not valid JSON and was skipped: ${entry.text}`);
