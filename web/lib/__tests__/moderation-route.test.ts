import React from 'react';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

const unavailable = vi.hoisted(() => vi.fn(() => { throw Error('Synthetic not found'); }));
vi.mock('next/navigation', () => ({ notFound: unavailable }));
vi.mock('../../components/moderation-console', () => ({ ModerationConsole: () => null }));

import ModerationPage, { dynamic, metadata } from '../../app/moderation/page';
import { ModerationConsole } from '../../components/moderation-console';

interface HeaderRule { source: string; headers: { key: string; value: string }[] }
const nextConfig = createRequire(import.meta.url)('../../next.config.js') as { headers(): Promise<HeaderRule[]> };
const workerSource = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');
const ORIGIN = 'https://shiok.example';

// Adapt the existing service-worker-behaviour VM harness. This runs the actual
// worker listener, not a copied cache predicate or a browser/Next implementation.
function worker() {
  type WorkerEvent = { request: Request; respondWith(work: Promise<Response>): void; waitUntil(work: Promise<unknown>): void };
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const cache = { match: vi.fn(async () => undefined), put: vi.fn(async () => {}) };
  const open = vi.fn(async () => cache);
  const fetch = vi.fn(async () => new Response('Synthetic public asset'));
  runInNewContext(workerSource, {
    URL, Request, Response, Headers, AbortController, setTimeout, clearTimeout,
    caches: { open }, fetch,
    self: { location: { origin: ORIGIN }, addEventListener: (type: string, listener: (event: WorkerEvent) => void) => listeners.set(type, listener) },
  }, { filename: 'web/public/sw.js' });
  return {
    open, fetch, cache,
    async dispatch(request: Request) {
      const work: Promise<unknown>[] = [];
      const track = (promise: Promise<unknown>) => { work.push(Promise.resolve(promise).catch(() => undefined)); };
      const respondWith = vi.fn(track), waitUntil = vi.fn(track);
      expect(listeners.has('fetch')).toBe(true);
      listeners.get('fetch')!({ request, respondWith, waitUntil });
      await Promise.all(work);
      return { respondWith, waitUntil };
    },
  };
}

afterEach(() => { vi.unstubAllEnvs(); unavailable.mockClear(); });

describe('Private moderation page release boundary', () => {
  it.each([undefined, '', 'false', 'TRUE', '1'])('is not available for switch value %#', value => {
    vi.stubEnv('SHIOK_MODERATION_ENABLED', value);
    expect(() => ModerationPage()).toThrow('Synthetic not found'); expect(unavailable).toHaveBeenCalledOnce();
  });
  it('renders only the explicitly enabled client console, without exposing server configuration', () => {
    vi.stubEnv('SHIOK_MODERATION_ENABLED', 'true');
    vi.stubEnv('SHIOK_MODERATOR_EMAIL', 'owner@example.invalid');
    const element = ModerationPage(); expect(React.isValidElement(element)).toBe(true);
    expect(element.type).toBe(ModerationConsole); expect(element.props).toEqual({ enabled: true });
    expect(unavailable).not.toHaveBeenCalled();
  });
  it('uses dynamic rendering and private-page indexing metadata', () => {
    expect(dynamic).toBe('force-dynamic'); expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates.canonical).toBeNull(); expect(metadata.openGraph).toBeNull(); expect(metadata.twitter).toBeNull();
  });
});

describe('Declared private-page header configuration, not served Next/Vercel headers', () => {
  it('declares a later moderation override without duplicating header keys', async () => {
    const rules = await nextConfig.headers();
    const matches = rules.filter(rule => rule.source === '/moderation/:path*');
    expect(matches).toHaveLength(1);
    expect(rules.indexOf(matches[0])).toBeGreaterThan(rules.findIndex(rule => rule.source === '/:path*'));
    const keys = matches[0].headers.map(header => header.key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('declares browser/CDN private no-store, no referrer and no indexing', async () => {
    const rule = (await nextConfig.headers()).find(item => item.source === '/moderation/:path*')!;
    const headers = new Headers(rule.headers.map(({ key, value }) => [key, value]));
    expect(headers.get('cache-control')).toBe('private, no-store');
    for (const name of ['cdn-cache-control', 'vercel-cdn-cache-control']) expect(headers.get(name)).toBe('no-store');
    expect(headers.get('referrer-policy')).toBe('no-referrer');
    expect(headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
    expect(headers.has('access-control-allow-origin')).toBe(false);
  });
  it('restricts private-page connections/images to local resources and disables workers/framing', async () => {
    const rule = (await nextConfig.headers()).find(item => item.source === '/moderation/:path*')!;
    const value = rule.headers.find(header => header.key.toLowerCase() === 'content-security-policy')!.value;
    const pairs = value.split(';').map(part => part.trim().split(/\s+/)).filter(parts => parts[0]);
    expect(new Set(pairs.map(parts => parts[0])).size).toBe(pairs.length);
    const directives = Object.fromEntries(pairs.map(([name, ...sources]) => [name, sources]));
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['connect-src']).toEqual(["'self'"]);
    expect(directives['img-src']).toEqual(["'self'", 'data:', 'blob:']);
    expect(directives['font-src']).toEqual(["'self'"]);
    expect(directives['worker-src']).toEqual(["'none'"]);
    expect(directives['frame-ancestors']).toEqual(["'none'"]);
    expect(directives['form-action']).toEqual(["'self'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
    expect(value).not.toMatch(/https?:|onemap|supabase|\*/i);
    // Inline Next hydration is still allowed; this is not a claim of XSS immunity.
    expect(directives['script-src']).toEqual(["'self'", "'unsafe-inline'"]);
  });
  it('keeps OneMap connectivity scoped to the existing general map policy', async () => {
    const rule = (await nextConfig.headers()).find(item => item.source === '/:path*')!;
    const policy = rule.headers.find(header => header.key === 'Content-Security-Policy')!.value;
    expect(policy).toContain("connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg");
  });
});

describe('Executed service-worker exclusion of private moderation traffic', () => {
  it.each(['/moderation', '/moderation/', '/moderation/review', '/moderation?_rsc=synthetic'])('does not intercept or cache private page %s', async path => {
    const instance = worker(); const request = new Request(`${ORIGIN}${path}`);
    Object.defineProperty(request, 'mode', { value: 'navigate' });
    const event = await instance.dispatch(request);
    expect(event.respondWith).not.toHaveBeenCalled(); expect(event.waitUntil).not.toHaveBeenCalled();
    expect(instance.open).not.toHaveBeenCalled(); expect(instance.fetch).not.toHaveBeenCalled();
  });
  it.each(['login', 'logout', 'queue', 'context', 'decision'])('leaves both GET and POST /api/moderation/%s outside worker caches', async operation => {
    const instance = worker();
    for (const method of ['GET', 'POST']) {
      const request = new Request(`${ORIGIN}/api/moderation/${operation}`, { method,
        headers: { Authorization: 'Bearer synthetic.only.fixture' }, ...(method === 'POST' ? { body: '{}' } : {}) });
      const event = await instance.dispatch(request);
      expect(event.respondWith).not.toHaveBeenCalled(); expect(event.waitUntil).not.toHaveBeenCalled();
    }
    expect(instance.open).not.toHaveBeenCalled(); expect(instance.fetch).not.toHaveBeenCalled();
    expect(instance.cache.put).not.toHaveBeenCalled(); expect(instance.cache.match).not.toHaveBeenCalled();
  });
  it('positive control still intercepts a public icon through the same actual listener', async () => {
    const instance = worker(); const event = await instance.dispatch(new Request(`${ORIGIN}/icon.svg`));
    expect(event.respondWith).toHaveBeenCalledOnce(); expect(instance.open).toHaveBeenCalled();
    expect(instance.fetch).toHaveBeenCalledOnce(); expect(instance.cache.put).toHaveBeenCalledOnce();
  });
});
