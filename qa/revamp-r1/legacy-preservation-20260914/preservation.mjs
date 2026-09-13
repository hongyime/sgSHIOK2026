import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const steps = [
  ['local-storage', () => { localStorage.setItem('__qa:reload-preserve', 'local-sentinel'); return localStorage.getItem('__qa:reload-preserve') === 'local-sentinel'; }],
  ['session-storage', () => { sessionStorage.setItem('__qa:reload-preserve', 'session-sentinel'); return sessionStorage.getItem('__qa:reload-preserve') === 'session-sentinel'; }],
  ['cache-open', async () => { await caches.open('qa-unrelated-cache'); return true; }],
  ['cache-put', async () => { await (await caches.open('qa-unrelated-cache')).put('/__qa/preserve', new Response('cache-sentinel')); return true; }],
  ['cache-readback', async () => (await (await (await caches.open('qa-unrelated-cache')).match('/__qa/preserve'))?.text()) === 'cache-sentinel'],
];

export async function preparePreservation({ evaluate, now, remaining, operation, records }) {
  const started = now();
  for (const [name, fn] of steps) {
    const budget = Math.min(10000 - (now() - started), remaining());
    if (budget <= 0) throw new Error('Preservation aggregate deadline');
    operation('preservation:' + name);
    const entry = { name, startedMs: now(), budgetMs: budget, outcome: 'pending' };
    records.push(entry);
    try {
      assert.equal(await evaluate(fn, null, budget), true, 'Preservation ' + name + ' readback');
      if (now() - started >= 10000 || remaining() <= 0) throw new Error('Preservation aggregate deadline');
      Object.assign(entry, { finishedMs: now(), outcome: 'verified' });
    } catch (error) {
      Object.assign(entry, { finishedMs: now(), outcome: 'failed', error: error.message });
      throw error;
    }
  }
}

export function preservedCacheEntry(before, after, { origin, documentSha256, documentBytes }) {
  if (!after || after.cache !== before.cache || after.url !== before.url) return false;
  if (after.sha256 === before.sha256 && after.bytes === before.bytes) return true;
  // The captured old worker uses this one mutable navigation key. Do not relax
  // immutable assets, unrelated cache names, query variants or arbitrary HTML.
  return before.cache === 'sgshiok-static-v1' && before.url === new URL('/', origin).href
    && /^[a-f0-9]{64}$/.test(documentSha256) && Number.isSafeInteger(documentBytes) && documentBytes > 0
    && after.sha256 === documentSha256 && after.bytes === documentBytes;
}

export function validPreservationBaseline(snapshot, origin) {
  if (snapshot?.local?.['__qa:reload-preserve'] !== 'local-sentinel'
      || snapshot?.session?.['__qa:reload-preserve'] !== 'session-sentinel'
      || !Array.isArray(snapshot.entries)) return false;
  const entries = snapshot.entries.filter(e => e.cache === 'qa-unrelated-cache'
    && e.url === new URL('/__qa/preserve', origin).href);
  const bytes = Buffer.from('cache-sentinel');
  return entries.length === 1 && entries[0].bytes === bytes.length
    && entries[0].sha256 === createHash('sha256').update(bytes).digest('hex');
}
