import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const path = 'qa/p19/universe_gap_measurement_summary_v2.json';
const bytes = readFileSync(resolve(root, path)), source = JSON.parse(bytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const hdb = source.hdb_2021_2026_geocoded, mcst = source.mcst_2021_2026, osm = source.overpass_addr_postcode;
if (hdb.missing_postals.length !== 6 || mcst.missing_postals.length !== 2 || osm.sample_missing_from_v1.length !== 20
  || hdb.rows !== 749 || hdb.rows_with_postal !== 743) throw Error('Historical source-signal shape changed; inspect before claiming counts');
const report = {
  source: { path, sha256: hash(bytes), bytes: bytes.length, capturedAt: source.generated_at_utc },
  scope: 'Existing dated source comparison, not a new national address inventory or live query',
  comparedUniverse: source.v1_universe,
  hdb: { classification: 'absent_in_compared_universe', postals: hdb.missing_postals, rowsWithPostal: hdb.rows_with_postal,
    rowsWithoutReturnedPostal: hdb.rows - hdb.rows_with_postal, arithmetic: '749 - 743 = 6 rows without returned postal; 6 / 743 rows with postal missing from compared universe' },
  mcst: { classification: 'unverified_source_discrepancies_not_confirmed_missing_addresses', postals: mcst.missing_postals },
  osm: { classification: 'non_authoritative_source_only_signals', postals: osm.sample_missing_from_v1 },
  limits: source.method_limits,
  arithmetic: '6 HDB + 2 unverified MCST + 20 OSM = 28 source signals, NOT 28 confirmed missing valid addresses. Do not add these to the published coverage denominator.',
  coordinateGapSeparation: 'The 476 NEEDS_GEOCODE entries are present in the compared universe; they are not the missing-address source signals.',
};
if (hash(readFileSync(resolve(root, path))) !== report.source.sha256) throw Error('STOP_INPUT_MISMATCH historical source changed during read');
writeFileSync(resolve(root, 'qa/revamp-r1/coverage-register-20260909/source-signals.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
