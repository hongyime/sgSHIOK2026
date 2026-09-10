import http from 'node:http';
import { readFileSync } from 'node:fs';

export const BODY_SIZES = { small: 64, large: 262144 };
export const BODY_MODES = ['ignored', 'cancel', 'drain'];
const resources = new Map([
  ['/', ['text/html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>Local lifecycle fixture</title><body><p>Local lifecycle fixture</p><script type="module" src="/page.mjs"></script></body></html>']],
  ['/page.mjs', ['text/javascript', readFileSync(new URL('./page.mjs', import.meta.url))]],
  ['/worker.mjs', ['text/javascript', 'import { value } from "/worker-helper.mjs"; const data=await (await fetch("/worker-data.json")).json(); postMessage({value,data});']],
  ['/worker-helper.mjs', ['text/javascript', 'export const value="owned-worker-ready";']],
  ['/worker-data.json', ['application/json', '{"fixture":true}']],
]);

export function createFixtureServer(record = () => {}) {
  return http.createServer((request, response) => {
    const path = request.url;
    record({ kind: 'server-request', path, method: request.method });
    response.on('finish', () => record({ kind: 'server-finish', path, status: response.statusCode }));
    response.on('close', () => record({ kind: 'server-close', path, complete: response.writableFinished }));
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    if (path === '/favicon.ico') { response.writeHead(204).end(); return; }
    const body = /^\/body\/(small|large)\/(ignored|cancel|drain)$/.exec(path);
    const resource = resources.get(path);
    if (!body && !resource) { response.writeHead(403).end('Outside fixture'); return; }
    const bytes = body ? Buffer.alloc(BODY_SIZES[body[1]], 'x') : Buffer.from(resource[1]);
    response.writeHead(body ? 404 : 200, {
      'Content-Type': body ? 'text/plain' : resource[0], 'Content-Length': bytes.length,
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; connect-src 'self'; worker-src 'self'",
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  });
}
