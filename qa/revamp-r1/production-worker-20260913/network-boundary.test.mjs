import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer, request } from 'node:http';
import { connect } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { gzipSync } from 'node:zlib';
import test from 'node:test';
import { DATA_PREFIX, startBoundary } from './network-boundary.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const HTML = Buffer.from('<!doctype html><title>Offline fixture</title><p>Inert fixture.</p>');
const assetBytes = Buffer.from('inert captured bytes\n');

async function boundary(t, options = {}) {
  const value = await startBoundary({
    html: HTML,
    htmlHeaders: { 'content-type': 'text/html; charset=utf-8' },
    assets: new Map([['/captured.txt', {
      bytes: assetBytes, sha256: sha(assetBytes), headers: { 'content-type': 'text/plain' },
    }]]),
    observed404: new Set(['/observed.txt']),
    readData: async () => ({ status: 200, bytes: Buffer.from('{"fixture":true}'), headers: {} }),
    ...options,
    limits: { wallMs: 5000, ...options.limits },
  });
  t.after(async () => {
    await value.close();
    assert.equal(value.stats.closed, true);
    assert.equal(value.stats.activeSockets, 0);
    assert.equal(value.stats.activeReads, 0);
    assert.equal(value.stats.activeResponses, 0);
  });
  return value;
}

function get(origin, path = '/', { method = 'GET', headers = {} } = {}) {
  const url = new URL(origin);
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: url.port, path, method, headers, agent: false }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, bytes: Buffer.concat(chunks) }));
    });
    req.setTimeout(2500, () => req.destroy(new Error('local fixture timeout')));
    req.on('error', reject);
    req.end();
  });
}

function raw(origin, message) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: '127.0.0.1', port: Number(new URL(origin).port) });
    const chunks = [];
    socket.setTimeout(2500, () => socket.destroy(new Error('raw fixture timeout')));
    socket.on('connect', () => socket.write(message));
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('close', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function until(check) {
  const end = Date.now() + 2000;
  while (!check()) {
    if (Date.now() > end) assert.fail('Timed out waiting for local boundary state');
    await delay(5);
  }
}

test('serves identical HTML and exact captured assets with bounded, private receipts', async (t) => {
  const b = await boundary(t, {
    htmlHeaders: {
      'Content-Type': 'text/html; charset=utf-8', 'Content-Length': '1',
      'Content-Encoding': 'gzip',
      'Set-Cookie': 'private-response-cookie', Authorization: 'private-response-auth',
      Location: 'http://never-resolve.invalid/', Refresh: '0; url=http://never-resolve.invalid/',
      'Alt-Svc': 'h3=":443"', 'Transfer-Encoding': 'chunked',
    },
  });
  assert.match(b.origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const root = await get(b.origin, '/', { headers: {
    cookie: 'private-request-cookie', authorization: 'private-request-auth', 'sec-fetch-dest': 'document',
  } });
  assert.deepEqual(root.bytes, HTML);
  assert.equal(root.headers['content-length'], String(HTML.length));
  for (const name of ['set-cookie', 'authorization', 'location', 'refresh', 'alt-svc', 'transfer-encoding', 'content-encoding']) {
    assert.equal(root.headers[name], undefined);
  }
  const asset = await get(b.origin, '/captured.txt', { headers: { 'sec-fetch-dest': 'worker' } });
  assert.deepEqual(asset.bytes, assetBytes);
  const [htmlReceipt, assetReceipt] = b.requests;
  assert.equal(htmlReceipt.sha256, sha(HTML));
  assert.equal(htmlReceipt.sourceKind, 'html');
  assert.equal(htmlReceipt.secFetchDest, 'document');
  assert.equal(assetReceipt.sha256, sha(assetBytes));
  assert.equal(assetReceipt.secFetchDest, 'worker');
  assert.equal(assetReceipt.sourceKind, 'asset');
  assert.equal(assetReceipt.disposition, 'served');
  assert.ok(Date.parse(assetReceipt.startedAt) <= Date.parse(assetReceipt.finishedAt));
  assert.doesNotMatch(JSON.stringify(b.requests), /private-|headers|never-resolve/);
  assert.equal(b.stats.responseBytes, HTML.length + assetBytes.length);
});

test('HEAD preserves representation length without sending or charging a body', async (t) => {
  const b = await boundary(t, { limits: { maxResponseBytes: 1 } });
  for (const path of ['/', '/captured.txt', `${DATA_PREFIX}fixture.json`, '/observed.txt', '/missing.txt']) {
    const result = await get(b.origin, path, { method: 'HEAD' });
    assert.equal(result.bytes.length, 0);
    assert.ok(Number(result.headers['content-length']) > 0);
  }
  assert.equal(b.stats.responseBytes, 0);
  assert.ok(b.requests.every((entry) => entry.bodyBytes === 0 && entry.sha256 === sha(Buffer.alloc(0))));
});

test('absolute-form requests serve only the boundary own origin; never forward', async (t) => {
  let trapRequests = 0;
  const trap = createServer((_req, res) => { trapRequests += 1; res.end('must not be reached'); });
  await new Promise((resolve) => trap.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => trap.close(resolve)));
  const b = await boundary(t);
  assert.deepEqual((await get(b.origin, `${b.origin}/`)).bytes, HTML);
  assert.deepEqual((await get(b.origin, `${b.origin}/captured.txt`)).bytes, assetBytes);
  const spyOrigin = `http://127.0.0.1:${trap.address().port}`;
  for (const origin of ['http://external.invalid', spyOrigin]) {
    assert.equal((await get(b.origin, `${origin}/worker-canary`)).status, 403);
  }
  assert.match(await raw(b.origin,
    'CONNECT external.invalid:443 HTTP/1.1\r\nHost: external.invalid:443\r\n\r\n'), /^HTTP\/1\.1 403 /);
  const canaries = [
    b.requests.find((r) => r.event === 'request' && r.authority === 'external.invalid'),
    b.requests.find((r) => r.event === 'connect' && r.authority === 'external.invalid:443'),
    b.requests.find((r) => r.event === 'request' && r.authority === new URL(spyOrigin).host),
  ];
  assert.equal(new Set(canaries.map((r) => r.id)).size, 3);
  assert.ok(canaries.every((r) => r.completed && r.status === 403 && r.disposition === 'blocked'));
  for (const target of [
    `http://127.0.0.1:${trap.address().port}/captured.txt`,
    'http://never-resolve.invalid/captured.txt', 'https://never-resolve.invalid/',
    `https://${new URL(b.origin).host}/`, `http://user:private-password@${new URL(b.origin).host}/`,
    `http://localhost:${new URL(b.origin).port}/`, 'ftp://never-resolve.invalid/a',
  ]) {
    assert.equal((await get(b.origin, target)).status, 403, target);
  }
  assert.equal(trapRequests, 0);
  assert.equal((await get(b.origin, 'http://external.invalid/', { method: 'POST' })).status, 403);
  assert.equal((await get(b.origin, '/', { headers: { host: 'never-resolve.invalid' } })).status, 403);
  assert.doesNotMatch(JSON.stringify(b.requests), /private-password/);
});

test('root query serves unchanged HTML, but asset and data queries are blocked and not logged', async (t) => {
  const b = await boundary(t);
  for (const path of ['/?postal=018956&debugMap=1', `${b.origin}/?postal=018956&debugMap=1`,
    '/?debugMap=1&postal=018956', '/?postal=018956', '/?debugMap=1']) {
    assert.deepEqual((await get(b.origin, path)).bytes, HTML);
  }
  for (const path of ['/captured.txt?private-query', `${DATA_PREFIX}fixture.json?private-query`]) {
    assert.equal((await get(b.origin, path)).status, 403);
  }
  for (const query of ['', 'postal=12345', 'postal=1234567', 'postal=abcdef', 'debugMap=0',
    'debugMap=true', 'debugMap=1&debugMap=1', 'postal=018956&postal=018956',
    'postal=018956&unknown=private-query', 'unknown=private-query', 'postal=%3018956',
    '%70ostal=018956', 'postal=018956&', 'postal=018956&&debugMap=1', 'postal=018956#fragment']) {
    assert.equal((await get(b.origin, `/?${query}`)).status, 403, query);
  }
  assert.doesNotMatch(JSON.stringify(b.requests), /018956|debugMap|private-query/);
});

test('decoded assets strip encoding while raw data preserves encoding with exact wire hashes', async (t) => {
  const wire = gzipSync(Buffer.from('{"fixture":true}'));
  const b = await boundary(t, {
    assets: new Map([['/decoded.txt', { bytes: assetBytes, sha256: sha(assetBytes), headers: {
      'content-encoding': 'gzip', 'content-length': '999', 'content-type': 'text/plain',
    } }]]),
    readData: async () => ({ status: 200, bytes: wire, headers: {
      'content-encoding': 'gzip', 'content-length': '999', 'transfer-encoding': 'chunked',
      'content-type': 'application/json',
    } }),
  });
  const decoded = await get(b.origin, '/decoded.txt');
  assert.equal(decoded.headers['content-encoding'], undefined);
  assert.deepEqual(decoded.bytes, assetBytes);
  const data = await get(b.origin, `${DATA_PREFIX}fixture.json`);
  assert.equal(data.headers['content-encoding'], 'gzip');
  assert.equal(data.headers['content-length'], String(wire.length));
  assert.equal(data.headers['transfer-encoding'], undefined);
  assert.deepEqual(data.bytes, wire);
  assert.equal(b.requests.at(-1).sha256, sha(wire));
});

test('observed 404 and uncaptured synthetic 503 cannot be mistaken for each other', async (t) => {
  const b = await boundary(t);
  const missing = await get(b.origin, '/observed.txt');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers['x-capture-boundary'], 'observed404');
  assert.match(missing.bytes.toString(), /^capture-boundary:observed404:/);
  for (const path of ['/missing.txt', '/captured.txt/child', '/Captured.txt', '/favicon.ico']) {
    const unknown = await get(b.origin, path);
    assert.equal(unknown.status, 503);
    assert.equal(unknown.headers['x-capture-boundary'], 'uncaptured');
    assert.match(unknown.bytes.toString(), /^capture-boundary:uncaptured:/);
  }
  assert.equal(b.requests[0].disposition, 'observed404');
  assert.ok(b.requests.slice(1).every((entry) => entry.disposition === 'uncaptured'));
});

test('only exact safe data-prefix paths reach the data reader', async (t) => {
  const seen = [];
  const b = await boundary(t, { readData: async (path, signal) => {
    seen.push(path);
    assert.equal(signal.aborted, false);
    return { status: 200, bytes: Buffer.from('data fixture'), headers: { 'content-type': 'application/json' } };
  } });
  const safe = `${DATA_PREFIX}nested/fixture-1.json`;
  assert.equal((await get(b.origin, safe)).status, 200);
  const receipt = b.requests[0];
  assert.equal(receipt.isData, true);
  assert.equal(receipt.sourceKind, 'data');
  assert.equal(receipt.sha256, sha(Buffer.from('data fixture')));
  for (const path of [
    '/data/', '/data/generated_20260805_prefer_scored_routed-other/a.json',
    '/data/generated_20260805_prefer_scored_routed', '/arbitrary/data.json',
  ]) assert.equal((await get(b.origin, path)).status, 503);
  for (const path of [
    DATA_PREFIX, `${DATA_PREFIX}a.json?token=private-query`, `${DATA_PREFIX}a.json?`,
    `${DATA_PREFIX}../secret`, `${DATA_PREFIX}%2e%2e/secret`, `${DATA_PREFIX}.%2e/secret`,
    `${DATA_PREFIX}%252e%252e/secret`, `${DATA_PREFIX}nested%2fsecret`,
    `${DATA_PREFIX}nested%5csecret`, `${DATA_PREFIX}nested\\secret`, `${DATA_PREFIX}a%00.json`,
    `${DATA_PREFIX}a%0a.json`, `${DATA_PREFIX}a%ZZ.json`, `${DATA_PREFIX}a%FF.json`,
    `${DATA_PREFIX}a.json#fragment`, `${DATA_PREFIX}nested//a.json`, `${DATA_PREFIX}./a.json`,
    `${DATA_PREFIX}a.json:stream`, `${DATA_PREFIX}%61.json`, `${DATA_PREFIX}a;ignored.json`,
    '/data/%67enerated_20260805_prefer_scored_routed/a.json',
    '/%2e/', '//never-resolve.invalid/',
  ]) {
    const result = await get(b.origin, path);
    assert.ok(result.status === 403 || result.status === 503, path);
  }
  assert.deepEqual(seen, [safe]);
  assert.doesNotMatch(JSON.stringify(b.requests), /private-query|fragment/);
});

test('raw absolute traversal is rejected before normalization', async (t) => {
  let reads = 0;
  const b = await boundary(t, { readData: async () => { reads += 1; throw new Error('unexpected'); } });
  for (const path of ['/x/../', '/x/%2e%2e/captured.txt', `${DATA_PREFIX}../../captured.txt`]) {
    assert.equal((await get(b.origin, `${b.origin}${path}`)).status, 403);
  }
  assert.equal(reads, 0);
});

test('POST, CONNECT, upgrades, expectations, and malformed requests are captured and blocked', async (t) => {
  let reads = 0;
  const b = await boundary(t, { readData: async () => { reads += 1; throw new Error('unexpected'); } });
  const host = new URL(b.origin).host;
  assert.equal((await get(b.origin, `${DATA_PREFIX}a.json`, { method: 'POST' })).status, 405);
  for (const target of ['never-resolve.invalid:443', host]) {
    const reply = await raw(b.origin, `CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`);
    assert.match(reply, /^HTTP\/1\.1 403 /);
  }
  const upgrade = await raw(b.origin,
    `GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n`);
  assert.match(upgrade, /^HTTP\/1\.1 403 /);
  const expectation = await raw(b.origin,
    `GET / HTTP/1.1\r\nHost: ${host}\r\nExpect: 100-continue\r\nContent-Length: 4\r\n\r\n`);
  assert.match(expectation, /^HTTP\/1\.1 403 /);
  assert.doesNotMatch(expectation, /100 Continue/);
  const malformed = await raw(b.origin, 'G@T / HTTP/1.1\r\nHost: localhost\r\n\r\n');
  assert.match(malformed, /^HTTP\/1\.1 400 /);
  assert.equal(b.stats.requestCount, 6);
  assert.equal(b.stats.connectRequests, 2);
  assert.equal(b.stats.upgradeRequests, 1);
  assert.equal(b.stats.clientErrors, 1);
  assert.equal(reads, 0);
  assert.ok(b.requests.every((entry) => entry.disposition === 'blocked' && entry.sha256));
  assert.equal(b.requests.at(-1).method, null);
  assert.equal(b.requests.at(-1).path, null);
});

test('request bodies, duplicate hosts, and header overflows cannot bypass admission', async (t) => {
  const b = await boundary(t);
  const host = new URL(b.origin).host;
  for (const headers of [
    'Content-Length: 4\r\n', 'Transfer-Encoding: chunked\r\n',
    'Expect: fixture\r\n', 'Host: never-resolve.invalid\r\n',
  ]) {
    const reply = await raw(b.origin, `GET / HTTP/1.1\r\nHost: ${host}\r\n${headers}\r\n`);
    assert.match(reply, /^HTTP\/1\.1 (403|400) /);
  }
  const overflow = await raw(b.origin,
    `GET / HTTP/1.1\r\nHost: ${host}\r\nCookie: ${'x'.repeat(20_000)}\r\n\r\n`);
  assert.match(overflow, /^HTTP\/1\.1 400 /);
  assert.ok(b.stats.clientErrors >= 1);
  assert.ok(b.requests.every((entry) => entry.disposition === 'blocked'));
});

test('receipt fields and arrays are bounded, including rejected requests', async (t) => {
  const b = await boundary(t, { limits: { maxRequests: 2 } });
  await get(b.origin, `/${'x'.repeat(3000)}?private-query`, {
    headers: { 'sec-fetch-dest': 'w'.repeat(1000) },
  });
  assert.equal(b.requests[0].path.length, 512);
  assert.equal(b.requests[0].pathTruncated, true);
  assert.equal(b.requests[0].secFetchDest.length, 64);
  await get(b.origin, '/');
  await assert.rejects(get(b.origin, '/'));
  await b.close();
  assert.equal(b.stats.closeReason, 'request-limit');
  assert.equal(b.stats.requestCount, 3);
  assert.equal(b.requests.length, 2);
  assert.equal(b.stats.receiptsDropped, 1);
  assert.doesNotMatch(JSON.stringify(b.requests), /private-query/);
});

test('CONNECT and parser errors share the request cap and trigger cleanup', async (t) => {
  const b = await boundary(t, { limits: { maxRequests: 2 } });
  await raw(b.origin, 'CONNECT never-resolve.invalid:443 HTTP/1.1\r\nHost: never-resolve.invalid\r\n\r\n');
  await raw(b.origin, 'G@T / HTTP/1.1\r\n\r\n');
  await raw(b.origin, 'G@T / HTTP/1.1\r\n\r\n').catch(() => {});
  await b.close();
  assert.equal(b.stats.closeReason, 'request-limit');
  assert.equal(b.stats.requestCount, 3);
  assert.equal(b.stats.clientErrors, 2);
  assert.equal(b.stats.connectRequests, 1);
  assert.equal(b.requests.length, 2);
  assert.equal(b.stats.receiptsDropped, 1);
});

test('request cap aborts admitted reads and closes idle connections without extra receipts', async (t) => {
  const entered = deferred();
  let signal;
  const b = await boundary(t, {
    limits: { maxRequests: 3 },
    readData: async (_path, currentSignal) => {
      signal = currentSignal;
      entered.resolve();
      return new Promise(() => {});
    },
  });
  await get(b.origin);
  await get(b.origin);
  const idle = connect({ host: '127.0.0.1', port: Number(new URL(b.origin).port) });
  t.after(() => idle.destroy());
  await once(idle, 'connect');
  const idleClosed = once(idle, 'close');
  const held = get(b.origin, `${DATA_PREFIX}held.json`).catch((error) => error);
  await entered.promise;
  await assert.rejects(get(b.origin));
  await b.close();
  await idleClosed;
  assert.equal(signal.aborted, true);
  assert.equal(b.stats.closeReason, 'request-limit');
  assert.equal(b.stats.requestCount, 4);
  assert.equal(b.requests.length, 3);
  assert.equal(b.stats.receiptsDropped, 1);
  assert.ok(await held instanceof Error);
});

test('idle connection count is bounded and excess connections close the listener', async (t) => {
  const b = await boundary(t, { limits: { maxRequests: 1 } });
  const first = connect({ host: '127.0.0.1', port: Number(new URL(b.origin).port) });
  t.after(() => first.destroy());
  await once(first, 'connect');
  const firstClosed = once(first, 'close');
  const second = connect({ host: '127.0.0.1', port: Number(new URL(b.origin).port) });
  second.on('error', () => {});
  t.after(() => second.destroy());
  await new Promise((resolve) => second.once('close', resolve));
  await firstClosed;
  await b.close();
  assert.equal(b.stats.closeReason, 'connection-limit');
  assert.equal(b.stats.droppedConnections, 1);
  assert.equal(b.stats.requestCount, 0);
});

test('aggregate response budget includes synthetic bodies and blocks the excess body', async (t) => {
  const b = await boundary(t, { limits: { maxResponseBytes: HTML.length } });
  await get(b.origin, '/');
  await assert.rejects(get(b.origin, '/missing.txt'));
  await b.close();
  assert.equal(b.stats.closeReason, 'response-byte-limit');
  assert.equal(b.stats.responseBytes, HTML.length);
  assert.equal(b.requests[1].status, null);
  assert.equal(b.requests[1].sha256, null);
  assert.equal(b.requests[1].aborted, true);
});

test('data file cap applies to GET and HEAD and aborts other in-flight readers', async (t) => {
  for (const method of ['GET', 'HEAD']) {
    const entered = deferred();
    let signal;
    const b = await boundary(t, {
      limits: { maxDataFileBytes: 8 },
      readData: async (path, currentSignal) => {
        if (path.endsWith('held.json')) {
          signal = currentSignal;
          entered.resolve();
          return new Promise(() => {});
        }
        return { status: 200, headers: {}, bytes: Buffer.alloc(9) };
      },
    });
    const held = get(b.origin, `${DATA_PREFIX}held.json`).catch((error) => error);
    await entered.promise;
    await assert.rejects(get(b.origin, `${DATA_PREFIX}large.json`, { method }));
    await b.close();
    assert.equal(b.stats.closeReason, 'data-file-limit');
    assert.equal(signal.aborted, true);
    assert.equal(b.stats.responseBytes, 0);
    assert.equal(b.stats.activeReads, 0);
    assert.ok(await held instanceof Error);
  }
});

test('concurrent data completions reserve aggregate bytes atomically', async (t) => {
  const entered = deferred();
  const release = deferred();
  let reads = 0;
  const b = await boundary(t, {
    limits: { maxResponseBytes: 12 },
    readData: async () => {
      if (++reads === 2) entered.resolve();
      await release.promise;
      return { status: 200, headers: {}, bytes: Buffer.alloc(8) };
    },
  });
  const first = get(b.origin, `${DATA_PREFIX}a.json`).catch((error) => error);
  const second = get(b.origin, `${DATA_PREFIX}b.json`).catch((error) => error);
  await entered.promise;
  release.resolve();
  await Promise.all([first, second]);
  await b.close();
  assert.equal(b.stats.closeReason, 'response-byte-limit');
  assert.equal(b.stats.responseBytes, 8);
  assert.ok(b.stats.completedBodyBytes <= 8);
});

test('data errors and invalid or redirect results stay local and uncaptured', async (t) => {
  const b = await boundary(t, { readData: async (path) => {
    if (path.endsWith('throw.json')) throw new Error('private exception');
    if (path.endsWith('redirect.json')) return { status: 302, bytes: Buffer.alloc(0), headers: { location: 'http://never-resolve.invalid' } };
    if (path.endsWith('invalid.json')) return { status: 200, bytes: 'not a buffer' };
    if (path.endsWith('headers.json')) return { status: 200, bytes: Buffer.from('x'), headers: { 'content-type': 'bad\r\nheader' } };
    return { status: 404, bytes: Buffer.from('local missing'), headers: {} };
  } });
  for (const name of ['throw', 'redirect', 'invalid', 'headers']) {
    const reply = await get(b.origin, `${DATA_PREFIX}${name}.json`);
    assert.equal(reply.status, 503);
    assert.equal(reply.headers['x-capture-boundary'], 'uncaptured');
  }
  const missing = await get(b.origin, `${DATA_PREFIX}missing.json`);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers['x-capture-boundary'], 'uncaptured');
  assert.equal(b.requests.at(-1).sourceKind, 'data');
  assert.doesNotMatch(JSON.stringify(b.requests), /private exception|never-resolve/);
});

test('wall deadline aborts non-cooperative data reads and closes idle sockets', async (t) => {
  const entered = deferred();
  let signal;
  const b = await boundary(t, {
    limits: { wallMs: 150 },
    readData: async (_path, currentSignal) => {
      signal = currentSignal;
      entered.resolve();
      return new Promise(() => {});
    },
  });
  const idle = connect({ host: '127.0.0.1', port: Number(new URL(b.origin).port) });
  t.after(() => idle.destroy());
  await once(idle, 'connect');
  const idleClosed = once(idle, 'close');
  const pending = get(b.origin, `${DATA_PREFIX}held.json`).catch((error) => error);
  await entered.promise;
  await until(() => b.stats.closing);
  await b.close();
  await idleClosed;
  assert.equal(b.stats.closeReason, 'wall-limit');
  assert.equal(signal.aborted, true);
  assert.equal(b.requests[0].status, null);
  assert.equal(b.requests[0].sha256, null);
  assert.ok(await pending instanceof Error);
});

test('deadline is rechecked after a synchronous late data completion', async (t) => {
  const b = await boundary(t, {
    limits: { wallMs: 80 },
    readData: async () => {
      const end = performance.now() + 100;
      while (performance.now() < end) { /* Simulate a callback that blocks the timer. */ }
      return { status: 200, headers: {}, bytes: Buffer.from('too late') };
    },
  });
  await assert.rejects(get(b.origin, `${DATA_PREFIX}late.json`));
  await b.close();
  assert.equal(b.stats.closeReason, 'wall-limit');
  assert.equal(b.stats.responseBytes, 0);
});

test('wall deadline covers an ongoing response to a non-reading client', async (t) => {
  const b = await boundary(t, { html: Buffer.alloc(32 * 1024 * 1024, 120), limits: { wallMs: 200 } });
  const socket = connect({ host: '127.0.0.1', port: Number(new URL(b.origin).port) });
  socket.on('error', () => {});
  t.after(() => socket.destroy());
  await once(socket, 'connect');
  socket.pause();
  socket.write(`GET / HTTP/1.1\r\nHost: ${new URL(b.origin).host}\r\n\r\n`);
  await until(() => b.requests.length === 1);
  await until(() => b.stats.closed);
  assert.equal(b.stats.closeReason, 'wall-limit');
  assert.equal(b.requests[0].aborted, true);
  assert.equal(b.requests[0].sha256, null);
  assert.equal(b.stats.activeSockets, 0);
});

test('disconnect aborts a data read without closing the whole boundary', async (t) => {
  const entered = deferred();
  let signal;
  const b = await boundary(t, { readData: async (_path, currentSignal) => {
    signal = currentSignal;
    entered.resolve();
    return new Promise(() => {});
  } });
  const socket = connect({ host: '127.0.0.1', port: Number(new URL(b.origin).port) });
  t.after(() => socket.destroy());
  await once(socket, 'connect');
  socket.write(`GET ${DATA_PREFIX}held.json HTTP/1.1\r\nHost: ${new URL(b.origin).host}\r\n\r\n`);
  await entered.promise;
  socket.destroy();
  await until(() => signal.aborted && b.stats.activeReads === 0);
  assert.equal(b.stats.closing, false);
  assert.equal((await get(b.origin)).status, 200);
  assert.equal(b.requests[0].aborted, true);
});

test('close is idempotent, aborts reads, handles late rejection, and leaves no owned handles', async (t) => {
  const entered = deferred();
  let signal;
  let rejectRead;
  const b = await boundary(t, { readData: (_path, currentSignal) => {
    signal = currentSignal;
    entered.resolve();
    return new Promise((_resolve, reject) => { rejectRead = reject; });
  } });
  const pending = get(b.origin, `${DATA_PREFIX}held.json`).catch((error) => error);
  await entered.promise;
  const first = b.close();
  assert.strictEqual(b.close(), first);
  await first;
  rejectRead(new Error('late private rejection'));
  await delay(10);
  assert.equal(signal.aborted, true);
  assert.equal(b.stats.closeReason, 'manual-close');
  assert.equal(b.stats.activeReads, 0);
  assert.equal(b.stats.activeSockets, 0);
  assert.equal(b.stats.activeResponses, 0);
  assert.ok(await pending instanceof Error);
  await assert.rejects(get(b.origin));
});

test('invalid inputs fail before creating a listener', async () => {
  const options = { html: HTML, readData: async () => ({ status: 200, bytes: Buffer.alloc(0) }) };
  for (const limits of [{ wallMs: 0 }, { wallMs: Infinity }, { maxRequests: 1.5 },
    { maxResponseBytes: -1 }, { maxDataFileBytes: NaN }, { wallMs: 2 ** 31 }, { unexpected: 3 },
    { constructor: 3 }, { toString: 3 }]) {
    await assert.rejects(startBoundary({ ...options, limits }), TypeError);
  }
  await assert.rejects(startBoundary({ ...options, html: 'not a buffer' }), TypeError);
  await assert.rejects(startBoundary({ ...options, htmlHeaders: { 'content-type': 'bad\nvalue' } }));
  await assert.rejects(startBoundary({ ...options, observed404: new Set(['/../captured.txt']) }), TypeError);
  for (const [path, digest] of [['/captured.txt', '0'.repeat(64)], ['/../captured.txt', sha(assetBytes)]]) {
    await assert.rejects(startBoundary({ ...options,
      assets: new Map([[path, { bytes: assetBytes, sha256: digest }]]),
    }), TypeError);
  }
});
