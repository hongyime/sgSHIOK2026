import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = 'C:\\sgSHIOK2026';
const OUT = 'C:\\sgSHIOK2026\\qa\\revamp-r1\\route-gap-20260913';
const started = performance.now();
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };
if (process.cwd().toLowerCase() !== ROOT.toLowerCase()) fail('CWD guard failed');
function guarded(absolute) {
  const resolved = path.resolve(absolute);
  if (!resolved.toLowerCase().startsWith(ROOT.toLowerCase() + path.sep)) fail('Outside C root');
  let current = ROOT;
  for (const part of path.relative(ROOT, resolved).split(path.sep)) {
    if (fs.lstatSync(current).isSymbolicLink()) fail('Linked parent');
    current = path.join(current, part);
  }
  if (fs.existsSync(resolved) && fs.realpathSync(resolved).toLowerCase() !== resolved.toLowerCase()) fail('Linked target');
  return resolved;
}
guarded(OUT);
const inputPath = guarded(path.join(OUT, 'inputs.json'));
const inputBytes = fs.readFileSync(inputPath);
const inputHash = sha(inputBytes);
if (inputHash !== '1d149df57e8c2532aa592220b131fcdf1389957f9abef3b787626ce2789a3643') fail('EXPECTED HASH DIFFERS: inputs.json');
const manifest = JSON.parse(inputBytes);
if (manifest.root !== ROOT || manifest.postal !== '018956') fail('Unexpected audit scope');
if (manifest.files.length > manifest.limits.files) fail('File-count gate');
const ownPath = guarded(fileURLToPath(import.meta.url));
const ownHash = sha(fs.readFileSync(ownPath));
const outputPath = guarded(path.join(OUT, 'report.json'));
if (fs.existsSync(outputPath)) fail('Refusing to overwrite evidence');
const buffers = new Map();
const consumed = [];
function timeGate() {
  if (performance.now() - started > manifest.limits.wallSeconds * 1000) fail('Wall-clock gate');
}
function readPinned(entry) {
  timeGate();
  if (entry.path.includes('..') || path.isAbsolute(entry.path)) fail('Invalid manifest path');
  const absolute = guarded(path.resolve(ROOT, entry.path));
  if (fs.statSync(absolute).size > manifest.limits.singleFileBytes) fail('File-size gate');
  const bytes = fs.readFileSync(absolute);
  if (sha(bytes) !== entry.sha256 || bytes.length !== entry.bytes) fail(`EXPECTED HASH DIFFERS: ${entry.path}`);
  return bytes;
}
if (manifest.files.reduce((sum, row) => sum + row.bytes, 0) > manifest.limits.totalBytes) fail('Total-byte gate');
for (const entry of manifest.files) {
  buffers.set(entry.path, readPinned(entry));
  consumed.push({ ...entry, verifiedBefore: true, verifiedAfter: false });
}
function verifyAbsences() {
  for (const relative of manifest.missingPaths) {
    if (fs.existsSync(guarded(path.resolve(ROOT, relative)))) fail(`Expected absence differs: ${relative}`);
  }
}
verifyAbsences();
const text = relative => {
  const bytes = buffers.get(relative) ?? fail(`Unallowlisted input: ${relative}`);
  return (relative.endsWith('.gz') ? gunzipSync(bytes, { maxOutputLength: manifest.limits.decodedShardBytes }) : bytes).toString('utf8');
};
const json = relative => JSON.parse(text(relative));
const fixturePath = 'web/lib/__tests__/fixtures/published-walks.json';
const fixture = json(fixturePath);
const provenance = json('web/lib/__tests__/fixtures/published-walks.provenance.json');
if (sha(buffers.get(fixturePath)) !== provenance.fixtureSha256) fail('Fixture provenance mismatch');
if (sha(buffers.get('web/data-bundle.json')) !== provenance.bundlePointerSha256) fail('Bundle pointer mismatch');
const base = `web/public/data/${manifest.bundle}/`;
const publicRow = relative => {
  const selected = json(base + relative).filter(row => row.postal === '018956');
  if (selected.length !== 1) fail('Expected exactly one public row');
  return selected[0];
};
const score = publicRow('scores/DOWNTOWN_CORE_PART_001.json');
const geometry = publicRow('geom/h3/886520db39fffff.json');
const selection = { result: { POSTAL: '018956', SEARCHVAL: 'Public 018956', LATITUDE: '1.282640', LONGITUDE: '103.860030' }, score, geom: geometry };
const beforeSelection = JSON.stringify(selection);

// Execute only the pinned, pure helpers. The page, API and scoring modules never load.
const modulePaths = ['polyline', 'contiguous-route-parts', 'published-transit-options', 'published-walk-view', 'published-walk-selection', 'published-transit-choices', 'walk-default', 'nearest-transit'];
const context = vm.createContext({});
const modules = new Map(modulePaths.map(name => {
  const relative = `web/lib/${name}.ts`;
  return [relative, new vm.SourceTextModule(stripTypeScriptTypes(text(relative)), { context, identifier: relative })];
}));
const entry = new vm.SourceTextModule("import * as selection from './published-walk-selection'; import * as defaults from './walk-default'; import * as nearest from './nearest-transit'; import * as polyline from './polyline'; export {selection, defaults, nearest, polyline};", { context, identifier: 'web/lib/audit-entry.ts' });
await entry.link((specifier, referencing) => {
  if (!specifier.startsWith('./')) fail('Nonlocal module import');
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(referencing.identifier), specifier)) + '.ts';
  return modules.get(relative) ?? fail(`Blocked module import: ${relative}`);
});
await entry.evaluate({ timeout: 5000 });
const { selection: sel, defaults, nearest, polyline } = entry.namespace;
const pools = Object.fromEntries(['bus', 'mrt_lrt'].map(category => [category, sel.normalizePublishedSelection(selection, category, manifest.bundle)]));
const options = Object.values(pools).flatMap(pool => pool.options);
const compact = option => ({ key: option.key, name: option.name, category: option.category, aliases: option.aliases, selectionRef: option.selectionRef, status: option.status, retainable: option.retainable, classification: option.classification, metrics: option.metrics, geometry: Object.fromEntries(['shortest', 'sheltered'].map(variant => [variant, { status: option.geometry[variant].status, parts: option.geometry[variant].parts.length }])), diagnostics: option.diagnostics });
const checks = [];
function check(name, condition) {
  checks.push({ name, pass: Boolean(condition) });
  if (!condition) fail(`Audit assertion failed: ${name}`);
}
check('five published candidate rows', score.candidates.length === 5);
check('five matching candidate geometry entries', Object.keys(geometry.candidates).length === 5);
check('all five candidate geometry references match postal and ID', score.candidates.every(row => row.geometry_ref === `018956_${row.node_id}` && geometry.candidates[row.node_id]));
check('three normalized bus options and three MRT options', pools.bus.options.length === 3 && pools.mrt_lrt.options.length === 3);
check('six complete retainable saved destinations; no rejected IDs', options.every(option => option.retainable && option.geometry.shortest.status === 'complete' && option.geometry.sheltered.status === 'complete') && Object.values(pools).every(pool => pool.rejectedSources.length === 0));
check('all five explicit saved candidate IDs resolve', score.candidates.every(row => sel.publishedOptionForStop(pools[row.node_type === 'bus_stop' ? 'bus' : 'mrt_lrt'], row.node_id)));

// Reuse the exact bounded H3 selection and deduplication used by data.ts.
const require = createRequire(import.meta.url);
const h3Path = 'web/node_modules/h3-js/dist/h3-js.js';
if (sha(fs.readFileSync(guarded(path.resolve(ROOT, h3Path)))) !== sha(buffers.get(h3Path))) fail('H3 dependency changed');
const h3 = require(guarded(path.resolve(ROOT, h3Path)));
const dataSource = text('web/lib/data.ts');
const cellStart = dataSource.indexOf('function addRouteCells(');
const cellEnd = dataSource.indexOf('async function fetchTransitPoiShard(');
if (cellStart < 0 || cellEnd <= cellStart) fail('Cell helper extraction failed');
const cells = vm.runInNewContext(stripTypeScriptTypes(dataSource.slice(cellStart, cellEnd)) + '\ntransitCellsForGeom(geometry);', { geometry, decodePolyline: polyline.decodePolyline, latLngToCell: h3.latLngToCell, gridDisk: h3.gridDisk }, { timeout: 3000 });
check('exactly seven route-neighborhood cells', cells.length === 7);
const features = [];
const seen = new Set();
const shardStatus = cells.map(cell => {
  const relative = `${base}transit/h3/${cell}.json.gz`;
  if (!buffers.has(relative)) {
    check('missing shard is explicitly pinned absent', manifest.missingPaths.includes(relative));
    return { cell, status: 'absent_plain_and_gzip', features: 0 };
  }
  const rows = json(relative).features;
  for (const feature of rows) {
    const key = `${feature.properties?.kind}:${feature.properties?.id}:${feature.geometry?.coordinates?.join(',') || ''}`;
    if (!seen.has(key)) { seen.add(key); features.push(feature); }
  }
  return { cell, status: 'present_gzip', features: rows.length };
});
const counts = features.reduce((acc, feature) => { const key = feature.properties.kind; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
check('prior QA POI counts reproduced offline', counts.bus_stop === 27 && counts.mrt_exit === 34 && counts.mrt_station === 7);
const pois = { type: 'FeatureCollection', features };
const nearestFive = Object.fromEntries(['bus', 'mrt_lrt'].map(mode => [mode, nearest.deriveNearestTransitCandidates({ originLat: 1.282640, originLng: 103.860030, transitPois: pois, mode, limit: 5 })]));
const defaultMrt = sel.publishedDefault(pools.mrt_lrt, 'mrt_lrt');
const exitE = features.find(feature => feature.properties.id === 'mrt:21677');
const defaultNode = defaultMrt.selectedSource.raw.best_node;
const sameIdentity = features.filter(feature => feature.properties.kind === 'mrt_exit' && feature.properties.station === defaultNode.station && feature.properties.exit === defaultNode.exit && feature.properties.name === defaultNode.name);
const endpointDistanceM = Math.min(...defaultMrt.geometry.sheltered.parts.flatMap(part => [part.points[0], part.points.at(-1)]).map(([lat, lon]) => nearest.haversineMeters(lat, lon, exitE.geometry.coordinates[1], exitE.geometry.coordinates[0])));
check('Exit E unique station/exit/name identity plus saved endpoint within 2m', sameIdentity.length === 1 && sameIdentity[0].properties.id === 'mrt:21677' && endpointDistanceM < 2);
check('reproduces missing default MRT marker alias', defaultMrt.retainable && defaultMrt.aliases.length === 0 && sel.publishedOptionForStop(pools.mrt_lrt, 'mrt:21677') === null);
check('Exit E is in nearest five; top-five filtering is not this cause', nearestFive.mrt_lrt.some(row => row.id === 'mrt:21677'));
const markerRows = features.map(feature => {
  const { id, kind, name } = feature.properties;
  const category = kind === 'bus_stop' ? 'bus' : kind === 'mrt_exit' ? 'mrt_lrt' : null;
  const option = category ? sel.publishedOptionForStop(pools[category], id) : null;
  return { id, kind, name, classification: !category ? 'station_parent_not_exit_denominator' : option ? 'saved_resolves_by_id' : id === 'mrt:21677' ? 'saved_default_marker_identity_gap' : 'absent_from_saved_payload', savedKey: option?.key ?? (id === 'mrt:21677' ? defaultMrt.key : null) };
});
const markerCounts = markerRows.reduce((acc, row) => { acc[row.classification] = (acc[row.classification] || 0) + 1; return acc; }, {});
check('61 stop/exit markers partition into 5 resolved, 1 identity gap, 55 absent', markerCounts.saved_resolves_by_id === 5 && markerCounts.saved_default_marker_identity_gap === 1 && markerCounts.absent_from_saved_payload === 55 && markerCounts.station_parent_not_exit_denominator === 7);
check('public API-probe target has no saved score or geometry candidate', !score.candidates.some(row => row.node_id === 'bus:03419') && !geometry.candidates['bus:03419'] && !sel.publishedOptionForStop(pools.bus, 'bus:03419'));

// Run the existing click callback and URL effect with state setters only, no React/API.
const page = text('web/app/page.tsx');
const clickStart = page.indexOf('  const handleStopSelect = useCallback(');
const clickEnd = page.indexOf('\n  );', clickStart) + '\n  );'.length;
const urlStart = page.indexOf('  useEffect(() => {', page.indexOf('// Published choices resolve independently'));
const urlEnd = page.indexOf('\n  }, [', urlStart);
if (clickStart < 0 || clickEnd <= clickStart || urlStart < 0 || urlEnd < urlStart) fail('Page helper extraction failed');
function pageCase(mode, url = false) {
  const observed = {};
  const sandbox = { primary: selection, mapTransitPois: pois, transitMode: mode, bestCandidateId: nearest.resolveBestCandidateId(nearestFive[mode], sel.publishedSelectionView(selection, sel.publishedDefault(pools[mode], mode)).score), DATA_BASE: manifest.bundle,
    normalizePublishedSelection: sel.normalizePublishedSelection, publishedOptionForStop: sel.publishedOptionForStop, publishedChoiceTarget: sel.publishedChoiceTarget,
    useCallback: fn => fn, useEffect: fn => fn(), discardPendingUrlIntent() {}, setTransitMode(value) { observed.mode = value; }, setChosenStopId(value) { observed.stop = value; }, setLiveRoutePreviewStatuses() {}, setExposureSelection() {}, syncStopUrl() {},
    loading: false, transitPoisReady: true, pathname: '/', routeMode: 'shiokest', pendingUrlPostalRef: { current: '018956' }, pendingUrlTransitRef: { current: 'mrt_lrt' }, pendingUrlRouteRef: { current: null }, pendingUrlStopIdRef: { current: 'mrt:21677' }, setRouteMode() {}, syncWalkUrl() {} };
  const code = url ? page.slice(urlStart, urlEnd) + '\n  });' : page.slice(clickStart, clickEnd) + '\nhandleStopSelect("mrt:21677");';
  vm.runInNewContext(stripTypeScriptTypes(code), sandbox, { timeout: 1000 });
  return observed;
}
const clickFromBus = pageCase('bus');
const clickFromMrt = pageCase('mrt_lrt');
const explicitUrl = pageCase('bus', true);
check('cross-category click retains unresolvable Exit E stop ID', clickFromBus.mode === 'mrt_lrt' && clickFromBus.stop === 'mrt:21677');
check('same-category default fallback can resolve Exit E without alias', clickFromMrt.mode === 'mrt_lrt' && clickFromMrt.stop === null);
check('explicit Exit E URL takes POI fallback, not saved resolution', explicitUrl.mode === 'mrt_lrt' && explicitUrl.stop === 'mrt:21677');
const shortest = Object.fromEntries(['bus', 'mrt_lrt'].map(category => { const result = defaults.shortestSavedWalk(selection, manifest.bundle, category); return [category, { name: result.option.name, distance: result.distance, route: result.route, aliases: result.option.aliases }]; }));
check('automatic saved defaults remain bus81.2m and MRT109.2m', shortest.bus.distance === 81.2 && shortest.mrt_lrt.distance === 109.2);

const fixtureRows = Object.entries(fixture).filter(([key]) => /^scores\/[A-Z].*\.json$/.test(key)).flatMap(([, rows]) => rows);
const fixtureClassification = fixtureRows.map(row => ({ postal: row.postal, state: row.state, candidateRows: row.candidates?.length ?? 0, geometryIncluded: Boolean(fixture['geom/postal-index.json'][row.postal]), classification: !row.paths ? 'no_saved_route_in_sample' : row.paths.routing_type === 'direct_bus_fallback_unrouted' ? 'straight_line_estimate_not_saved_walk' : 'saved_geometry_in_fixture' }));
check('portable fixture has four rows with two saved, one unrouted, one absent', fixtureClassification.length === 4 && fixtureClassification.filter(row => row.classification === 'saved_geometry_in_fixture').length === 2 && fixtureClassification.filter(row => row.classification === 'straight_line_estimate_not_saved_walk').length === 1 && fixtureClassification.filter(row => row.classification === 'no_saved_route_in_sample').length === 1);
const reducedScore = fixtureRows.find(row => row.postal === '018956');
const reducedGeom = fixture['geom/h3/886520db39fffff.json'].find(row => row.postal === '018956');
const reduced = { ...selection, score: reducedScore, geom: reducedGeom };
check('portable fixture retains only one 018956 alternate, without category defaults', reducedScore.candidates.length === 1 && !reducedScore.route_options && !reducedGeom.route_options);
check('retained portable alternate resolves with 110m, never inherited full score', sel.publishedSelectionView(reduced, sel.publishedOptionForStop(sel.normalizePublishedSelection(reduced, 'mrt_lrt', manifest.bundle), 'mrt:21678')).score === null);
check('input objects remain unchanged', JSON.stringify(selection) === beforeSelection);

const oldQa = json('qa/revamp-r1/walk-only-20260913/summary.json');
const probe = json('qa/revamp-r1/walk-only-20260913/provider-probe.json');
check('previous probe is public018956 and successful, not a new call', probe.fixturePostal === '018956' && probe.stop === 'bus:03419' && probe.httpStatus === 200 && probe.usable === true);
check('prior QA is the named final preview generation', oldQa.buildId === 'LWmaOWIMR0lOcdFZ1XlYd' && oldQa.browser.primary.ok === true && oldQa.browser.primary.checks === 64);
for (const row of consumed) { readPinned(row); row.verifiedAfter = true; }
verifyAbsences();
if (sha(fs.readFileSync(inputPath)) !== inputHash || sha(fs.readFileSync(ownPath)) !== ownHash) fail('Audit files changed during run');
timeGate();
const report = {
  status: 'bounded_diagnosis_complete_no_routes_created_or_fixed', date: '2026-09-13', root: ROOT, baselineHead: manifest.baselineHead, bundle: manifest.bundle, postal: '018956',
  boundaries: { physicalFiles: consumed.length, bytesPerHashPass: consumed.reduce((sum, row) => sum + row.bytes, 0), publicScorePartitions: 1, publicGeometryShards: 1, publicRowsAnalyzed: 1, poiCellsRequested: 7, poiShardsRead: 6, missingPoiShards: 1, portableFixtureRows: 4, ownerPrivateFixtures: 0, networkCalls: 0, scoringRuns: 0, exports: 0, ingests: 0, inputRebuilds: 0, fullBundleScans: 0, sharedSourceEdits: 0, docsEdits: 0, commits: 0, note: 'One score partition and one geometry shard were hashed/parsed, but only public 018956 rows analyzed. Other fixture rows are portable sample controls, not complete production coverage. No current API/browser/phone/deployment acceptance.' },
  publicCoverage: { poiCounts: counts, selectableStopExitDenominator: 61, markerCounts, perCategory: ['bus_stop', 'mrt_exit'].map(kind => ({ kind, total: markerRows.filter(row => row.kind === kind).length, resolved: markerRows.filter(row => row.kind === kind && row.classification === 'saved_resolves_by_id').length, identityGap: markerRows.filter(row => row.kind === kind && row.classification === 'saved_default_marker_identity_gap').length, absent: markerRows.filter(row => row.kind === kind && row.classification === 'absent_from_saved_payload').length })), candidates: score.candidates.map(row => ({ id: row.node_id, geometryRef: row.geometry_ref, type: row.node_type, directDistanceM: row.direct_distance_m, metrics: row.paths, routeTrust: row.route_trust })), normalizedSavedOptions: options.map(compact), shortestSaved: shortest, nearestFive, markers: markerRows, poiShards: shardStatus },
  fixture: { classification: fixtureClassification, reduction: provenance.reduction, boundary: 'Reduced fixture deliberately omits other candidates and every category route_options; it cannot establish production 018956 coverage or reproduce the Exit E default gap on its own.' },
  findings: [
    { id: 'F1', classification: 'frontend_identifier_gap', severity: 'P2', destination: 'mrt:21677', name: defaultMrt.name, endpointDistanceM, savedShortestM: defaultMrt.metrics.shortest_m.value, savedShelteredM: defaultMrt.metrics.sheltered_m.value, currentAliases: defaultMrt.aliases, reproduced: { clickFromBus, clickFromMrt, explicitUrl }, evidence: ['web/lib/published-transit-options.ts:392', 'web/lib/published-transit-options.ts:459', 'web/lib/published-walk-selection.ts:44', 'web/app/page.tsx:2307', 'web/app/page.tsx:2554', 'web/app/page.tsx:2104'], explanation: 'Default MRT routes get no strong ID unless merged with a retained matching candidate. Exit E is a complete saved default but absent from the five candidate rows; aliases is empty. Cross-category clicks and explicit stop URLs reach the preview branch; same-category bestCandidateId fallback still accesses the saved default. Not a top-five filter or missing geometry.', minimalFix: 'In the frontend stop-resolution layer, after exact published alias lookup, resolve a retainable MRT category/top default against the loaded POIs only when station+exit identify one distinct MRT-exit ID and validated saved geometry has an endpoint at that POI within precision-5 tolerance. Reject ambiguity and mismatch; never use station center, nearest distance or name alone. Canonicalize the match via publishedChoiceTarget to mode=mrt_lrt and stopId=null. Use the same resolver in handleStopSelect and pending URL restoration; preserve exact alias lookup and canonical defaults when POIs are unavailable. Do not change saved data or loosen normalizer identity/trust checks.', requiredTests: ['Public018956 + Exit E POI: click from saved bus resolves category_default, zero requestWalkPreview calls, unchanged saved geometry/metrics.', 'Restore postal=018956&transit=mrt_lrt&stop=mrt:21677 with delayed POI load: resolve same saved default without preview or previous-stop geometry.', 'Same-category Exit E, existing five aliases, missing POIs, station-parent clicks, unknown IDs, duplicate station/exit IDs and endpoint mismatch: no accidental saved-route association.', 'Absent bus:03419 still remains preview-only and failed preview retains prior saved walk.'] },
    { id: 'F2', classification: 'absent_saved_data_in_bounded_payload', count: 55, busStops: 24, mrtExits: 31, example: 'bus:03419', explanation: 'POI markers have coordinates and transit metadata, not an origin-specific saved route. These IDs are absent from 018956 candidate geometry/metrics and do not match a saved category default. No API failure or ID mismatch is needed to explain their saved-route absence.', upstreamBoundary: 'The record reports 8 candidate scores, 7 route results and 7 routes within access range; it publishes 5 candidate rows plus category defaults. Those aggregate pipeline counts are not saved-ID inventory. This audit does not infer which unexported upstream routes existed or why each absent ID was excluded.', recordedProvenance: { transit_node_set: score.provenance.transit_node_set, routing_diagnostics: score.provenance.routing_diagnostics, candidate_selection: score.provenance.candidate_selection } },
    { id: 'F3', classification: 'historical_preview_transport_failure_separate_from_saved_coverage', priorBuildId: oldQa.buildId, previousProbe: { postal: probe.fixturePostal, stop: probe.stop, startedAt: probe.startedAt, httpStatus: probe.httpStatus, usable: probe.usable, elapsedMs: probe.elapsedMs }, priorBrowser: { ok: oldQa.browser.primary.ok, checks: oldQa.browser.primary.checks, captures: oldQa.browser.primary.samples.length, replayOk: oldQa.browser.successReplay.ok, replayChecks: oldQa.browser.successReplay.functionalChecks, replayErrors: oldQa.browser.successReplay.errors.length }, explanation: 'Prior summary attributes older preview failures to a proxy denying APIs. The final proxy explicitly forwards GET /api/onemap-route and the stored public probe succeeded. Replay has 21 functional checks but two CDP errors and remains failed. This run made no API requests and cannot establish present provider availability; preview success does not create a saved route.' }
  ],
  checks, consumedFiles: consumed, auditInputsSha256: inputHash, auditScriptSha256: ownHash, elapsedMs: Number((performance.now() - started).toFixed(3)),
  changedPaths: ['qa/revamp-r1/route-gap-20260913/audit.mjs', 'qa/revamp-r1/route-gap-20260913/inputs.json', 'qa/revamp-r1/route-gap-20260913/report.json'],
};
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
process.stdout.write(JSON.stringify({ status: report.status, checks: checks.length, markerCounts, elapsedMs: report.elapsedMs, outputPath, reportSha256: sha(fs.readFileSync(outputPath)) }) + '\n');
