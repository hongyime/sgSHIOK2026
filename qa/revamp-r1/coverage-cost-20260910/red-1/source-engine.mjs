import { performance } from 'node:perf_hooks';
import { scoreDeclarations, firstPostalRows, resolveScoreLocator, resolveGeometryLocator } from './locators.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const postal = value => typeof value === 'string' && /^\d{6}$/.test(value);
const shard = value => typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);
function geometryIndex(value) {
  if (!object(value) || Object.entries(value).some(([p, s]) => !postal(p) || !shard(s))) throw Error('Malformed geometry index');
  return value;
}

export function selectPilotPostals(index, sizes, limit = 200) {
  if (!Number.isSafeInteger(limit) || limit < 1) throw Error('Invalid pilot size');
  const ranked = [...sizes].sort((a, b) => a.bytes - b.bytes || a.shard.localeCompare(b.shard));
  if (!ranked.length) throw Error('No score shards');
  const strata = [...new Set([ranked[0].shard, ranked[Math.floor(ranked.length / 2)].shard, ranked.at(-1).shard])];
  const result = new Set(), receipts = [];
  for (let i = 0; i < strata.length; i++) {
    const name = strata[i], candidates = [...new Set(index[name])];
    const quota = Math.ceil((limit - result.size) / (strata.length - i));
    const before = result.size;
    // Spread across each shard instead of just taking its first block of records.
    for (let j = 0; j < Math.min(quota, candidates.length); j++) result.add(candidates[Math.floor(j * candidates.length / Math.min(quota, candidates.length))]);
    receipts.push({ shard: name, declared: candidates.length, selected: result.size - before });
  }
  for (const name of Object.keys(index)) for (const p of index[name]) {
    if (result.size >= limit) break;
    result.add(p);
  }
  return { postals: [...result], strata: receipts, supplemental: result.size - receipts.reduce((sum, r) => sum + r.selected, 0) };
}

export function createCoverageEngine({ reader, bundle, classify }) {
  let readMs = 0;
  const read = (...args) => { const start = performance.now(); try { return reader.read(...args); } finally { readMs += performance.now() - start; } };
  const readIndex = (path, optional = false) => {
    const file = read(path);
    if (file.status === 'missing' && optional) return {};
    if (file.status !== 'present') throw Error('Required index missing: ' + path);
    return file.value;
  };
  const area = readIndex('scores/index.json');
  const declarations = scoreDeclarations(area);
  const prefix = readIndex('scores/prefix-index.json', true);
  if (!object(prefix) || Object.entries(prefix).some(([p, names]) => !/^\d{3}$/.test(p) || !Array.isArray(names) || names.some(s => !shard(s)))) throw Error('Malformed score prefix');
  const full = geometryIndex(readIndex('geom/postal-index.json', true));
  const files = new Map(), prefixGeometry = new Map();
  const timing = { locatorMs: 0, locatorCpuMs: 0, inspectedRows: 0, decisionCpuMs: 0, geometryCpuMs: [], normalizationMs: [], outputMs: [] };
  function inspect(name) {
    if (files.has(name)) return files.get(name);
    const start = performance.now();
    const result = read(`scores/${name}.json`, { cache: false });
    const cpuStart = performance.now();
    const info = result.status === 'missing' ? { status: 'missing' } : {
      status: 'present', ...firstPostalRows(result.value), rows: result.value.length,
    };
    if (info.status === 'present') info.orphans = [...info.first.keys()].filter(p => !declarations.has(p));
    files.set(name, info);
    timing.locatorCpuMs += performance.now() - cpuStart;
    timing.inspectedRows += info.rows ?? 0;
    timing.locatorMs += performance.now() - start;
    reader.checkBudget();
    return info;
  }
  function locate(p) {
    const start = performance.now(), oldReadMs = readMs, oldLocatorMs = timing.locatorCpuMs;
    const tried = new Set();
    const attempts = [];
    const attempt = (name, info, index) => attempts.push({ index, shard: name,
      status: info.status === 'missing' ? 'file_missing' : info.invalid.length ? 'invalid_rows' : info.first.has(p) ? 'present' : 'record_missing',
      ...(info.first?.has(p) ? { row: info.first.get(p) } : {}) });
    for (const name of prefix[p.slice(0, 3)] ?? []) {
      tried.add(name);
      const info = inspect(name);
      attempt(name, info, 'prefix');
      if (info.status === 'missing' || info.invalid.length || info.first.has(p)) break;
    }
    // resolveScoreLocator needs the first fallback only if every prefix misses.
    const prefixFinal = [...tried].some(name => { const info = files.get(name); return info.status === 'missing' || info.invalid.length || info.first.has(p); });
    if (!prefixFinal) {
      const name = (declarations.get(p) ?? []).find(s => !tried.has(s));
      if (name) attempt(name, inspect(name), 'area');
    }
    const resolved = resolveScoreLocator(p, { prefix, declarations, files });
    timing.decisionCpuMs += Math.max(0, performance.now() - start - (readMs - oldReadMs) - (timing.locatorCpuMs - oldLocatorMs));
    return { ...resolved, attempts };
  }
  function geometry(p) {
    const key = p.slice(0, 3);
    if (!prefixGeometry.has(key)) prefixGeometry.set(key, geometryIndex(readIndex(`geom/postal-prefix/${key}.json`, true)));
    return resolveGeometryLocator(p, { prefix: prefixGeometry.get(key), full }, name => read(`geom/h3/${name}.json`));
  }
  function inspectAll() {
    for (const name of new Set([...Object.keys(area), ...Object.values(prefix).flat()])) inspect(name);
  }
  async function scan(postals, emit) {
    if (new Set(postals).size !== postals.length || postals.some(p => !postal(p))) throw Error('Scan postals must be distinct six-digit strings');
    const groups = new Map();
    for (const p of postals) {
      reader.checkBudget();
      const locator = locate(p), key = locator.status === 'present' ? locator.shard : null;
      const group = groups.get(key) ?? [];
      group.push({ postal: p, locator }); groups.set(key, group);
    }
    for (const [name, selected] of groups) {
      const scores = name === null ? null : read(`scores/${name}.json`, { cache: false });
      if (scores && scores.status !== 'present') throw Error('Selected score file disappeared: ' + name);
      for (const { postal: p, locator } of selected) {
        reader.checkBudget();
        const score = scores?.value[locator.row] ?? null;
        if (locator.status === 'present' && score?.postal !== p) throw Error('Selected score ordinal changed: ' + p);
        const geomStart = performance.now(), oldReadMs = readMs;
        const located = geometry(p);
        timing.geometryCpuMs.push(Math.max(0, performance.now() - geomStart - (readMs - oldReadMs)));
        const start = performance.now();
        const output = { ...classify({ bundle, postal: p, indexed: declarations.has(p), score, geometry: located.geometry, geometryLookup: located.geometryLookup }),
          scoreLocator: locator, geometryAttempts: located.attempts };
        timing.normalizationMs.push(performance.now() - start);
        reader.checkBudget();
        const outputStart = performance.now();
        await emit(output);
        timing.outputMs.push(performance.now() - outputStart);
        reader.checkBudget();
      }
    }
  }
  return { area, declarations, inspectAll, scan, timing,
    diagnostics: () => ({ declaredPostals: declarations.size, geometryIndexedPostals: Object.keys(full).length,
      scoreFiles: Object.fromEntries([...files].map(([name, info]) => [name, { status: info.status, rows: info.rows, distinct: info.first?.size, duplicates: info.duplicates, invalid: info.invalid, orphans: info.orphans }])) }) };
}
