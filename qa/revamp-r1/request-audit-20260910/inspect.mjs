import assert from 'node:assert/strict';
import { readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/request-audit-20260910';
assert.equal(process.cwd(), root);
const receipt = JSON.parse(readFileSync(resolve(root, folder, 'cancellation-2-mX2Gjr/browser.json')));
function size(path) { const absolute = resolve(root, path); return existsSync(absolute) ? statSync(absolute).size : null; }
const failures = receipt.transport.httpFailures.map(event => {
  const url = event.params.response.url, path = new URL(url).pathname;
  assert.ok(path.startsWith('/data/generated_20260805_prefer_scored_routed/') && /^[/\w.-]+$/.test(path) && !path.includes('..'));
  const source = 'web/public' + path, plainUrl = url.replace(/\.gz$/, '');
  const plainResponses = receipt.entries.filter(e => e.method === 'Network.responseReceived' && e.params.response.url === plainUrl);
  return { url, status: event.params.response.status, localPath: source, localBytes: size(source),
    plainPath: source.replace(/\.gz$/, ''), plainBytes: size(source.replace(/\.gz$/, '')),
    plainResponses: plainResponses.map(e => ({ ...e.params, finished: receipt.entries.some(f => f.method === 'Network.loadingFinished' && f.params.requestId === e.params.requestId) })) };
});
const sourcePath = 'web/lib/data.ts', source = readFileSync(resolve(root, sourcePath));
const lines = source.toString().split('\n');
const report = { failures, source: { path: sourcePath, sha256: createHash('sha256').update(source).digest('hex'),
  excerpts: [[170, 208], [492, 523]].map(([start, end]) => ({ start, end, text: lines.slice(start - 1, end).join('\n') })) },
  conclusions: [
    'Three failed gzip requests have successful, completed plain-JSON counterparts in the same page trace. fetchJson explicitly permits plain fallback for non-compressed-only artifacts after gzip404.',
    'Transit h3 is compressed-only; fetchTransitPoiShard catches its rejection and returns null. A missing optional shard is not by itself proof that the selected route failed.',
    'The four404 response bodies have no terminal Network event in this page receipt. Their bodies are neither consumed nor explicitly canceled in the shown non-success code branches; causation of the missing events remains unproven.',
    'The worker request also lacks a terminal page Network event, despite a drawn route. Worker-target attachment is not captured by this harness; do not describe this as proof of a broken worker.',
    'The transport audit intentionally remains failed. Do not suppress all404s, treat absent worker telemetry as completion, or change preserved payloads to make it pass.',
  ] };
writeFileSync(resolve(root, folder, 'inspection.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
