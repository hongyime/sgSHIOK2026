import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoverageEngine, selectPilotPostals } from './engine.mjs';

const present = value => ({ status: 'present', value });
const row = postal => ({ postal, state: 'SCORED' });
function fixture(overrides = {}) {
  const files = {
    'scores/index.json': present({ first: ['000001'], second: ['000002'], third: ['000003'] }),
    'scores/prefix-index.json': present({ '000': ['first', 'second', 'third'] }),
    'geom/postal-index.json': present({ '000001': 'full' }),
    'geom/postal-prefix/000.json': present({ '000001': 'old' }),
    'scores/first.json': present([row('000001')]),
    'scores/second.json': present([row('000002')]),
    'scores/third.json': present([row('000003')]),
    'geom/h3/old.json': present([]),
    'geom/h3/full.json': present([{ postal: '000001', marker: true }]),
    ...overrides,
  };
  const reads = [], budgets = [];
  const reader = { read: path => { reads.push(path); const result = files[path]; if (result instanceof Error) throw result; return result ?? { status: 'missing', value: null }; }, checkBudget: () => budgets.push(1) };
  const engine = createCoverageEngine({ reader, bundle: 'fixture', classify: input => input });
  return { engine, reads, budgets, reader };
}
test('pilot resolves browser winner, falls through geometry, and keeps lookup attempts', async () => {
  const { engine } = fixture();
  const rows = [];
  await engine.scan(['000001'], item => rows.push(item));
  assert.equal(rows[0].scoreLocator.shard, 'first');
  assert.equal(rows[0].geometry.marker, true);
  assert.deepEqual(rows[0].geometryAttempts.map(x => x.status), ['record_missing', 'present']);
});
test('full and pilot choose identical score winners independent of processing order', async () => {
  const collect = async full => { const { engine } = fixture(); if (full) engine.inspectAll(); const rows = []; await engine.scan(['000003', '000001', '000002'], r => rows.push(r)); return rows.map(r => [r.postal, r.scoreLocator]).sort(); };
  assert.deepEqual(await collect(true), await collect(false));
});
test('missing score file is preserved, not rescued from another shard', async () => {
  const { engine } = fixture({ 'scores/first.json': { status: 'missing', value: null } });
  const rows = []; await engine.scan(['000002'], r => rows.push(r));
  assert.equal(rows[0].scoreLocator.status, 'file_missing');
  assert.equal(rows[0].score, null);
});
test('mismatch is fatal without fallback or a fabricated coverage row', async () => {
  const fatal = Object.assign(Error('hash mismatch'), { code: 'STOP_INPUT_MISMATCH' });
  const { engine, reads } = fixture({ 'scores/first.json': fatal });
  let count = 0;
  await assert.rejects(engine.scan(['000001'], () => count++), { code: 'STOP_INPUT_MISMATCH' });
  assert.equal(count, 0);
  assert.ok(!reads.includes('scores/second.json'));
});
test('malformed whole shard is quarantined before claiming a later accessible record', async () => {
  const { engine } = fixture({ 'scores/first.json': present([null, row('000001')]) });
  await assert.rejects(engine.scan(['000001'], () => {}), /Malformed score shard/);
  assert.deepEqual(engine.diagnostics().scoreFiles.first.invalid, [0]);
});
test('duplicates and orphan rows are counted without replacing first row', async () => {
  const { engine } = fixture({ 'scores/first.json': present([row('000001'), row('000001'), row('000099')]) });
  const rows = []; await engine.scan(['000001'], r => rows.push(r));
  assert.equal(rows[0].scoreLocator.row, 0);
  assert.equal(engine.diagnostics().scoreFiles.first.duplicates.length, 1);
  assert.deepEqual(engine.diagnostics().scoreFiles.first.orphans, ['000099']);
});
test('missing geometry prefix index does not mask full index and is cached', async () => {
  const { engine, reads } = fixture({ 'geom/postal-prefix/000.json': { status: 'missing', value: null } });
  const rows = []; await engine.scan(['000001', '000002'], r => rows.push(r));
  assert.equal(rows[0].geometry.marker, true);
  assert.equal(reads.filter(x => x === 'geom/postal-prefix/000.json').length, 1);
});
test('normalization and asynchronous output check cooperative budget', async () => {
  const { engine, budgets } = fixture();
  let resolved = 0;
  await engine.scan(['000001', '000002'], async () => { await Promise.resolve(); resolved++; });
  assert.equal(resolved, 2);
  assert.ok(budgets.length >= 8);
});
for (const path of ['scores/index.json', 'geom/postal-index.json']) {
  test('malformed metadata is not converted to absence: ' + path, () => {
    assert.throws(() => fixture({ [path]: present([]) }), /Malformed/);
  });
}
test('pilot selection is distinct and stratified over shard sizes', () => {
  const ranked = Array.from({ length: 6 }, (_, i) => ({ shard: 's' + i, bytes: i + 1 }));
  const index = Object.fromEntries(ranked.map((r, i) => [r.shard, Array.from({ length: 100 }, (_, j) => String(i * 100 + j).padStart(6, '0'))]));
  const selected = selectPilotPostals(index, ranked, 200);
  assert.equal(selected.postals.length, 200);
  assert.equal(new Set(selected.postals).size, 200);
  assert.deepEqual(selected.strata.map(s => s.shard), ['s0', 's3', 's5']);
  assert.ok(selected.strata.every(s => s.selected > 0));
});
test('pilot never fills with duplicate postals and reports a smaller finite universe', () => {
  const result = selectPilotPostals({ a: ['000001'], b: ['000001', '000002'] }, [{ shard: 'a', bytes: 1 }, { shard: 'b', bytes: 2 }], 200);
  assert.deepEqual([...result.postals].sort(), ['000001', '000002']);
});
test('stale first fallback never rescues a row from a later declaring shard', async () => {
  const { engine, reads } = fixture({
    'scores/index.json': present({ first: ['000001'], second: ['000001'] }),
    'scores/prefix-index.json': present({}),
    'scores/first.json': present([]), 'scores/second.json': present([row('000001')]),
  });
  const rows = []; await engine.scan(['000001'], r => rows.push(r));
  assert.equal(rows[0].scoreLocator.status, 'record_missing');
  assert.ok(!reads.includes('scores/second.json'));
  assert.deepEqual(rows[0].scoreLocator.attempts, [{ index: 'area', shard: 'first', status: 'record_missing' }]);
});
test('ordered score attempts retain prior misses before the current winner', async () => {
  const { engine } = fixture(); const rows = [];
  await engine.scan(['000003'], r => rows.push(r));
  assert.deepEqual(rows[0].scoreLocator.attempts.map(a => [a.shard, a.status]), [['first', 'record_missing'], ['second', 'record_missing'], ['third', 'present']]);
});
test('geometry mismatch never emits an affected postal', async () => {
  const { engine } = fixture({ 'geom/h3/old.json': Object.assign(Error('mismatch'), { code: 'STOP_INPUT_MISMATCH' }) });
  let emitted = 0;
  await assert.rejects(engine.scan(['000001'], () => emitted++), { code: 'STOP_INPUT_MISMATCH' });
  assert.equal(emitted, 0);
});
test('sink rejection prevents further rows and keeps the rejection', async () => {
  const { engine } = fixture(); let emitted = 0;
  await assert.rejects(engine.scan(['000001', '000002'], () => { emitted++; throw Object.assign(Error('sink failure'), { code: 'STOP_SINK' }); }), { code: 'STOP_SINK' });
  assert.equal(emitted, 1);
});
test('budget rejection after first sink prevents the next row', async () => {
  const { engine, reader } = fixture(); let emitted = 0;
  await assert.rejects(engine.scan(['000001', '000002'], () => { emitted++; reader.checkBudget = () => { throw Object.assign(Error('budget deadline'), { code: 'STOP_DEADLINE' }); }; }), { code: 'STOP_DEADLINE' });
  assert.equal(emitted, 1);
});
