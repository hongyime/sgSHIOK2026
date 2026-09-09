import { describe, expect, it, vi } from 'vitest';
import { createComparisonController } from '../comparison-controller';
import { COMPARISON_STORAGE_KEY, emptyComparisonState, type ComparisonState } from '../comparison-state';
import type { PostalGeom, ScoreRecord } from '../types';
import fixture from './fixtures/published-options.json';

type Source = Parameters<typeof createComparisonController>[0];
type Controller = ReturnType<typeof createComparisonController>;
type Snapshot = ReturnType<Controller['getSnapshot']>;
type Deferred<T> = { postal: string; promise: Promise<T>; resolve(value: T): void; reject(error: Error): void };
// Only labelled in-memory mutations use this escape hatch; the fixture is unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
const bundle = 'generated_20260805_prefer_scored_routed';
const first = '018956', second = '018990', third = '079908';
const busMetrics = { distance: 81.2, coverage: 55, uncovered: 36.5, longest: 20.2 };

function deferred<T>(postal: string): Deferred<T> {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { postal, promise, resolve, reject };
}

function harness(sourceBundle = bundle) {
  const scores: Deferred<ScoreRecord | null>[] = [], geometries: Deferred<PostalGeom | null>[] = [];
  const source = {
    bundle: sourceBundle,
    score: vi.fn((postal: string) => { const item = deferred<ScoreRecord | null>(postal); scores.push(item); return item.promise; }),
    geometry: vi.fn((postal: string) => { const item = deferred<PostalGeom | null>(postal); geometries.push(item); return item.promise; }),
  } satisfies Source;
  return { source, scores, geometries };
}

function score(postal = first): ScoreRecord {
  return structuredClone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(record => record.postal === postal)) as unknown as ScoreRecord;
}

function geometry(postal = first): PostalGeom | null {
  return postal === first ? structuredClone(fixture['geom/h3/886520db39fffff.json'][0]) as unknown as PostalGeom : null;
}

function persisted(postals: string[] = [first], category: ComparisonState['category'] = 'bus'): ComparisonState {
  return { version: 1, postals, category, activePostal: postals[0] ?? null };
}

function storage(raw: string | null) {
  return {
    getItem: vi.fn((_key: string): string | null => raw),
    setItem: vi.fn((_key: string, _value: string): void => {}),
    removeItem: vi.fn(() => { throw new Error('No storage deletion'); }),
    clear: vi.fn(() => { throw new Error('No storage clearing'); }),
    key: vi.fn(() => { throw new Error('No storage enumeration'); }),
  };
}

function setup(postals: string[] = [first], category: ComparisonState['category'] = 'bus') {
  const reads = harness(), target = storage(JSON.stringify(persisted(postals, category)));
  return { ...reads, target, controller: createComparisonController(reads.source, () => target) };
}

async function flush(): Promise<void> {
  // Drain the controller's promise/catch chains; no sleeps, requests or fake fetches.
  for (let count = 0; count < 8; count++) await Promise.resolve();
}

function request<T>(items: Deferred<T>[], postal = first, occurrence = 0): Deferred<T> {
  const found = items.filter(item => item.postal === postal)[occurrence];
  expect(found, `request ${postal} #${occurrence}`).toBeDefined();
  return found;
}

async function open(value: ReturnType<typeof setup>): Promise<void> {
  value.controller.restore();
  value.controller.setOpen(true);
  await flush();
}

async function deliver(value: Pick<ReturnType<typeof setup>, 'scores' | 'geometries'>, postal = first, occurrence = 0): Promise<void> {
  request(value.scores, postal, occurrence).resolve(score(postal));
  request(value.geometries, postal, occurrence).resolve(geometry(postal));
  await flush();
}

function entry(controller: Controller, postal = first) {
  const value = controller.getSnapshot().entries[postal];
  expect(value, `entry ${postal}`).toBeDefined();
  return value;
}

function freeze(value: unknown): void {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

describe('T10 controller: restore and user-owned persistence', () => {
  it('creation has no storage or source side effects and returns a stable empty snapshot', () => {
    const value = setup(), snapshot = value.controller.getSnapshot();
    expect(snapshot).toEqual({ state: emptyComparisonState(), open: false, restored: false, shared: false, storageUnavailable: false, entries: {} });
    expect(value.controller.getSnapshot()).toBe(snapshot);
    expect(value.target.getItem).not.toHaveBeenCalled();
    expect(value.target.setItem).not.toHaveBeenCalled();
    expect(value.source.score).not.toHaveBeenCalled();
    expect(value.source.geometry).not.toHaveBeenCalled();
  });

  it('restores while closed without fetching, persisting, deleting or enumerating storage', async () => {
    const value = setup([first, second]); value.controller.restore(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ restored: true, open: false, state: persisted([first, second]), entries: {} });
    expect(value.target.getItem).toHaveBeenCalledExactlyOnceWith(COMPARISON_STORAGE_KEY);
    expect(value.target.setItem).not.toHaveBeenCalled();
    expect(value.target.removeItem).not.toHaveBeenCalled();
    expect(value.target.clear).not.toHaveBeenCalled();
    expect(value.target.key).not.toHaveBeenCalled();
    expect(value.source.score).not.toHaveBeenCalled();
    expect(value.source.geometry).not.toHaveBeenCalled();
  });

  it('restore is idempotent and cannot later overwrite a user action with old stored state', () => {
    const value = setup(); value.controller.restore();
    expect(value.controller.dispatch({ type: 'add', postal: second })).toBeNull();
    const current = value.controller.getSnapshot();
    value.controller.restore();
    expect(value.controller.getSnapshot()).toEqual(current);
    expect(value.target.getItem).toHaveBeenCalledTimes(1);
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
  });

  it('invalid stored payload remains untouched while memory starts with a valid empty state', () => {
    const reads = harness(), target = storage('{bad-json');
    const controller = createComparisonController(reads.source, () => target);
    controller.restore();
    expect(controller.getSnapshot()).toMatchObject({ restored: true, state: emptyComparisonState(), entries: {} });
    expect(target.setItem).not.toHaveBeenCalled();
    expect(target.removeItem).not.toHaveBeenCalled();
    expect(reads.source.score).not.toHaveBeenCalled();
  });

  it('denied storage still permits an accepted in-memory addition', () => {
    const reads = harness(), access = () => { throw new Error('Storage unavailable'); };
    const controller = createComparisonController(reads.source, access);
    expect(controller.dispatch({ type: 'add', postal: first })).toBeNull();
    expect(controller.getSnapshot()).toMatchObject({ restored: true, storageUnavailable: true,
      state: { ...emptyComparisonState(), postals: [first], activePostal: first }, open: false });
    expect(reads.source.score).not.toHaveBeenCalled();
  });

  it('dispatch restores before writing and saves the stored shortlist plus the new postal', () => {
    const value = setup();
    expect(value.controller.dispatch({ type: 'add', postal: second })).toBeNull();
    expect(value.target.getItem.mock.invocationCallOrder[0]).toBeLessThan(value.target.setItem.mock.invocationCallOrder[0]);
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
    const [key, raw] = value.target.setItem.mock.calls[0];
    expect(key).toBe(COMPARISON_STORAGE_KEY);
    expect(JSON.parse(raw)).toEqual({ ...persisted([first, second]), activePostal: second });
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['activePostal', 'category', 'postals', 'version']);
  });

  it('invalid, duplicate and fourth-postal actions do not persist or change state', () => {
    const value = setup([first, second, third]); value.controller.restore();
    const before = value.controller.getSnapshot();
    expect(value.controller.dispatch({ type: 'add', postal: '018956\n' })).toBe('invalid_postal');
    expect(value.controller.dispatch({ type: 'add', postal: second })).toBe('duplicate');
    expect(value.controller.dispatch({ type: 'add', postal: '001001' })).toBe('limit');
    expect(value.controller.getSnapshot()).toEqual(before);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('accepted no-op activation/category and empty reset do not write storage', () => {
    const value = setup(); value.controller.restore();
    expect(value.controller.dispatch({ type: 'activate', postal: first })).toBeNull();
    expect(value.controller.dispatch({ type: 'category', category: 'bus' })).toBeNull();
    expect(value.target.setItem).not.toHaveBeenCalled();
    const empty = setup([]); empty.controller.restore();
    expect(empty.controller.dispatch({ type: 'reset' })).toBeNull();
    expect(empty.target.setItem).not.toHaveBeenCalled();
  });

  it('adding activates the postal but never implicitly opens comparison or fetches while closed', async () => {
    const value = setup(); value.controller.restore();
    value.controller.dispatch({ type: 'add', postal: second }); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ open: false, entries: {}, state: { activePostal: second } });
    expect(value.source.score).not.toHaveBeenCalled();
    expect(value.source.geometry).not.toHaveBeenCalled();
  });

  it('a quota failure leaves the accepted state usable instead of rolling back the user action', () => {
    const value = setup(); value.target.setItem.mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(value.controller.dispatch({ type: 'add', postal: second })).toBeNull();
    expect(value.controller.getSnapshot()).toMatchObject({ storageUnavailable: true,
      state: { postals: [first, second], activePostal: second } });
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
    expect(value.target.removeItem).not.toHaveBeenCalled();
  });
});

describe('T10 controller: independent score and geometry delivery', () => {
  it('opening starts both sources for every listed postal without waiting for score promises', async () => {
    const value = setup([first, second]); await open(value);
    expect(value.source.score.mock.calls).toEqual([[first], [second]]);
    expect(value.source.geometry.mock.calls).toEqual([[first], [second]]);
    expect(entry(value.controller)).toEqual({ postal: first, status: 'loading', geometryStatus: 'loading', row: null, option: null });
    expect(entry(value.controller, second).status).toBe('loading');
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('score-first delivery exposes useful four-metric text while geometry is still pending', async () => {
    const value = setup(); await open(value);
    request(value.scores).resolve(score()); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'loading',
      row: { metrics: busMetrics, availability: 'partial', reason: 'geometry_incomplete' } });
    request(value.geometries).resolve(geometry()); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'ready', row: { metrics: busMetrics, availability: 'available' } });
  });

  it('geometry-first delivery cannot fabricate a row before its score arrives', async () => {
    const value = setup(); await open(value);
    request(value.geometries).resolve(geometry()); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'loading', geometryStatus: 'ready', row: null, option: null });
    request(value.scores).resolve(score()); await flush();
    expect(entry(value.controller).row?.metrics).toEqual(busMetrics);
  });

  it('inactive columns receive their own results without changing the active postal', async () => {
    const value = setup([first, second]); await open(value);
    await deliver(value, second);
    expect(entry(value.controller, second)).toMatchObject({ postal: second, status: 'ready', row: { postal: second, reason: 'default_unrouted' } });
    expect(entry(value.controller).status).toBe('loading');
    expect(value.controller.getSnapshot().state.activePostal).toBe(first);
  });

  it('repeated opening and active-column changes do not refetch already loading entries', async () => {
    const value = setup([first, second]); await open(value);
    value.controller.setOpen(true);
    value.controller.dispatch({ type: 'activate', postal: second }); await flush();
    expect(value.source.score).toHaveBeenCalledTimes(2);
    expect(value.source.geometry).toHaveBeenCalledTimes(2);
    expect(value.controller.getSnapshot().state.activePostal).toBe(second);
  });

  it('a missing score produces an unavailable context row, not a synthesized score from geometry', async () => {
    const value = setup(); await open(value);
    request(value.scores).resolve(null); request(value.geometries).resolve(geometry()); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'ready', option: null,
      row: { availability: 'unavailable', reason: 'context_invalid', metrics: { distance: null, coverage: null, uncovered: null, longest: null } } });
  });

  it('score rejection remains an error after successful geometry delivery', async () => {
    const value = setup(); await open(value);
    request(value.scores).reject(new Error('Score failed')); await flush();
    request(value.geometries).resolve(geometry()); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'error', geometryStatus: 'ready', row: null, option: null });
  });

  it('geometry failure preserves independently valid score metrics', async () => {
    const value = setup(); await open(value);
    request(value.scores).resolve(score()); request(value.geometries).reject(new Error('Geometry failed')); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'error', row: { metrics: busMetrics, reason: 'geometry_incomplete' } });
  });

  it.each(['score', 'geometry'] as const)('contains synchronous %s throws without preventing the other request', async failing => {
    const value = setup();
    value.source[failing].mockImplementation(() => { throw new Error(`Synchronous ${failing} failure`); });
    expect(() => { value.controller.restore(); value.controller.setOpen(true); }).not.toThrow();
    await flush();
    expect(value.source.score).toHaveBeenCalledExactlyOnceWith(first);
    expect(value.source.geometry).toHaveBeenCalledExactlyOnceWith(first);
    if (failing === 'score') {
      request(value.geometries).resolve(geometry()); await flush();
      expect(entry(value.controller)).toMatchObject({ status: 'error', geometryStatus: 'ready', row: null, option: null });
    } else {
      request(value.scores).resolve(score()); await flush();
      expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'error', row: { metrics: busMetrics } });
    }
  });
});

describe('T10 controller: lifecycle invalidation of late deliveries', () => {
  it('closing clears entries, starts no requests and ignores late successful deliveries', async () => {
    const value = setup(); await open(value);
    value.controller.setOpen(false);
    expect(value.controller.getSnapshot()).toMatchObject({ open: false, entries: {} });
    const closed = value.controller.getSnapshot();
    await deliver(value);
    expect(value.controller.getSnapshot()).toEqual(closed);
    expect(value.source.score).toHaveBeenCalledTimes(1);
    expect(value.source.geometry).toHaveBeenCalledTimes(1);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('late score and geometry rejections after closure cannot restore error entries', async () => {
    const value = setup(); await open(value); value.controller.setOpen(false);
    request(value.scores).reject(new Error('Late score failure'));
    request(value.geometries).reject(new Error('Late geometry failure')); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ open: false, entries: {} });
  });

  it('close/reopen uses fresh tokens so old payloads cannot overwrite a new ready row', async () => {
    const value = setup(); await open(value);
    value.controller.setOpen(false); value.controller.setOpen(true); await flush();
    await deliver(value, first, 1);
    const ready = value.controller.getSnapshot();
    request(value.scores).resolve(null); request(value.geometries).reject(new Error('Old geometry')); await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
    expect(entry(value.controller).row?.metrics).toEqual(busMetrics);
  });

  it('removing one open entry does not reload or remove another column', async () => {
    const value = setup([first, second]); await open(value); await deliver(value, second);
    const other = entry(value.controller, second);
    value.controller.dispatch({ type: 'remove', postal: first }); await flush();
    expect(value.controller.getSnapshot().entries[first]).toBeUndefined();
    expect(entry(value.controller, second)).toEqual(other);
    expect(value.source.score).toHaveBeenCalledTimes(2);
    expect(value.source.geometry).toHaveBeenCalledTimes(2);
    await deliver(value);
    expect(value.controller.getSnapshot().entries[first]).toBeUndefined();
  });

  it.each(['score', 'geometry', 'failure'] as const)('remove/re-add rejects old %s delivery for the same postal', async delivery => {
    const value = setup(); await open(value);
    value.controller.dispatch({ type: 'remove', postal: first });
    value.controller.dispatch({ type: 'add', postal: first }); await flush();
    await deliver(value, first, 1);
    const ready = value.controller.getSnapshot();
    if (delivery === 'score') request(value.scores).resolve(null);
    if (delivery === 'geometry') request(value.geometries).resolve(null);
    if (delivery === 'failure') {
      request(value.scores).reject(new Error('Old score'));
      request(value.geometries).reject(new Error('Old geometry'));
    }
    await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
    expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'ready', row: { metrics: busMetrics } });
  });

  it('category ABA invalidates both earlier requests even after the category returns to its original value', async () => {
    const value = setup(); await open(value);
    value.controller.dispatch({ type: 'category', category: 'mrt_lrt' }); await flush();
    value.controller.dispatch({ type: 'category', category: 'bus' }); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'loading', geometryStatus: 'loading', row: null, option: null });
    await deliver(value, first, 2);
    const ready = value.controller.getSnapshot();
    request(value.scores, first, 0).resolve(null);
    request(value.geometries, first, 0).resolve(null);
    request(value.scores, first, 1).reject(new Error('Obsolete category score'));
    request(value.geometries, first, 1).reject(new Error('Obsolete category geometry')); await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
    expect(entry(value.controller).row?.category).toBe('bus');
  });

  it('retry is scoped to one listed postal and rejects its preceding request while preserving other columns', async () => {
    const value = setup([first, second]); await open(value); await deliver(value, second);
    const other = entry(value.controller, second);
    value.controller.retry(first); await flush();
    expect(value.scores.map(item => item.postal)).toEqual([first, second, first]);
    expect(value.geometries.map(item => item.postal)).toEqual([first, second, first]);
    expect(entry(value.controller, second)).toEqual(other);
    await deliver(value, first, 1);
    const ready = value.controller.getSnapshot();
    request(value.scores).reject(new Error('Previous attempt'));
    request(value.geometries).resolve(null); await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
  });

  it('retry after a current failure can recover both row and geometry', async () => {
    const value = setup(); await open(value);
    request(value.scores).reject(new Error('Score unavailable'));
    request(value.geometries).reject(new Error('Geometry unavailable')); await flush();
    value.controller.retry(first); await flush(); await deliver(value, first, 1);
    expect(entry(value.controller)).toMatchObject({ status: 'ready', geometryStatus: 'ready', row: { metrics: busMetrics } });
  });

  it('retry for a closed view or absent postal never starts a request', async () => {
    const value = setup(); value.controller.restore(); value.controller.retry(first); await flush();
    expect(value.source.score).not.toHaveBeenCalled();
    await open(value); value.controller.retry(second); await flush();
    expect(value.source.score).toHaveBeenCalledExactlyOnceWith(first);
    expect(value.source.geometry).toHaveBeenCalledExactlyOnceWith(first);
  });

  it('an open bundle replacement uses only the new source and rejects old-bundle callbacks', async () => {
    const value = setup(); await open(value);
    const replacement = harness('synthetic-new-bundle');
    value.controller.setSource(replacement.source); await flush(); await deliver(replacement);
    const ready = value.controller.getSnapshot();
    expect(entry(value.controller).row?.bundle).toBe('synthetic-new-bundle');
    request(value.scores).resolve(null); request(value.geometries).reject(new Error('Old bundle')); await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
  });

  it.each(['score', 'geometry'] as const)('changing only the %s source function at the same bundle still invalidates old work', async changed => {
    const value = setup(); await open(value);
    const replacement = harness();
    value.controller.setSource({ ...value.source, [changed]: replacement.source[changed] }); await flush();
    expect(value.source.score).toHaveBeenCalledTimes(changed === 'score' ? 1 : 2);
    expect(value.source.geometry).toHaveBeenCalledTimes(changed === 'geometry' ? 1 : 2);
    const newestScore = changed === 'score' ? request(replacement.scores) : request(value.scores, first, 1);
    const newestGeometry = changed === 'geometry' ? request(replacement.geometries) : request(value.geometries, first, 1);
    newestScore.resolve(score()); newestGeometry.resolve(geometry()); await flush();
    const ready = value.controller.getSnapshot();
    request(value.scores).resolve(null); request(value.geometries).resolve(null); await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
  });

  it('replacing a source while closed performs no reads until opening with the replacement', async () => {
    const value = setup(); value.controller.restore(); const replacement = harness('synthetic-new-bundle');
    value.controller.setSource(replacement.source); await flush();
    expect(value.source.score).not.toHaveBeenCalled(); expect(replacement.source.score).not.toHaveBeenCalled();
    expect(value.controller.getSnapshot().entries).toEqual({});
    value.controller.setOpen(true); await flush();
    expect(replacement.source.score).toHaveBeenCalledExactlyOnceWith(first);
    expect(replacement.source.geometry).toHaveBeenCalledExactlyOnceWith(first);
    expect(value.source.score).not.toHaveBeenCalled();
  });
});

describe('T10 controller: source-pinned comparison evidence and subscriptions', () => {
  it('keeps the declared source for both metric row and option when a healthier top alias exists', async () => {
    const value = setup(); await open(value);
    const rawScore = score(), rawGeometry = geometry()!;
    rawScore.exposure_gaps = null;
    delete rawGeometry.route_options!.bus;
    request(value.scores).resolve(rawScore); request(value.geometries).resolve(rawGeometry); await flush();
    const result = entry(value.controller);
    expect(result.row).toMatchObject({ metrics: busMetrics, reason: 'geometry_incomplete', selectionRef: { kind: 'category_default', category: 'bus' } });
    expect(result.option?.selectedSource.selectionRef).toEqual(result.row?.selectionRef);
    expect(result.option?.geometry.sheltered.status).toBe('missing');
    expect(result.option?.gaps.sheltered.logical.total_m).toMatchObject({ status: 'valid', value: 36.5 });
    expect(result.option?.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
  });

  it('partial declared-source metric conflict yields an unavailable row and no map option', async () => {
    const value = setup(); await open(value);
    const rawScore = score() as unknown as Mutable, rawGeometry = geometry() as unknown as Mutable;
    rawScore.route_options.bus.paths.sheltered_m += 1;
    const parts = rawGeometry.route_options.bus.sheltered_parts;
    rawGeometry.route_options.bus.sheltered_parts = [parts[0], '_'];
    request(value.scores).resolve(rawScore as ScoreRecord); request(value.geometries).resolve(rawGeometry as PostalGeom); await flush();
    expect(entry(value.controller)).toMatchObject({ status: 'ready', option: null, row: { availability: 'unavailable', reason: 'evidence_conflict',
      metrics: { distance: null, coverage: null, uncovered: null, longest: null } } });
  });

  it.each(['score', 'geometry'] as const)('a mismatched %s postal rejects the row context and any map option', async wrong => {
    const value = setup(); await open(value);
    const rawGeometry = geometry()!; if (wrong === 'geometry') rawGeometry.postal = second;
    request(value.scores).resolve(score(wrong === 'score' ? second : first));
    request(value.geometries).resolve(rawGeometry); await flush();
    expect(entry(value.controller)).toMatchObject({ option: null, row: { availability: 'unavailable', reason: 'context_invalid' } });
  });

  it('a live-preview-shaped score cannot borrow published comparison metrics or a map option', async () => {
    const value = setup(); await open(value);
    const raw = score(); raw.provenance = { source: 'live_onemap_preview', authoritative_score: false };
    request(value.scores).resolve(raw); request(value.geometries).resolve(geometry()); await flush();
    expect(entry(value.controller)).toMatchObject({ option: null, row: { reason: 'preview_only', availability: 'unavailable' } });
  });

  it('does not mutate frozen fixture-derived score or geometry payloads', async () => {
    const value = setup(); await open(value);
    const rawScore = score(), rawGeometry = geometry(), before = JSON.stringify([rawScore, rawGeometry]);
    freeze(rawScore); freeze(rawGeometry);
    request(value.scores).resolve(rawScore); request(value.geometries).resolve(rawGeometry); await flush();
    expect(entry(value.controller).row?.metrics).toEqual(busMetrics);
    expect(JSON.stringify([rawScore, rawGeometry])).toBe(before);
  });

  it('subscriptions observe coherent snapshots and unsubscribe stops later notifications', async () => {
    const value = setup(), observed: Snapshot[] = [];
    const listener = vi.fn(() => { observed.push(value.controller.getSnapshot()); });
    const unsubscribe = value.controller.subscribe(listener);
    await open(value); await deliver(value);
    expect(listener).toHaveBeenCalled();
    expect(observed.at(-1)).toBe(value.controller.getSnapshot());
    expect(value.controller.getSnapshot()).toBe(value.controller.getSnapshot());
    const count = listener.mock.calls.length; unsubscribe(); unsubscribe();
    value.controller.setOpen(false); await flush();
    expect(listener).toHaveBeenCalledTimes(count);
  });
});
