import { readFileSync, writeFileSync, mkdirSync, statSync, createWriteStream, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { once } from 'node:events';
import { freemem, hostname } from 'node:os';
import { performance } from 'node:perf_hooks';
import { createJsonReader } from './reader.mjs';
import { createCoverageEngine, selectPilotPostals } from './engine.mjs';
import { projectScan } from './projection.mjs';

const ROOT = 'C:\\sgSHIOK2026';
if (process.cwd() !== ROOT) throw Error('Wrong working root');
const DIR = resolve(ROOT, 'qa/revamp-r1/coverage-register-20260909');
const [mode, label, pilotLabel, extra] = process.argv.slice(2);
if (!['pilot', 'full'].includes(mode) || !/^[a-z0-9-]+$/.test(label ?? '') || extra
  || (mode === 'full' ? !/^[a-z0-9-]+$/.test(pilotLabel ?? '') : pilotLabel !== undefined)) throw Error('Usage: scan.mjs pilot FRESH-LABEL | full FRESH-LABEL PASSED-PILOT-LABEL');
const output = resolve(DIR, label);
mkdirSync(output);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const receipt = (name, value) => writeFileSync(resolve(output, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const sourcePaths = ['reader.mjs', 'engine.mjs', 'locators.mjs', 'projection.mjs', 'scan.mjs'].map(name => resolve(DIR, name));
const sourceIdentities = () => sourcePaths.map(path => ({ path: path.slice(ROOT.length + 1).replaceAll('\\', '/'), sha256: hash(readFileSync(path)) }));
const started = performance.now(), createdAt = new Date().toISOString(), before = sourceIdentities();
const maxSeconds = 900, MiB = 1024 ** 2, GiB = 1024 ** 3;
let reader, engine, writer, writerDone, writerError, rows = 0, rawOutputBytes = 0;
const rawOutputHash = createHash('sha256');
const totals = {};
const bump = (name, value) => { const count = totals[name] ??= {}; const key = String(value); count[key] = (count[key] ?? 0) + 1; };
const report = { mode, createdAt, root: ROOT, hostname: hostname(), before, complete: false, coverageComplete: false,
  scope: 'Read-only published postal lookups; no coordinate rescue or pipeline execution',
  boundaries: 'RSS/deadline checked at operation boundaries, not hard OS interruption; decoded cache bytes are not heap bytes' };
try {
  report.freeMemoryBefore = freemem();
  if (report.freeMemoryBefore < 1024 * MiB) throw Object.assign(Error('Less than 1 GiB currently free; do not start data pass'), { code: 'STOP_HEADROOM' });
  const compiledDir = resolve(DIR, 'compile-3'), compiled = json(resolve(compiledDir, 'compile.json'));
  if (compiled.exitCode !== 0 || !compiled.sourcesStable || compiled.sources.length !== 4 || compiled.compiled.length !== 4) throw Error('Compile identity receipt is incomplete');
  for (const item of compiled.sources) if (hash(readFileSync(resolve(ROOT, item.path))) !== item.sha256) throw Object.assign(Error('Compiled source no longer current: ' + item.path), { code: 'STOP_SOURCE_IDENTITY' });
  for (const item of compiled.compiled) if (!/^[a-z-]+\.js$/.test(item.name) || hash(readFileSync(resolve(compiledDir, 'compiled', item.name))) !== item.sha256) throw Object.assign(Error('Compiled output changed: ' + item.name), { code: 'STOP_SOURCE_IDENTITY' });
  report.classifier = { sources: compiled.sources, compiled: compiled.compiled };
  const classify = createRequire(import.meta.url)(resolve(compiledDir, 'compiled/coverage-gap-register.js')).coverageGapRow;
  const checksumBytes = readFileSync(resolve(ROOT, 'checksums.json'));
  const checksums = JSON.parse(checksumBytes), pinBytes = readFileSync(resolve(ROOT, 'web/data-bundle.json')), pin = JSON.parse(pinBytes);
  report.checksumsSha256 = hash(checksumBytes); report.pinSha256 = hash(pinBytes);
  if (pin.bundle !== 'generated_20260805_prefer_scored_routed' || checksums.bundle !== pin.bundle || checksums.file_count !== 4848
    || Object.keys(checksums.files).length !== checksums.file_count
    || checksums.manifest_sha256 !== '7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e') throw Error('Unexpected pinned bundle/checksum metadata');
  report.bundle = pin.bundle;
  let budgetSeconds = 300;
  if (mode === 'full') {
    const pilot = json(resolve(DIR, pilotLabel, 'summary.json'));
    if (pilot.mode !== 'pilot' || !pilot.complete || pilot.projection?.gate !== 'pass' || pilot.projection.budgetSeconds > maxSeconds
      || pilot.checksumsSha256 !== report.checksumsSha256 || pilot.pinSha256 !== report.pinSha256
      || JSON.stringify(pilot.before) !== JSON.stringify(before) || JSON.stringify(pilot.classifier) !== JSON.stringify(report.classifier)) throw Error('Full pass requires complete, identity-matched passed pilot');
    budgetSeconds = pilot.projection.budgetSeconds;
    report.pilot = { label: pilotLabel, sha256: hash(readFileSync(resolve(DIR, pilotLabel, 'summary.json'))) };
  }
  report.budgetSeconds = budgetSeconds;
  reader = createJsonReader({ bundleRoot: resolve(ROOT, 'web/public/data', pin.bundle), checksums: checksums.files,
    deadline: Date.now() + Math.max(0, budgetSeconds * 1000 - (performance.now() - started)), maxTotalReadBytes: 24 * GiB, maxTotalDecodedBytes: 24 * GiB, maxRssBytes: 768 * MiB });
  const manifest = reader.read('manifest.json');
  if (manifest.status === 'present' && manifest.decodedSha256 !== checksums.manifest_sha256) throw Object.assign(Error(`Frozen manifest mismatch expected=${checksums.manifest_sha256} actual=${manifest.decodedSha256}`), { code: 'STOP_INPUT_MISMATCH' });
  if (manifest.status !== 'present' || manifest.value.provenance?.record_count !== 124443) throw Error('Unexpected manifest record count');
  report.expectedRecordCount = manifest.value.provenance.record_count;
  report.expectedStates = manifest.value.provenance.state_counts;
  engine = createCoverageEngine({ reader, bundle: pin.bundle, classify });
  if (engine.declarations.size !== report.expectedRecordCount) throw Error('Declared postal universe differs from pinned record count');
  const sizes = { scores: [], geometry: [] };
  for (const name of new Set(Object.keys(checksums.files).map(path => path.endsWith('.gz') ? path.slice(0, -3) : path))) {
    const category = /^scores\/(?!index\.json$|prefix-index\.json$)[A-Za-z0-9_-]+\.json$/.test(name) ? 'scores'
      : /^geom\/h3\/[A-Za-z0-9_-]+\.json$/.test(name) ? 'geometry' : null;
    if (!category) continue;
    reader.checkBudget();
    const inspected = reader.inspect(name);
    if (inspected.status !== 'present') throw Object.assign(Error('Expected logical artifact absent: ' + name), { code: 'STOP_INVENTORY_MISSING' });
    sizes[category].push({ name, shard: name.split('/').at(-1).slice(0, -5), physical: inspected.physicalPath,
      bytes: inspected.bytes, plainBytes: inspected.plainBytes });
  }
  report.inventory = Object.fromEntries(Object.entries(sizes).map(([kind, list]) => [kind, {
    files: list.length, physicalBytes: list.reduce((sum, f) => sum + f.bytes, 0), plainBytes: list.reduce((sum, f) => sum + (f.plainBytes ?? 0), 0),
    unknownPlainFiles: list.filter(f => f.plainBytes === null).length,
    compressedFiles: list.filter(f => f.physical.endsWith('.gz')).length,
  }]));
  receipt('size-inventory.json', sizes);
  report.fixedMs = performance.now() - started;
  const fixedIo = reader.getStats();
  const selected = mode === 'pilot' ? selectPilotPostals(engine.area, sizes.scores.filter(f => f.shard in engine.area), 200)
    : { postals: [...engine.declarations.keys()], strata: [] };
  report.selection = selected;
  writer = createGzip({ level: 6 });
  writerDone = pipeline(writer, createWriteStream(resolve(output, 'register.jsonl.gz'), { flags: 'wx' })).catch(error => { writerError = error; });
  if (mode === 'full') engine.inspectAll();
  await engine.scan(selected.postals, async row => {
    reader.checkBudget();
    if (writerError) throw writerError;
    const encoded = JSON.stringify(row) + '\n';
    if (!writer.write(encoded)) await once(writer, 'drain');
    rawOutputHash.update(encoded); rawOutputBytes += Buffer.byteLength(encoded); rows++;
    for (const key of ['scoreRecord', 'state', 'completeLockedFields', 'coordinateGap', 'routeDisconnection', 'rangeLimit', 'trustRejection', 'geometryLookup']) bump(key, row[key]);
    for (const category of row.categories) {
      bump(category.category + '.retainable', category.retainable > 0 ? 'available' : 'none');
      bump(category.category + '.candidateBacked', category.candidateBackedOptions > 0 ? 'available' : 'none');
      for (const [key, value] of Object.entries(category.diagnostics)) { const counts = totals[category.category + '.overlappingDiagnosticOptions'] ??= {}; counts[key] = (counts[key] ?? 0) + value; }
    }
    if (rows % (mode === 'pilot' ? 50 : 5000) === 0) console.log(JSON.stringify({ mode, rows, elapsedSeconds: (performance.now() - started) / 1000, rssBytes: process.memoryUsage().rss }));
  });
  writer.end(); await writerDone;
  if (writerError) throw writerError;
  reader.checkBudget();
  report.complete = rows === selected.postals.length;
  report.coverageComplete = mode === 'full' && report.complete && rows === report.expectedRecordCount;
  report.readPassMs = performance.now() - started - report.fixedMs;
  const io = reader.getStats();
  const marginal = { rawBytes: io.rawBytes - fixedIo.rawBytes, decodedBytes: io.decodedBytes - fixedIo.decodedBytes,
    lookupCalls: io.lookupCalls - fixedIo.lookupCalls,
    reads: io.reads - fixedIo.reads, timingsMs: Object.fromEntries(Object.entries(io.timingsMs).map(([key, value]) => [key, value - fixedIo.timingsMs[key]])) };
  report.marginalIo = marginal;
  if (mode === 'pilot') {
    const score = report.inventory.scores, geom = report.inventory.geometry;
    const plannedRawBytes = 2 * score.physicalBytes + 2 * geom.physicalBytes;
    const plannedDecodedBytes = Math.ceil(1.1 * (2 * score.plainBytes + 2 * geom.plainBytes));
    const plannedLookupCalls = 2 * (2 * score.files + report.expectedRecordCount * 2 + 542);
    report.projectionAssumptions = { scorePasses: 2, geometryReadMultiplier: 2, decodedToPlainAllowance: 1.1,
      plannedRawBytes, plannedDecodedBytes, plannedLookupCalls,
      arithmetic: `raw: 2 * ${score.physicalBytes} + 2 * ${geom.physicalBytes} = ${plannedRawBytes}; decoded: ceil(1.1 * (2 * ${score.plainBytes} + 2 * ${geom.plainBytes})) = ${plannedDecodedBytes}; probes: 2 * (2 * ${score.files} + ${report.expectedRecordCount} * 2 + 542) = ${plannedLookupCalls}`,
      limitation: 'Observed rates and assumed rereads, not a guarantee. Unseen compression/geometry costs and cache churn can exceed this; runtime limits still stop the pass.' };
    report.projection = projectScan({ fixedMs: report.fixedMs, recordCount: report.expectedRecordCount,
      sampleNormalizationMs: engine.timing.normalizationMs.map((ms, i) => ms + engine.timing.geometryCpuMs[i]
        + engine.timing.decisionCpuMs / rows + engine.timing.locatorCpuMs / Math.max(1, engine.timing.inspectedRows)),
      sampleSerializationMs: engine.timing.outputMs,
      io: marginal, plannedRawBytes, plannedDecodedBytes, plannedLookupCalls, maxSeconds });
    const gzipGeometryRead = Object.keys(io.files).some(path => path.startsWith('geom/h3/') && path.endsWith('.gz'));
    if ((geom.compressedFiles > 0 && !gzipGeometryRead) || score.unknownPlainFiles || geom.unknownPlainFiles || plannedRawBytes > 24 * GiB || plannedDecodedBytes > 24 * GiB) {
      report.projection.gate = 'stop'; report.projection.additionalGate = 'Unmeasured geometry gzip costs, unknown decoded-volume estimate or projected byte cap exceeded';
    }
  }
  if (hash(readFileSync(resolve(ROOT, 'checksums.json'))) !== report.checksumsSha256 || hash(readFileSync(resolve(ROOT, 'web/data-bundle.json'))) !== report.pinSha256) throw Object.assign(Error('Input identity changed during scan'), { code: 'STOP_INPUT_MISMATCH' });
} catch (error) {
  report.complete = false; report.coverageComplete = false;
  report.error = { code: error.code ?? 'STOP_SCAN', message: error.message, stack: error.stack };
  process.exitCode = 1;
} finally {
  report.finalizationFailures = [];
  const finalize = async (name, action) => {
    try { await action(); } catch (error) {
      report.finalizationFailures.push({ name, message: error.message, code: error.code });
      report.complete = false; report.coverageComplete = false; process.exitCode = 1;
    }
  };
  await finalize('finish-output', async () => {
    if (writer && !writer.writableEnded && !writer.destroyed) writer.end();
    if (writerDone) await writerDone;
    if (writerError) throw writerError;
  });
  report.rows = rows; report.totals = totals;
  report.rawOutput = { bytes: rawOutputBytes, sha256: rawOutputHash.digest('hex') };
  if (writer && !writerError) await finalize('output-identity', async () => {
    const digest = createHash('sha256');
    for await (const bytes of createReadStream(resolve(output, 'register.jsonl.gz'))) digest.update(bytes);
    report.compressedOutput = { bytes: statSync(resolve(output, 'register.jsonl.gz')).size, sha256: digest.digest('hex') };
  });
  report.elapsedMs = performance.now() - started; report.freeMemoryAfter = freemem();
  report.maxRssFromProcessResourceUsageKiB = process.resourceUsage().maxRSS;
  await finalize('source-identities', () => {
    report.after = sourceIdentities(); report.sourcesStable = JSON.stringify(before) === JSON.stringify(report.after);
    if (report.classifier) {
      report.classifierAfter = { sources: report.classifier.sources.map(item => ({ ...item, sha256: hash(readFileSync(resolve(ROOT, item.path))) })),
        compiled: report.classifier.compiled.map(item => ({ ...item, sha256: hash(readFileSync(resolve(DIR, 'compile-3/compiled', item.name))) })) };
      report.sourcesStable &&= JSON.stringify(report.classifier) === JSON.stringify(report.classifierAfter);
    }
    if (!report.sourcesStable) throw Error('Scanner or classifier identity changed');
  });
  if (reader) await finalize('input-ledger', () => receipt('input-ledger.json', reader.getStats()));
  if (engine) {
    await finalize('locator-diagnostics', () => receipt('locator-diagnostics.json', engine.diagnostics()));
    await finalize('record-timings', () => receipt('record-timings.json', engine.timing));
  }
  await finalize('summary', () => receipt('summary.json', report));
  console.log(JSON.stringify({ output, complete: report.complete, coverageComplete: report.coverageComplete, rows, elapsedMs: report.elapsedMs,
    fixedMs: report.fixedMs, error: report.error, finalizationFailures: report.finalizationFailures, projection: report.projection, totals }));
}
