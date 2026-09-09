import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const dir = resolve(root, 'qa/revamp-r1/coverage-register-20260909');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const summaryBytes = readFileSync(resolve(dir, 'pilot-1/summary.json'));
const summary = JSON.parse(summaryBytes), ledger = JSON.parse(readFileSync(resolve(dir, 'pilot-1/input-ledger.json')));
const zipped = readFileSync(resolve(dir, 'pilot-1/register.jsonl.gz'));
if (sha(zipped) !== summary.compressedOutput.sha256) throw Error('STOP_OUTPUT_MISMATCH');
const raw = gunzipSync(zipped, { maxOutputLength: 4 * 1024 ** 2 });
if (sha(raw) !== summary.rawOutput.sha256) throw Error('STOP_OUTPUT_MISMATCH');
const rows = raw.toString('utf8').trimEnd().split('\n').map(line => JSON.parse(line));
const byState = {};
for (const row of rows) {
  const state = byState[row.state] ??= { records: 0, completeLocked: 0, geometryPresent: 0, busRetainable: 0, railRetainable: 0, eitherRetainable: 0, neitherRetainable: 0 };
  const bus = row.categories.find(c => c.category === 'bus').retainable > 0;
  const rail = row.categories.find(c => c.category === 'mrt_lrt').retainable > 0;
  state.records++; state.completeLocked += Number(row.completeLockedFields);
  state.geometryPresent += Number(row.geometryLookup === 'record_present');
  state.busRetainable += Number(bus); state.railRetainable += Number(rail);
  state.eitherRetainable += Number(bus || rail); state.neitherRetainable += Number(!bus && !rail);
}
const componentValues = Object.values(summary.projection.components);
const report = {
  summarySha256: sha(summaryBytes), scope: '200 size-stratified declared postals, not a representative population sample', byState,
  pilotSeconds: summary.elapsedMs / 1000, fixedSeconds: summary.fixedMs / 1000,
  remainingPilotSeconds: (summary.elapsedMs - summary.fixedMs) / 1000,
  pilotArithmetic: `${summary.fixedMs / 1000} + ${(summary.elapsedMs - summary.fixedMs) / 1000} = ${summary.elapsedMs / 1000} seconds`,
  projectionSeconds: summary.projection.projectedMs / 1000,
  projectionArithmetic: componentValues.map(ms => (ms / 1000).toFixed(6)).join(' + ') + ' = ' + (summary.projection.projectedMs / 1000).toFixed(6) + ' seconds (display rounded)',
  budgetArithmetic: `ceil(${summary.projection.projectedMs / 1000} * 1.25 + 30) = ${summary.projection.budgetSeconds} seconds > 900 seconds; STOP`,
  maxSampledRssBytes: ledger.maxObservedRssBytes, maxSampledRssMiB: ledger.maxObservedRssBytes / 1024 ** 2,
  resourceUsageMaxRssKiB: summary.maxRssFromProcessResourceUsageKiB,
  successfullyHashedPhysicalFiles: Object.keys(ledger.files).length,
  readOperations: ledger.reads, rawBytes: ledger.rawBytes, decodedBytes: ledger.decodedBytes,
  outputCounts: `${Object.values(byState).map(s => s.records).join(' + ')} = ${rows.length}`,
  limits: [
    'No full-universe scan ran. These counts cannot estimate a national missing-walk percentage.',
    'The estimate uses p95/mean record costs, assumed rereads, and a current loaded host; it is not a representative user latency measurement.',
    'Neither retainable option is not evidence that no physical bus/rail walk exists.',
    'Geometry and per-category availability overlap; do not sum them as distinct addresses.',
    'The output verifier checks identities/counts, not an independent reimplementation of routing or classification.',
  ],
};
writeFileSync(resolve(dir, 'pilot-analysis.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
