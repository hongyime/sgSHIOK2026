import { createReadStream, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, extra] = process.argv.slice(2);
if (extra || !/^[a-z0-9-]+$/.test(label ?? '')) throw Error('One scan label required');
const dir = resolve(root, 'qa/revamp-r1/coverage-register-20260909');
const out = mkdtempSync(resolve(dir, 'output-verification-'));
const result = { label, checks: [], ok: false };
const check = (name, condition, details) => { result.checks.push({ name, pass: Boolean(condition), details }); if (!condition) throw Error(name); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  const summaryBytes = readFileSync(resolve(dir, label, 'summary.json'));
  result.summarySha256 = sha(summaryBytes);
  const summary = JSON.parse(summaryBytes);
  check('completed measured scan', summary.complete && summary.sourcesStable);
  const compressedHash = createHash('sha256'); let compressedBytes = 0;
  for await (const bytes of createReadStream(resolve(dir, label, 'register.jsonl.gz'))) { compressedHash.update(bytes); compressedBytes += bytes.length; }
  check('compressed output hash and bytes', compressedHash.digest('hex') === summary.compressedOutput.sha256 && compressedBytes === summary.compressedOutput.bytes);
  const rawHash = createHash('sha256'); let rawBytes = 0;
  const stream = createReadStream(resolve(dir, label, 'register.jsonl.gz')).pipe(createGunzip());
  stream.on('data', bytes => { rawHash.update(bytes); rawBytes += bytes.length; });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  const postals = new Set(), states = {}; let count = 0;
  for await (const line of lines) {
    const row = JSON.parse(line);
    if (!/^\d{6}$/.test(row.postal) || postals.has(row.postal)) throw Error('Invalid or repeated postal');
    if (row.categories.length !== 2 || new Set(row.categories.map(c => c.category)).size !== 2) throw Error('Expected two inspected transit categories');
    postals.add(row.postal); states[String(row.state)] = (states[String(row.state)] ?? 0) + 1; count++;
  }
  check('raw output hash and bytes', rawHash.digest('hex') === summary.rawOutput.sha256 && rawBytes === summary.rawOutput.bytes);
  check('distinct row count reconciles', count === summary.rows && count === summary.selection.postals.length, { count });
  check('selected postals exactly present', summary.selection.postals.every(p => postals.has(p)));
  const ordered = value => JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  check('state counts reproduce from output', ordered(states) === ordered(summary.totals.state), states);
  result.arithmetic = Object.values(states).join(' + ') + ' = ' + count;
  if (summary.mode === 'full') {
    check('full universe completed', summary.coverageComplete && count === summary.expectedRecordCount);
    check('manifest state counts reconcile', ordered(states) === ordered(summary.expectedStates), summary.expectedStates);
  }
  const ledger = JSON.parse(readFileSync(resolve(dir, label, 'input-ledger.json')));
  check('every selected input hash verified', Object.values(ledger.files).every(f => f.verified && f.sha256 === f.expectedSha256));
  result.ok = true;
} catch (error) { result.error = error.message; process.exitCode = 1; }
writeFileSync(resolve(out, 'verification.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }));
