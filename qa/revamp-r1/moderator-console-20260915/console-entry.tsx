import React from 'react';
import { createRoot } from 'react-dom/client';
import { ModerationConsole } from '../../../web/components/moderation-console';
import { createModeratorClient } from '../../../web/lib/moderator-client';

const id = (n: number) => `${String(n).padStart(8, '0')}-1111-4111-8111-111111111111`;
const received = new Date(Date.now() - 60000).toISOString();
const expires = new Date(Date.parse(received) + 30 * 86400000).toISOString();
const base = { receipt_id: id(1), report_type: 'mapping_error', state: 'pending', revision: 1, received_at: received };
const row = { ...base, expires_at: expires, moderation: null, content: {
  schema_version: 1, report_type: 'mapping_error', referenced_bundle_version: 'synthetic_bundle',
  geometry: { type: 'LineString', coordinates: [[103.8, 1.3], [103.801, 1.301], [103.802, 1.301]] },
  context: { postal_code: '123456', destination_id: 'synthetic-stop', transit_category: 'bus', published_route_id: 'synthetic-route' },
  note: 'Synthetic resident note: the covered path ends before this crossing. <script>not executable</script>',
} };
const fixture = { requests: [] as string[], contextChecks: 0, pageShows: [] as boolean[], expire: () => {}, reset: () => {} };
Object.assign(window, { fixture });
window.addEventListener('pageshow', event => fixture.pageShows.push(event.persisted));
let now = Date.now();
const client = createModeratorClient({ now: () => now, transport: async (url, init) => {
  const path = String(url); fixture.requests.push(path);
  if (path.endsWith('/login')) {
    now = Date.now();
    const exp = Math.floor(now / 1000) + 600;
    const b64 = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    return Response.json({ ok: true, accessToken: `${b64({ alg: 'ES256' })}.${b64({ exp })}.c2lnbmF0dXJl`, expiresAt: new Date(exp * 1000).toISOString() });
  }
  if (path.endsWith('/queue')) return Response.json({ ok: true, queue: { reports: [row], page_limit: 25 } });
  if (path.endsWith('/decision')) return Response.json({ ok: false, error: 'outcome_unknown' }, { status: 503 });
  if (path.endsWith('/context')) {
    const terminal = ++fixture.contextChecks > 1;
    return Response.json({ ok: true, context: { observed_at: new Date(now).toISOString(), source: {
      ...base, state: terminal ? 'accepted' : 'pending', revision: terminal ? 2 : 1,
      moderated_at: terminal ? new Date(now - 1).toISOString() : null, moderator_id: terminal ? id(2) : null,
      reason: terminal ? 'Synthetic saved decision' : null, duplicate_of: null,
    } } });
  }
  if (path.endsWith('/logout')) return Response.json({ ok: false, error: 'unavailable' }, { status: 503 });
  throw Error('Unexpected synthetic endpoint');
} });
fixture.expire = () => { now += 3600000; };
createRoot(document.getElementById('root')!).render(<ModerationConsole enabled client={client} />);
