import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { profileCases } from './cases.mjs';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/normalization-profile-20260910';
assert.equal(process.cwd(), root);
const compile = process.env.SHIOK_MATCHER_COMPILE; assert.match(compile ?? '', /^compile-[a-z0-9-]+$/);
const require = createRequire(import.meta.url), old = 'qa/revamp-r1/coverage-register-20260909/compile-3';
for (const dir of [old, folder + '/' + compile]) {
  const receipt = JSON.parse(readFileSync(resolve(root, dir, 'compile.json')));
  assert.equal(receipt.exitCode, 0); assert.equal(receipt.sourcesStable, true);
  for (const item of receipt.compiled) assert.equal(createHash('sha256').update(readFileSync(resolve(root, dir, 'compiled', item.name))).digest('hex'), item.sha256);
}
const baseline = require(resolve(root, old, 'compiled/published-transit-options.js'));
const current = require(resolve(root, folder, compile, 'compiled/published-transit-options.js'));
const baselineCoverage = require(resolve(root, old, 'compiled/coverage-gap-register.js'));
const currentCoverage = require(resolve(root, folder, compile, 'compiled/coverage-gap-register.js'));
const { encodePolyline: encode } = require(resolve(root, old, 'compiled/polyline.js'));
const fixture = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-options.json')));
const cases = profileCases(fixture, encode);
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } }
function compare(input) {
  const before = structuredClone(input); freeze(input);
  for (const category of ['bus', 'mrt_lrt']) {
    const context = { bundle: input.bundle, postal: input.postal };
    const item = { ...input, category, scoreContext: context, geometryContext: context };
    assert.deepEqual(current.normalizePublishedTransitOptions(item), baseline.normalizePublishedTransitOptions(item));
  }
  assert.deepEqual(currentCoverage.coverageGapRow(input), baselineCoverage.coverageGapRow(input));
  assert.deepEqual(input, before);
}
for (const item of cases) test('complete normalized and reduced surfaces agree: ' + item.name, () => compare(item.input));
for (const mutation of ['reverse', 'incomplete', 'duplicate', 'foreign', 'bridge', 'skipped', 'bad-length', 'bad-line', 'bad-base', 'bad-fragment', 'repeated-edge']) {
  test('source diagnostic and rendering decisions agree: ' + mutation, () => {
    const input = structuredClone(cases.find(p => p.name === 'synthetic-64-edge-segments').input);
    const detail = input.geometry.candidates['bus:03509'], segments = detail.route_segments.sheltered;
    if (mutation === 'reverse') segments.reverse();
    if (mutation === 'incomplete') segments.pop();
    if (mutation === 'duplicate') segments.push(structuredClone(segments[0]));
    if (mutation === 'foreign') segments[0].geom = encode([[2, 105], [2.1, 105.1]]);
    if (mutation === 'bridge') { detail.sheltered_parts = [encode([[1.3, 103.8], [1.30001, 103.80001]]), encode([[1.30002, 103.80002], [1.30003, 103.80003]])]; }
    if (mutation === 'skipped') segments[0].geom = encode([[1.3, 103.8], [1.30002, 103.80002]]);
    if (mutation === 'bad-length') segments[0].len_m = -1;
    if (mutation === 'bad-line') segments[0].geom = '_';
    if (mutation === 'bad-base') detail.sheltered_parts = [detail.sheltered, '_'];
    if (mutation === 'bad-fragment') detail.exposure_gaps = [{ geom: encode([[2, 105], [2.1, 105.1]]), len_m: 1 }];
    if (mutation === 'repeated-edge') {
      const a = [1.3, 103.8], b = [1.30001, 103.80001], c = [1.30002, 103.80002];
      detail.sheltered = encode([a, b, a, b, c]);
      detail.route_segments.sheltered = [[a, b], [a, b, a], [b, c]].map(points => ({ geom: encode(points), len_m: 1, is_covered: true }));
      detail.exposure_gaps = [{ geom: encode([a, b, c]), len_m: 1 }];
    }
    compare(input);
  });
}
