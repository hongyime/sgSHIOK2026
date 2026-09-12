import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function responseClocks(entries, sessionId) {
  return entries.filter(e => e.sessionId === sessionId && e.method === 'Network.responseReceived')
    .filter(e => e.params.response.url.includes('/data/')).map(e => {
      const { requestId, timestamp, response } = e.params;
      const t = response.timing;
      const valid = Number.isFinite(timestamp) && Number.isFinite(t?.requestTime)
        && Number.isFinite(t?.receiveHeadersEnd) && t.receiveHeadersEnd >= 0;
      return { requestId, url: response.url, status: response.status,
        headersElapsedMs: valid ? t.receiveHeadersEnd : null,
        responseEventElapsedMs: valid ? (timestamp - t.requestTime) * 1000 : null,
        afterHeadersToResponseEventMs: valid ? (timestamp - t.requestTime) * 1000 - t.receiveHeadersEnd : null };
    });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = resolve('C:/sgSHIOK2026/qa/revamp-r1/worker-lifecycle-20260912/observed-Btxfds/browser.json');
  const bytes = readFileSync(source), report = JSON.parse(bytes);
  console.log(JSON.stringify({ source, sha256: createHash('sha256').update(bytes).digest('hex'),
    rows: responseClocks(report.entries, report.mainSession),
    limitations: ['Headers elapsed is not pure server execution: it includes connection/send/wait work.',
      'Response-event delay is not attributed to CPU, parsing, network, or a particular process.',
      'Intervals overlap; do not sum them into page latency or projected savings.',
      'Worker was paused for session attachment. This is not the T02 cold/warm performance profile.'],
    FINDINGS: ['Three essential compressed probes return 404 before their plain requests; one optional compressed-only transit probe returns 404.',
      'Header timing and response-event timing differ materially. Response-event duration cannot be labeled server duration.'],
    DISAGREEMENTS: ['No performance improvement or dominant bottleneck is established by this trace.'],
    nextAction: 'Use an unpaused cold/warm profile with host sampling and stage timestamps before selecting a performance edit.' }, null, 2));
}
