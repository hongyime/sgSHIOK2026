import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureServer, BODY_SIZES, BODY_MODES } from './server.mjs';

async function withServer(check) {
  const server = createFixtureServer();
  try {
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    await check('http://127.0.0.1:' + server.address().port);
  } finally { server.closeAllConnections(); await new Promise(done => server.close(done)); }
}
for (const [size, length] of Object.entries(BODY_SIZES)) for (const mode of BODY_MODES) {
  test(`${size}/${mode} returns an exact bounded404 response`, () => withServer(async origin => {
    const response = await fetch(origin + `/body/${size}/${mode}`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('content-length'), String(length));
    assert.equal((await response.text()).length, length);
  }));
}
test('only named fixture resources are served; no filesystem fallback or POST', () => withServer(async origin => {
  for (const path of ['/worker.mjs', '/worker-helper.mjs', '/worker-data.json', '/page.mjs', '/']) {
    const response = await fetch(origin + path); assert.equal(response.status, 200); await response.text();
    assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
  }
  for (const path of ['/data/anything', '/body/small/drain?x=1', '/server.mjs']) {
    const response = await fetch(origin + path); assert.equal(response.status, 403); await response.text();
  }
  assert.equal((await fetch(origin + '/', { method: 'POST' })).status, 405);
}));
