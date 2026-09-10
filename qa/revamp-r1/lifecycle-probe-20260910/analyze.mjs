import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Confirm observed worker request handoff only with explicit target/session ownership. */
export function workerEntryHandoffs(entries) {
  const events = method => entries.filter(e => e.kind === 'event' && e.method === method);
  const requests = events('Network.requestWillBeSent'), attachments = events('Target.attachedToTarget');
  const terminals = [...events('Network.loadingFinished'), ...events('Network.loadingFailed')];
  const responses = events('Network.responseReceived');
  const one = values => values.length === 1 ? values[0] : null;
  const confirmed = [], unresolved = [];
  for (const request of requests.filter(e => e.params.type === 'Script' && e.sessionId
    && !terminals.some(t => t.sessionId === e.sessionId && t.params.requestId === e.params.requestId))) {
    const parent = one(attachments.filter(e => e.params.sessionId === request.sessionId && e.params.targetInfo.type === 'page'));
    const child = one(attachments.filter(e => e.sessionId === request.sessionId && e.params.targetInfo.type === 'worker'
      && e.params.targetInfo.targetId === request.params.requestId && e.params.targetInfo.url === request.params.request.url));
    const ownerValid = parent && child && request.params.request.method === 'GET'
      && child.params.targetInfo.parentId === parent.params.targetInfo.targetId
      && child.params.sessionId && child.params.sessionId !== request.sessionId
      && child.sequence > request.sequence
      && requests.filter(e => e.sessionId === request.sessionId && e.params.requestId === request.params.requestId).length === 1;
    const response = ownerValid && one(responses.filter(e => e.sessionId === child.params.sessionId && e.params.requestId === request.params.requestId));
    const terminal = ownerValid && one(terminals.filter(e => e.sessionId === child.params.sessionId && e.params.requestId === request.params.requestId));
    if (!response || !terminal || response.params.response.url !== request.params.request.url
      || response.params.response.status < 200 || response.params.response.status >= 300
      || terminal.method !== 'Network.loadingFinished' || response.sequence <= child.sequence || terminal.sequence <= response.sequence) {
      unresolved.push({ request, reason: 'missing_or_ambiguous_worker_handoff' }); continue;
    }
    confirmed.push({ request, attachment: child, response, terminal });
  }
  return { confirmed, unresolved };
}

export function inspectLifecycle(report) {
  const names = ['retained', 'drained-or-canceled', 'ignored-now-drained'];
  const phases = names.map(name => report.phases.find(p => p.name === name));
  if (phases.some(p => !p)) throw Error('Missing body observation phase');
  const bodies = phases[0].requests.map(item => {
    const states = phases.map(p => p.requests.find(r => r.path === item.path)?.states);
    if (states.some(s => s?.length !== 1)) throw Error('Ambiguous body request');
    const [first, middle, last] = states.map(s => s[0]);
    if ([middle, last].some(s => s.requestId !== first.requestId || s.sessionId !== first.sessionId)) throw Error('Body identity changed between phases');
    const response = first.responses[0], terminal = last.terminal[0];
    return { path: item.path, requestId: first.requestId, sessionId: first.sessionId,
      terminalCounts: states.map(s => s[0].terminal.length), terminalMethod: terminal?.method,
      responseNotifiedAtMs: response?.timeMs, terminalNotifiedAtMs: terminal?.timeMs,
      responseTimestamp: response?.params.timestamp, terminalTimestamp: terminal?.params.timestamp,
      terminalTimestampPredatesResponseNotificationTimestamp: !!terminal && terminal.params.timestamp < response.params.timestamp };
  });
  return { bodies, workers: workerEntryHandoffs(report.entries) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/lifecycle-probe-20260910';
  if (process.cwd() !== root) throw Error('Wrong root');
  const report = JSON.parse(readFileSync(resolve(root, folder, 'lifecycle-2-qhnLlG/browser.json')));
  const analysis = inspectLifecycle(report);
  writeFileSync(resolve(root, folder, 'analysis.json'), JSON.stringify(analysis, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(analysis, null, 2));
}
