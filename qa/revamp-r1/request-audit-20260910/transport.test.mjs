import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isOneMapTile, summarizeTransport } from './transport.mjs';
const url = 'https://www.onemap.gov.sg/maps/tiles/Grey_HD/14/12936/8150.png';
const event = (method, params) => ({ kind: 'event', method, params });
function fixture(canceled = true) {
  const request = { url, method: 'GET' };
  const entries = [event('Network.requestWillBeSent', { requestId: 'n1', request }),
    event('Fetch.requestPaused', { requestId: 'f1', networkId: 'n1', request: { ...request } }),
    { kind: 'send', id: 1, method: 'Fetch.continueRequest', params: { requestId: 'f1' } },
    { kind: 'reply', id: 1, fetchCommand: true, ...(canceled ? { error: { kind: 'cdp', code: -32602, message: 'Invalid InterceptionId.' } } : {}) }];
  if (canceled) entries.push(event('Network.loadingFailed', { requestId: 'n1', canceled: true, errorText: 'net::ERR_ABORTED' }));
  else entries.push(event('Network.loadingFinished', { requestId: 'n1' }));
  return structuredClone(entries);
}
test('ordinary completed request succeeds without relabeling any command', () => {
  const result = summarizeTransport(fixture(false));
  assert.equal(result.ok, true); assert.equal(result.explainedCanceledTileCommands.length, 0);
});
test('exact Fetch/Network identities explain a canceled tile, preserving the raw fault', () => {
  const entries = fixture(), before = structuredClone(entries), result = summarizeTransport(entries);
  assert.equal(result.ok, true); assert.equal(result.explainedCanceledTileCommands.length, 1);
  assert.equal(result.explainedCanceledTileCommands[0].cancellation.networkId, 'n1');
  assert.equal(result.explainedCanceledTileCommands[0].reply.error.message, 'Invalid InterceptionId.');
  assert.deepEqual(entries, before);
});
test('cancellation arriving before the command reply still joins by identity', () => {
  const entries = fixture(); [entries[3], entries[4]] = [entries[4], entries[3]];
  assert.equal(summarizeTransport(entries).ok, true);
});
const unsafe = [
  ['missing network ID', e => { delete e[1].params.networkId; }],
  ['different network ID', e => { e[1].params.networkId = 'n2'; }],
  ['different URL', e => { e[1].params.request.url = url.replace('8150', '8151'); }],
  ['POST', e => { e[0].params.request.method = e[1].params.request.method = 'POST'; }],
  ['not canceled', e => { e[4].params.canceled = false; }],
  ['missing canceled flag', e => { delete e[4].params.canceled; }],
  ['DNS failure', e => { e[4].params.errorText = 'net::ERR_NAME_NOT_RESOLVED'; }],
  ['CSP block', e => { e[4].params.blockedReason = 'csp'; }],
  ['CORS failure', e => { e[4].params.corsErrorStatus = { corsError: 'DisallowedByMode' }; }],
  ['redirect', e => { e[0].params.redirectResponse = { status: 302 }; }],
  ['redirected pause', e => { e[1].params.redirectedRequestId = 'f0'; }],
  ['response-stage pause', e => { e[1].params.responseStatusCode = 200; }],
  ['response-stage error', e => { e[1].params.responseErrorReason = 'Aborted'; }],
  ['local geometry cancellation', e => { e[0].params.request.url = e[1].params.request.url = 'http://127.0.0.1:4354/data/geom/h3/x.json'; }],
  ['other command error', e => { e[3].error.message = 'Could not find object'; }],
  ['different protocol code', e => { e[3].error.code = -32000; }],
  ['timeout is not a protocol cancellation', e => { e[3].error.kind = 'timeout'; }],
  ['fulfill failure is not dismissed', e => { e[2].method = 'Fetch.fulfillRequest'; }],
  ['fail failure is not dismissed', e => { e[2].method = 'Fetch.failRequest'; }],
  ['duplicate request identity', e => { e.push(structuredClone(e[0])); }],
  ['duplicate pause identity', e => { e.push(structuredClone(e[1])); }],
  ['duplicate command', e => { e.push({ ...structuredClone(e[2]), id: 2 }, { kind: 'reply', id: 2, fetchCommand: true }); }],
  ['duplicate reply', e => { e.push(structuredClone(e[3])); }],
  ['contradictory completion', e => { e.push(event('Network.loadingFinished', { requestId: 'n1' })); }],
  ['HTTP failure', e => { e.push(event('Network.responseReceived', { requestId: 'n1', response: { url, status: 503 } })); }],
];
for (const [name, change] of unsafe) test(name + ' remains a failed audit', () => {
  const entries = fixture(); change(entries); const result = summarizeTransport(entries);
  assert.equal(result.ok, false); assert.equal(result.explainedCanceledTileCommands.length, 0);
});
test('a successful continue does not hide a DNS failure', () => {
  const entries = fixture(); delete entries[3].error; entries[4].params.canceled = false;
  entries[4].params.errorText = 'net::ERR_NAME_NOT_RESOLVED';
  assert.equal(summarizeTransport(entries).networkFailures.length, 1);
});
test('a held pause and an outstanding command remain unresolved', () => {
  assert.equal(summarizeTransport(fixture().slice(0, 2)).unfinishedPauses.length, 1);
  assert.equal(summarizeTransport(fixture().slice(0, 3)).pendingCommands.length, 1);
});
test('a protocol reply without a recorded command remains an error', () => {
  const entries = fixture(false); entries.push({ kind: 'reply', id: 99, fetchCommand: true });
  assert.equal(summarizeTransport(entries).orphanReplies.length, 1);
});
test('runtime exceptions and connection loss cannot be classified away', () => {
  for (const extra of [event('Runtime.exceptionThrown', { exceptionDetails: { text: 'real failure' } }), { kind: 'connectionFault', message: 'closed' }]) {
    assert.equal(summarizeTransport([...fixture(false), extra]).ok, false);
  }
});
test('empty telemetry is not a clean transport audit', () => assert.equal(summarizeTransport([]).ok, false));
test('an accepted continue without a terminal network event remains incomplete', () => {
  const result = summarizeTransport(fixture(false).slice(0, 4));
  assert.equal(result.ok, false);
  assert.equal(result.pendingNetworkRequests.length, 1);
});
test('tile allowlist does not accept lookalike hosts, credentials, query strings or local resources', () => {
  assert.equal(isOneMapTile(url), true);
  for (const value of [url + '?x=1', url + '#x', url.replace('.gov.sg', '.gov.sg.evil'), url.replace('https://', 'https://x@'), 'not a URL']) {
    assert.equal(isOneMapTile(value), false);
  }
});
test('real diagnostic trace explains16 cancellations but retains4 HTTP failures and5 incomplete requests', () => {
  const receipt = JSON.parse(readFileSync(new URL('./cancellation-2-mX2Gjr/browser.json', import.meta.url)));
  const audit = summarizeTransport(receipt.entries);
  assert.equal(audit.ok, false);
  assert.equal(audit.explainedCanceledTileCommands.length, 16);
  assert.equal(audit.httpFailures.length, 4);
  assert.equal(audit.pendingNetworkRequests.length, 5);
  assert.equal(audit.commandFailures.length, 0);
  assert.deepEqual(audit, receipt.transport);
});
