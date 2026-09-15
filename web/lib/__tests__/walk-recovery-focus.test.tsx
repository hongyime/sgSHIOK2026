import React, { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteEvidenceMap } from '../../components/route-evidence-map';
import type { PostalGeom, ScoreRecord, TransitPoiCollection } from '../types';
import fixture from './fixtures/published-options.json';

// Same Home-only hook contract as published-walk-page. Ref nodes model focus
// ownership/removal, not React DOM, native Tab order, browser zoom or MapLibre.
const host = vi.hoisted(() => {
  type Slot = {
    value?: unknown; deps?: readonly unknown[];
    setter?: (update: unknown) => void;
    effect?: () => void | (() => void); cleanup?: () => void;
  };
  let index = 0, generation = 0, dirty = false;
  const slots: Slot[] = [];
  const pending = new Set<number>();
  const changed = (a?: readonly unknown[], b?: readonly unknown[]) =>
    !a || !b || a.length !== b.length || b.some((value, i) => !Object.is(value, a[i]));
  function memo<T>(make: () => T, deps: readonly unknown[]): T {
    const i = index++;
    if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { value: make(), deps };
    return slots[i].value as T;
  }
  return {
    begin() { index = 0; dirty = false; },
    isDirty() { return dirty; },
    reset() {
      generation++;
      for (const slot of slots) slot.cleanup?.();
      slots.length = 0; pending.clear(); index = 0; dirty = false;
    },
    commitEffects() {
      const scheduled = [...pending]; pending.clear();
      for (const i of scheduled) {
        const slot = slots[i];
        slot.cleanup?.(); slot.cleanup = slot.effect?.() || undefined;
      }
    },
    useState<T>(initial: T | (() => T)): [T, (update: T | ((value: T) => T)) => void] {
      const i = index++;
      if (!slots[i]) {
        const epoch = generation;
        const slot: Slot = { value: typeof initial === 'function' ? (initial as () => T)() : initial };
        slot.setter = update => {
          if (epoch !== generation) return;
          const value = typeof update === 'function' ? (update as (value: T) => T)(slot.value as T) : update;
          if (!Object.is(value, slot.value)) { slot.value = value; dirty = true; }
        };
        slots[i] = slot;
      }
      return [slots[i].value as T, slots[i].setter!];
    },
    useRef<T>(initial: T): { current: T } {
      const i = index++;
      slots[i] ??= { value: { current: initial } };
      return slots[i].value as { current: T };
    },
    useMemo: memo,
    useCallback<T>(callback: T, deps: readonly unknown[]) { return memo(() => callback, deps); },
    useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      const i = index++;
      if (!slots[i] || changed(slots[i].deps, deps)) {
        slots[i] = { ...slots[i], deps, effect }; pending.add(i);
      }
    },
  };
});
const dependencies = vi.hoisted(() => ({
  MapChild: function MapChild() { return null; },
  fetchScoreForPostal: vi.fn(), fetchGeomForPostal: vi.fn(), fetchManifest: vi.fn(),
  fetchTransitPois: vi.fn(), fetchTransitPoisForGeom: vi.fn(), fetchRankRecordsForPostalArea: vi.fn(),
}));
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  const hooks = { useState: host.useState, useRef: host.useRef, useMemo: host.useMemo,
    useCallback: host.useCallback, useEffect: host.useEffect };
  return { ...actual, ...hooks, default: { ...actual, ...hooks } };
});
vi.mock('next/dynamic', () => ({ default: () => dependencies.MapChild }));
vi.mock('../../components/route-map-loader', () => ({ RouteMapLoader: dependencies.MapChild, preloadRouteMap: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('maplibre-gl', () => ({}));
vi.mock('../../components/route-evidence-map', () => ({ RouteEvidenceMap: dependencies.MapChild }));
vi.mock('../service-worker-cache', () => ({ requestServiceWorkerCache: vi.fn() }));
vi.mock('../data', async () => ({
  ...dependencies, DATA_BASE: '/data/generated_20260805_prefer_scored_routed',
  PINNED_DATA_MANIFEST: (await import('./fixtures/published-options.json')).default['manifest.json'],
}));

import Home from '../../app/page';
import { WalkSummary } from '../../components/walk-summary';

type Element = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
type MapProps = ComponentProps<typeof RouteEvidenceMap>;
const A = '018956', B = '079908';
const originalScore = fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === A)!;
const originalGeometry = fixture['geom/h3/886520db39fffff.json'][0];
const previewStop = 'mrt:synthetic-preview-only';
const previewTarget = { lat: 1.281234, lng: 103.860123 };
const clone = <T,>(value: T): T => structuredClone(value);
function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze); Object.freeze(value);
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let tree: ReactNode, url: URL;
let sourceScore: ScoreRecord, sourceGeometry: PostalGeom;
let scores: Map<string, ReturnType<typeof deferred<ScoreRecord | null>>>;
let geometries: Map<string, ReturnType<typeof deferred<PostalGeom | null>>>;
let pois: ReturnType<typeof deferred<TransitPoiCollection>>;
let requests: Array<{ gate: ReturnType<typeof deferred<Response>>; consumed: boolean }>;
let fetchSpy: ReturnType<typeof vi.fn>;
let nodes: Map<unknown, FocusNode>;
let focusCalls: string[];
let focusDocument: { activeElement: object; body: object };
let focusAtHandlerReturn: object;

class FocusNode {
  isConnected = true;
  disabled = false;
  constructor(public name: string) {}
  get ownerDocument() { return focusDocument; }
  focus = vi.fn((_options?: FocusOptions) => {
    if (!this.isConnected || this.disabled) throw Error('Cannot focus an unavailable control');
    focusDocument.activeElement = this; focusCalls.push(this.name);
  });
  contains(node: unknown) { return node === this; }
}
class PostalInputDouble extends FocusNode {
  constructor(public value: string) { super('postal-search-input'); }
}
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Element['props']>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return React.isValidElement<Element['props']>(node) ? text(node.props.children) : '';
}
function child<P>(type: unknown): P {
  const matches = elements(tree).filter(element => element.type === type);
  expect(matches).toHaveLength(1);
  return matches[0].props as P;
}
const map = () => child<MapProps>(dependencies.MapChild);
const summary = () => child<ComponentProps<typeof WalkSummary>>(WalkSummary);
function summaryEvidence() {
  const { postal, score, option, shortest } = summary();
  return clone({ postal, score, option, shortest });
}
function button(label: string): Element {
  const matches = elements(tree).filter(element => element.type === 'button' && text(element) === label);
  expect(matches).toHaveLength(1);
  return matches[0];
}
function key(element: Element): unknown {
  return element.props.ref ?? element.props.id ?? `${String(element.type)}:${text(element)}`;
}
function heading(): Element {
  const headings = elements(WalkSummary(summary())).filter(element => element.type === 'h2');
  expect(headings).toHaveLength(1);
  return headings[0];
}
function mountNodes() {
  const previous = nodes;
  nodes = new Map();
  const mounted = elements(tree).filter(e => typeof e.type === 'string' &&
    (e.type === 'button' || e.type === 'input' || e.props.ref));
  if (elements(tree).some(element => element.type === WalkSummary)) mounted.push(heading());
  for (const element of mounted) {
    const name = String(element.props.id ?? text(element));
    const node = previous.get(key(element)) ?? (element.type === 'input'
      ? new PostalInputDouble(String(element.props.value ?? '')) : new FocusNode(name));
    node.name = name; node.isConnected = true; node.disabled = element.props.disabled === true;
    nodes.set(key(element), node);
    const ref = element.props.ref as { current: unknown } | ((node: unknown) => void) | undefined;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }
  for (const node of previous.values()) {
    if ([...nodes.values()].includes(node)) continue;
    node.isConnected = false;
    if (focusDocument.activeElement === node) focusDocument.activeElement = focusDocument.body;
  }
}
function render() {
  for (let attempt = 0; attempt < 40; attempt++) {
    host.begin();
    const entry = Home();
    tree = (entry.type as (props: typeof entry.props) => ReactNode)(entry.props);
    mountNodes(); host.commitEffects();
    if (!host.isDirty()) return;
  }
  throw Error('Home effects did not settle within 40 renders');
}
async function settle() {
  for (let turn = 0; turn < 30; turn++) {
    await Promise.resolve(); if (host.isDirty()) render();
  }
}
function activate(label: string, ownership: 'owned' | 'missing' | 'unowned' = 'owned') {
  const element = button(label), node = nodes.get(key(element))!;
  // Model a user already focused on the control, not a component focus call.
  if (ownership === 'owned') focusDocument.activeElement = node;
  const event = ownership === 'missing' ? undefined : { currentTarget: node, target: node };
  const result = (element.props.onClick as (event?: unknown) => unknown)(event);
  focusAtHandlerReturn = focusDocument.activeElement;
  render();
  return result;
}
const recoveryHeading = () => nodes.get(key(heading()))!;
function moveFocusToSearch() {
  const input = elements(tree).find(e => e.props.id === 'postal-search-input')!;
  const node = nodes.get(key(input))!;
  focusDocument.activeElement = node;
  return node;
}
function submit(postal: string) {
  const form = elements(tree).find(e => e.type === 'form')!;
  const control = new PostalInputDouble(postal);
  const submitted = (form.props.onSubmit as (event: unknown) => Promise<void>)({
    preventDefault: vi.fn(), currentTarget: { elements: { namedItem: (name: string) => name === 'postal' ? control : null } },
  });
  render(); return submitted;
}
function allowPreview() {
  const gate = deferred<Response>(); requests.push({ gate, consumed: false }); return gate;
}
async function load(geometryFails = false) {
  url = new URL(`https://example.test/?postal=${A}&transit=mrt_lrt`); render();
  scores.get(A)!.resolve(sourceScore);
  if (geometryFails) geometries.get(A)!.reject(Error('Synthetic geometry failure'));
  else geometries.get(A)!.resolve(sourceGeometry);
  await settle(); expect(summary().postal).toBe(A);
}
async function failedPreview() {
  await load();
  // Only this unpublished POI is synthetic; saved scores/geometry stay fixture-exact.
  pois.resolve({ type: 'FeatureCollection', features: [{ type: 'Feature',
    geometry: { type: 'Point', coordinates: [previewTarget.lng, previewTarget.lat] },
    properties: { id: previewStop, kind: 'mrt_exit', name: 'Synthetic preview-only exit' },
  }] });
  await settle();
  const saved = { summary: summaryEvidence(), routes: clone(map().routes), href: url.href };
  const first = allowPreview(); map().onSelectTransitStop!(previewStop); render(); await settle();
  first.resolve(Response.json({ ok: false }, { status: 503 })); await settle();
  expect(text(tree)).toContain('Online preview unavailable');
  return saved;
}

beforeEach(() => {
  host.reset(); vi.resetAllMocks();
  nodes = new Map(); focusCalls = [];
  const body = {}; focusDocument = { body, activeElement: body };
  focusAtHandlerReturn = body;
  scores = new Map([A, B].map(postal => [postal, deferred<ScoreRecord | null>()]));
  geometries = new Map([A, B].map(postal => [postal, deferred<PostalGeom | null>()]));
  pois = deferred<TransitPoiCollection>(); requests = [];
  sourceScore = clone(originalScore) as unknown as ScoreRecord;
  sourceGeometry = clone(originalGeometry) as unknown as PostalGeom;
  freeze(sourceScore); freeze(sourceGeometry);
  dependencies.fetchScoreForPostal.mockImplementation((postal: string) => scores.get(postal)!.promise);
  dependencies.fetchGeomForPostal.mockImplementation((postal: string) => geometries.get(postal)!.promise);
  dependencies.fetchTransitPoisForGeom.mockImplementation(() => pois.promise);
  dependencies.fetchTransitPois.mockResolvedValue({ type: 'FeatureCollection', features: [] });
  dependencies.fetchRankRecordsForPostalArea.mockResolvedValue([]);
  dependencies.fetchManifest.mockResolvedValue(fixture['manifest.json']);
  url = new URL('https://example.test/');
  fetchSpy = vi.fn((input: RequestInfo | URL) => {
    const request = new URL(input instanceof Request ? input.url : String(input), url);
    const approved = requests.find(item => !item.consumed);
    if (!approved || request.origin !== url.origin || request.pathname !== '/api/onemap-route'
      || request.searchParams.get('endLat') !== previewTarget.lat.toFixed(6)
      || request.searchParams.get('endLng') !== previewTarget.lng.toFixed(6)) {
      return Promise.reject(Error('Unapproved request in focus component tests'));
    }
    approved.consumed = true; return approved.gate.promise;
  });
  vi.stubGlobal('HTMLInputElement', PostalInputDouble);
  vi.stubGlobal('HTMLElement', FocusNode);
  vi.stubGlobal('document', focusDocument);
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('window', {
    location: { get href() { return url.href; }, get search() { return url.search; }, get hash() { return url.hash; } },
    history: { replaceState: (_state: unknown, _title: string, next: string) => { url = new URL(next, url); } },
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    localStorage: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), key: vi.fn(), length: 0 },
  });
});
afterEach(() => {
  try {
    expect(fetchSpy).toHaveBeenCalledTimes(requests.length);
    expect(requests.every(request => request.consumed)).toBe(true);
    expect(sourceScore).toEqual(originalScore); expect(sourceGeometry).toEqual(originalGeometry);
    expect(dependencies.fetchRankRecordsForPostalArea).not.toHaveBeenCalled();
  } finally { host.reset(); vi.unstubAllGlobals(); }
});

describe('Home walk recovery focus ownership', () => {
  it.each([
    [false, 'partial'], [false, 'error'], [true, 'partial'], [true, 'error'],
  ] as const)('keeps map Retry focus with saved walk=%s and map status=%s', async (saved, status) => {
    if (saved) await load(); else render();
    const target = saved ? recoveryHeading() : moveFocusToSearch();
    map().onStatusChange!(status, 'Synthetic map failure', undefined, {
      stage: status === 'partial' ? 'basemap-tiles' : 'map-startup', reason: 'error',
    });
    render(); activate('Retry map');
    expect(focusAtHandlerReturn === target).toBe(true);
    map().onStatusChange!('initializing'); render();
    expect(text(tree)).not.toContain('Retry map');
    expect(focusDocument.activeElement === target).toBe(true);
    const search = moveFocusToSearch(), calls = [...focusCalls];
    map().onStatusChange!('ready'); render();
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual(calls);
  });

  it.each(['missing', 'unowned'] as const)('%s map Retry does not steal search focus', async ownership => {
    await load(); const search = moveFocusToSearch();
    for (const status of ['partial', 'error'] as const) {
      map().onStatusChange!(status, 'Synthetic map failure', undefined, { stage: 'map-startup', reason: 'error' });
      render(); activate('Retry map', ownership);
      map().onStatusChange!('initializing'); render();
      expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual([]);
    }
  });

  it('keeps terminal Reload page native without a pre-navigation focus transfer', async () => {
    render(); const reload = vi.fn(); window.location.reload = reload;
    map().onStatusChange!('error', 'Synthetic failed library', 'reload', { stage: 'library-download', reason: 'rejected' });
    render(); const control = nodes.get(key(button('Reload page')))!;
    activate('Reload page');
    expect(reload).toHaveBeenCalledTimes(1); expect(focusAtHandlerReturn === control).toBe(true);
    expect(focusCalls).toEqual([]);
  });

  it('moves an initial selection Retry to search before removal and leaves it there after success', async () => {
    render();
    const initial = submit(A);
    scores.get(A)!.reject(Error('Synthetic score failure'));
    geometries.get(A)!.resolve(sourceGeometry);
    await settle(); await initial;
    const target = moveFocusToSearch(), retry = deferred<ScoreRecord | null>();
    dependencies.fetchScoreForPostal.mockReturnValueOnce(retry.promise);
    const pending = activate('Retry selection');
    expect(focusAtHandlerReturn === target).toBe(true);
    expect(focusDocument.activeElement === target).toBe(true);
    expect(text(tree)).not.toContain('Retry selection');
    expect(focusCalls).toEqual(['postal-search-input']);
    retry.resolve(sourceScore); await settle(); await pending;
    expect(summary().postal).toBe(A);
    expect(focusDocument.activeElement).toBe(target);
    expect(focusCalls).toEqual(['postal-search-input']);
  });

  it('keeps selection Retry focus on the surviving walk heading while the next record is loading', async () => {
    await load(); const target = recoveryHeading();
    const next = submit(B);
    scores.get(B)!.reject(Error('Synthetic next-record failure'));
    geometries.get(B)!.resolve(null);
    await settle(); await next;
    const retry = deferred<ScoreRecord | null>();
    dependencies.fetchScoreForPostal.mockReturnValueOnce(retry.promise);
    const pending = activate('Retry selection');
    expect(focusAtHandlerReturn === target).toBe(true);
    expect(focusDocument.activeElement === target).toBe(true);
    expect(summary().postal).toBe(A);
    expect(text(tree)).not.toContain('Retry selection');
    const search = moveFocusToSearch(), calls = [...focusCalls];
    retry.resolve(null); await settle(); await pending;
    expect(summary().postal).toBe(B);
    expect(focusDocument.activeElement).toBe(search);
    expect(focusCalls).toEqual(calls);
  });

  it.each(['resolve', 'reject'] as const)('late selection Retry %s cannot reclaim focus after a newer search', async outcome => {
    await load();
    const next = submit(B);
    scores.get(B)!.reject(Error('Synthetic failed selection'));
    geometries.get(B)!.resolve(null); await settle(); await next;
    const retry = deferred<ScoreRecord | null>();
    dependencies.fetchScoreForPostal.mockReturnValueOnce(retry.promise);
    const pending = activate('Retry selection');
    expect(focusCalls).toEqual([`Postal ${A}`]);
    const search = moveFocusToSearch(), calls = [...focusCalls];
    await submit(A); await settle();
    if (outcome === 'resolve') retry.resolve(null);
    else retry.reject(Error('Obsolete retry failure'));
    await settle(); await pending;
    expect(summary().postal).toBe(A);
    expect(url.searchParams.get('postal')).toBe(A);
    expect(focusDocument.activeElement).toBe(search);
    expect(focusCalls).toEqual(calls);
    expect(text(tree)).not.toContain('Retry selection');
  });

  it.each(['missing', 'unowned'] as const)('%s selection Retry activation does not steal search focus', async ownership => {
    render();
    const initial = submit(A);
    scores.get(A)!.reject(Error('Synthetic selection failure'));
    geometries.get(A)!.resolve(sourceGeometry); await settle(); await initial;
    const search = moveFocusToSearch(), retry = deferred<ScoreRecord | null>();
    dependencies.fetchScoreForPostal.mockReturnValueOnce(retry.promise);
    const pending = activate('Retry selection', ownership);
    expect(focusAtHandlerReturn).toBe(search);
    expect(focusDocument.activeElement).toBe(search);
    expect(focusCalls).toEqual([]);
    retry.reject(Error('Synthetic retry failure')); await settle(); await pending;
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual([]);
  });

  it('does nothing when an old selection Retry handler no longer has a pending selection', async () => {
    render(); const initial = submit(A);
    scores.get(A)!.reject(Error('Synthetic selection failure'));
    geometries.get(A)!.resolve(sourceGeometry); await settle(); await initial;
    const retry = button('Retry selection'), control = nodes.get(key(retry))!;
    const handler = retry.props.onClick as (event: unknown) => unknown;
    await submit(''); await settle();
    expect(control.isConnected).toBe(false);
    const search = moveFocusToSearch(), calls = dependencies.fetchScoreForPostal.mock.calls.length;
    expect(handler({ currentTarget: control })).toBeUndefined();
    expect(dependencies.fetchScoreForPostal).toHaveBeenCalledTimes(calls);
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual([]);
  });

  it('moves geometry Retry focus to the named summary heading before removal and keeps it on success', async () => {
    await load(true);
    const target = recoveryHeading(), retry = deferred<PostalGeom | null>();
    expect(heading().props.tabIndex).toBe(-1);
    expect(text(heading())).toBe(`Postal ${A}`);
    dependencies.fetchGeomForPostal.mockReturnValueOnce(retry.promise);
    const pending = activate('Retry geometry');
    expect(focusAtHandlerReturn).toBe(target);
    expect(focusDocument.activeElement).toBe(target);
    expect(text(tree)).not.toContain('Retry geometry');
    expect(focusCalls).toEqual([`Postal ${A}`]);
    retry.resolve(sourceGeometry); await settle(); await pending;
    expect(recoveryHeading()).toBe(target); expect(focusDocument.activeElement).toBe(target);
    expect(focusCalls).toEqual([`Postal ${A}`]); expect(map().routes.length).toBeGreaterThan(0);
  });

  it('late geometry retry failure and success cannot reclaim focus after the user moves to search', async () => {
    await load(true);
    const retry = deferred<PostalGeom | null>();
    dependencies.fetchGeomForPostal.mockReturnValueOnce(retry.promise);
    const pending = activate('Retry geometry');
    const search = moveFocusToSearch(), calls = [...focusCalls];
    retry.reject(Error('Synthetic retry failure'));
    await settle(); await pending;
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual(calls);
    expect(summary().postal).toBe(A);
    expect(text(tree)).toContain('Retry geometry');
    const next = deferred<PostalGeom | null>();
    dependencies.fetchGeomForPostal.mockReturnValueOnce(next.promise);
    const nextPending = activate('Retry geometry');
    moveFocusToSearch(); const nextCalls = [...focusCalls];
    next.resolve(sourceGeometry); await settle(); await nextPending;
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual(nextCalls);
    expect(text(tree)).not.toContain('Retry geometry');
  });

  it('keeps the current geometry retry loading when an older postal retry completes', async () => {
    await load(true);
    const oldRetry = deferred<PostalGeom | null>();
    dependencies.fetchGeomForPostal.mockReturnValueOnce(oldRetry.promise);
    const oldPending = activate('Retry geometry');
    expect(text(tree)).toContain('Loading saved walk...');
    expect(text(tree)).not.toContain('No route geometry is published');

    moveFocusToSearch(); const submitted = submit(B);
    scores.get(B)!.resolve(clone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === B)) as unknown as ScoreRecord);
    geometries.get(B)!.reject(Error('Synthetic second-postal geometry failure'));
    await settle(); await submitted;
    expect(summary().postal).toBe(B);
    expect(text(tree)).not.toContain('Loading saved walk...');

    const currentRetry = deferred<PostalGeom | null>();
    dependencies.fetchGeomForPostal.mockReturnValueOnce(currentRetry.promise);
    const currentPending = activate('Retry geometry');
    expect(text(tree)).toContain('Loading saved walk...');
    oldRetry.resolve(sourceGeometry); await settle(); await oldPending;
    expect(summary().postal).toBe(B);
    expect(map().routes).toHaveLength(0);
    expect(text(tree)).toContain('Loading saved walk...');
    expect(text(tree)).not.toContain('No route geometry is published');

    currentRetry.resolve(null); await settle(); await currentPending;
    expect(text(tree)).not.toContain('Loading saved walk...');
    expect(text(tree)).not.toContain('Retry geometry');
    expect(summary().postal).toBe(B); expect(map().routes).toHaveLength(0);
  });

  it('moves preview Retry focus before its control disappears without losing the saved walk', async () => {
    const saved = await failedPreview(), target = recoveryHeading(), retry = allowPreview();
    activate('Retry preview'); await settle();
    expect(focusAtHandlerReturn).toBe(target);
    expect(focusDocument.activeElement).toBe(target); expect(focusCalls).toEqual([`Postal ${A}`]);
    expect(text(tree)).toContain('Checking this stop.'); expect(text(tree)).not.toContain('Retry preview');
    expect(map().routes).toEqual(saved.routes);
    retry.resolve(Response.json({ ok: false }, { status: 503 })); await settle();
    expect(focusDocument.activeElement).toBe(target); expect(focusCalls).toEqual([`Postal ${A}`]);
    expect(summaryEvidence()).toEqual(saved.summary); expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('late successful preview retry cannot steal search focus or overwrite a newly submitted postal', async () => {
    await failedPreview(); const retry = allowPreview(); activate('Retry preview'); await settle();
    const search = moveFocusToSearch(), calls = [...focusCalls], submitted = submit(B);
    scores.get(B)!.resolve(clone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === B)) as unknown as ScoreRecord);
    geometries.get(B)!.resolve(null); await settle(); await submitted;
    retry.resolve(Response.json({ ok: true, route_geometry: originalGeometry.shortest, total_distance_m: 999 }));
    await settle();
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual(calls);
    expect(summary().postal).toBe(B); expect(url.searchParams.get('postal')).toBe(B);
    expect(map().routes).toHaveLength(0);
  });

  it('Back to saved walk preserves keyboard focus and saved selection without another provider request', async () => {
    const saved = await failedPreview(), target = recoveryHeading();
    activate('Back to saved walk'); await settle();
    expect(focusAtHandlerReturn).toBe(target);
    expect(focusDocument.activeElement).toBe(target); expect(focusCalls).toEqual([`Postal ${A}`]);
    expect(text(tree)).not.toContain('Back to saved walk');
    expect(summaryEvidence()).toEqual(saved.summary); expect(map().routes).toEqual(saved.routes);
    expect(url.href).toBe(saved.href); expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('late preview success after Back cannot reclaim focus or replace the saved walk', async () => {
    const saved = await failedPreview(), retry = allowPreview();
    activate('Retry preview'); await settle(); activate('Back to saved walk'); await settle();
    const search = moveFocusToSearch(), calls = [...focusCalls];
    retry.resolve(Response.json({ ok: true, route_geometry: originalGeometry.shortest, total_distance_m: 999 }));
    await settle();
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual(calls);
    expect(summaryEvidence()).toEqual(saved.summary); expect(map().routes).toEqual(saved.routes);
    expect(url.href).toBe(saved.href); expect(text(tree)).not.toContain('Online preview unavailable');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it.each(['missing', 'unowned'] as const)('%s activation events never take search focus in any recovery handler', async ownership => {
    await load(true);
    const search = moveFocusToSearch(), retryGeometry = deferred<PostalGeom | null>();
    dependencies.fetchGeomForPostal.mockReturnValueOnce(retryGeometry.promise);
    const pending = activate('Retry geometry', ownership);
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual([]);
    retryGeometry.resolve(sourceGeometry); await settle(); await pending;
    pois.resolve({ type: 'FeatureCollection', features: [{ type: 'Feature',
      geometry: { type: 'Point', coordinates: [previewTarget.lng, previewTarget.lat] },
      properties: { id: previewStop, kind: 'mrt_exit', name: 'Synthetic preview-only exit' },
    }] });
    await settle();
    const first = allowPreview(); map().onSelectTransitStop!(previewStop); render(); await settle();
    first.resolve(Response.json({ ok: false }, { status: 503 })); await settle();
    const retry = allowPreview(); activate('Retry preview', ownership); await settle();
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual([]);
    activate('Back to saved walk', ownership); await settle();
    retry.reject(Error('Synthetic canceled retry')); await settle();
    expect(focusDocument.activeElement).toBe(search); expect(focusCalls).toEqual([]);
    expect(summary().postal).toBe(A); expect(text(tree)).not.toContain('Back to saved walk');
  });
});
