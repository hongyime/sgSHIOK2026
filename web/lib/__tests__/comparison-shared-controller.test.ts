import { describe, expect, it, vi } from 'vitest';
import { createComparisonController } from '../comparison-controller';
import { COMPARISON_STORAGE_KEY, transitionComparison, type ComparisonAction, type ComparisonState } from '../comparison-state';
import type { ScoreRecord, PostalGeom } from '../types';
import fixture from './fixtures/published-options.json';

type Controller = ReturnType<typeof createComparisonController>;
type Deferred<T> = { postal: string; promise: Promise<T>; resolve(value: T): void; reject(error: Error): void };
const first = '018956', second = '018990', third = '079908';
const bundle = 'generated_20260805_prefer_scored_routed';
const busMetrics = { distance: 81.2, coverage: 55, uncovered: 36.5, longest: 20.2 };

function state(postals: string[] = [first, second], category: ComparisonState['category'] = 'bus'): ComparisonState {
  return { version: 1, postals, category, activePostal: postals[0] ?? null };
}

function deferred<T>(postal: string): Deferred<T> {
  let resolve!: (value: T) => void, reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { postal, promise, resolve, reject };
}

function harness(sourceBundle = bundle) {
  const scores: Deferred<ScoreRecord | null>[] = [], geometries: Deferred<PostalGeom | null>[] = [];
  const source = {
    bundle: sourceBundle,
    score: vi.fn((postal: string) => { const request = deferred<ScoreRecord | null>(postal); scores.push(request); return request.promise; }),
    geometry: vi.fn((postal: string) => { const request = deferred<PostalGeom | null>(postal); geometries.push(request); return request.promise; }),
  };
  return { source, scores, geometries };
}

function setup(local = state([third], 'mrt_lrt')) {
  let stored = JSON.stringify(local);
  const target = {
    getItem: vi.fn((_key: string) => stored),
    setItem: vi.fn((_key: string, value: string) => { stored = value; }),
    removeItem: vi.fn(() => { throw new Error('Must not delete storage'); }),
    clear: vi.fn(() => { throw new Error('Must not clear storage'); }),
    key: vi.fn(() => { throw new Error('Must not enumerate storage'); }),
  };
  const requests = harness();
  return { ...requests, target, local, controller: createComparisonController(requests.source, () => target) };
}

async function flush() {
  for (let index = 0; index < 8; index++) await Promise.resolve();
}

async function load(value: ReturnType<typeof setup>, shared = state()) {
  expect(value.controller.loadShared(shared)).toBe(true);
  await flush();
}

function request<T>(requests: Deferred<T>[], postal = first, occurrence = 0) {
  const found = requests.filter(item => item.postal === postal)[occurrence];
  expect(found, `request ${postal} #${occurrence}`).toBeDefined();
  return found;
}

async function deliver(value: Pick<ReturnType<typeof setup>, 'scores' | 'geometries'>, postal = first, occurrence = 0) {
  const score = structuredClone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(item => item.postal === postal)) as unknown as ScoreRecord;
  const geometry = postal === first ? structuredClone(fixture['geom/h3/886520db39fffff.json'][0]) as unknown as PostalGeom : null;
  request(value.scores, postal, occurrence).resolve(score);
  request(value.geometries, postal, occurrence).resolve(geometry);
  await flush();
}

function entry(controller: Controller, postal = first) {
  const result = controller.getSnapshot().entries[postal];
  expect(result, `entry ${postal}`).toBeDefined();
  return result;
}

describe('T11 shared controller: temporary state never silently overwrites local state', () => {
  it('initializes unshared without storage access or fetching', () => {
    const value = setup();
    expect(value.controller.getSnapshot().shared).toBe(false);
    expect(value.target.getItem).not.toHaveBeenCalled();
    expect(value.target.setItem).not.toHaveBeenCalled();
    expect(value.source.score).not.toHaveBeenCalled();
  });

  it('a valid import restores local once, opens shared state and fetches only the imported shortlist', async () => {
    const value = setup(); await load(value);
    expect(value.controller.getSnapshot()).toMatchObject({ state: state(), shared: true, open: true, restored: true });
    expect(value.target.getItem).toHaveBeenCalledExactlyOnceWith(COMPARISON_STORAGE_KEY);
    expect(value.target.setItem).not.toHaveBeenCalled();
    expect(value.source.score.mock.calls).toEqual([[first], [second]]);
    expect(value.source.geometry.mock.calls).toEqual([[first], [second]]);
    expect(value.target.removeItem).not.toHaveBeenCalled();
    expect(value.target.clear).not.toHaveBeenCalled();
    expect(value.target.key).not.toHaveBeenCalled();
  });

  it('invalid, empty, sparse and excess-field imports have no effects even before local restore', async () => {
    const sparse = [first]; sparse.length = 2;
    const invalid = [null, {}, state([]), { ...state(), version: 2 }, { ...state(), postals: [first, first] },
      { ...state(), postals: [first, second, third, '001001'] }, { ...state(), activePostal: third },
      { ...state(), postals: sparse }, { ...state(), reports: ['synthetic-private-note'] }];
    for (const shared of invalid) {
      const value = setup(), initial = value.controller.getSnapshot();
      expect(value.controller.loadShared(shared as ComparisonState)).toBe(false); await flush();
      expect(value.controller.getSnapshot()).toEqual(initial);
      expect(value.target.getItem).not.toHaveBeenCalled();
      expect(value.target.setItem).not.toHaveBeenCalled();
      expect(value.source.score).not.toHaveBeenCalled();
      expect(value.source.geometry).not.toHaveBeenCalled();
    }
  });

  it('an invalid second import cannot disturb an active temporary shortlist or its ready result', async () => {
    const value = setup(); await load(value, state([first])); await deliver(value);
    const ready = value.controller.getSnapshot();
    expect(value.controller.loadShared({ ...state(), notes: 'synthetic-note' } as ComparisonState)).toBe(false); await flush();
    expect(value.controller.getSnapshot()).toEqual(ready);
    expect(value.source.score).toHaveBeenCalledTimes(1);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('does not mutate a frozen imported state when later temporary actions change selection or category', async () => {
    const value = setup(), shared = state(), before = structuredClone(shared);
    Object.freeze(shared.postals); Object.freeze(shared);
    await load(value, shared);
    value.controller.dispatch({ type: 'activate', postal: second });
    value.controller.dispatch({ type: 'category', category: 'mrt_lrt' });
    value.controller.dispatch({ type: 'remove', postal: first });
    expect(shared).toEqual(before);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it.each([
    { type: 'add', postal: third }, { type: 'remove', postal: first }, { type: 'activate', postal: second },
    { type: 'category', category: 'mrt_lrt' }, { type: 'reset' },
  ] satisfies ComparisonAction[])('shared $type remains ephemeral and discard recovers the original local state', async action => {
    const value = setup(), shared = state(); await load(value, shared);
    expect(value.controller.dispatch(action)).toBeNull(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: true, state: transitionComparison(shared, action).state });
    expect(value.target.setItem).not.toHaveBeenCalled();
    value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, state: value.local });
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('duplicate, invalid and fourth-entry actions cannot persist or replace shared state', async () => {
    const value = setup(); await load(value, state([first, second, third]));
    const before = value.controller.getSnapshot();
    expect(value.controller.dispatch({ type: 'add', postal: second })).toBe('duplicate');
    expect(value.controller.dispatch({ type: 'add', postal: '001001' })).toBe('limit');
    expect(value.controller.dispatch({ type: 'add', postal: '018956\n' })).toBe('invalid_postal');
    expect(value.controller.getSnapshot()).toEqual(before);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('closing preserves temporary state, and adding while closed does not fetch or persist', async () => {
    const value = setup(); await load(value, state([first]));
    value.controller.setOpen(false);
    expect(value.controller.getSnapshot()).toMatchObject({ shared: true, open: false, state: state([first]), entries: {} });
    value.controller.dispatch({ type: 'add', postal: second }); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: true, open: false,
      state: { ...state([first, second]), activePostal: second }, entries: {} });
    expect(value.source.score).toHaveBeenCalledTimes(1);
    expect(value.target.setItem).not.toHaveBeenCalled();
    value.controller.setOpen(true); await flush();
    expect(value.scores.map(item => item.postal)).toEqual([first, first, second]);
  });

  it('a second valid import remembers original local state, not the preceding shared state', async () => {
    const value = setup(); await load(value, state([first])); await load(value, state([second]));
    value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, state: value.local });
    expect(value.target.getItem).toHaveBeenCalledTimes(1);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('later restore calls cannot replace a temporary shortlist with local storage', async () => {
    const value = setup(); await load(value);
    const imported = value.controller.getSnapshot();
    value.controller.restore();
    expect(value.controller.getSnapshot()).toEqual(imported);
    expect(value.target.getItem).toHaveBeenCalledTimes(1);
  });
});

describe('T11 shared controller: explicit save and in-memory local fallback', () => {
  it('only explicit save writes current state to the owned key and promotes it to local state', async () => {
    const value = setup(); await load(value, state([first])); await deliver(value);
    value.controller.dispatch({ type: 'add', postal: second }); await flush();
    const saved = structuredClone(value.controller.getSnapshot().state), requests = value.scores.length;
    expect(value.target.setItem).not.toHaveBeenCalled();
    expect(value.controller.saveShared()).toBe(true);
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, state: saved, storageUnavailable: false });
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
    const [key, raw] = value.target.setItem.mock.calls[0];
    expect(key).toBe(COMPARISON_STORAGE_KEY); expect(JSON.parse(raw)).toEqual(saved);
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['activePostal', 'category', 'postals', 'version']);
    expect(value.scores).toHaveLength(requests);
    await load(value, state([third])); value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot().state).toEqual(saved);
  });

  it('saving or discarding when not shared neither rewrites storage nor starts requests', async () => {
    const value = setup(); value.controller.restore(); const local = value.controller.getSnapshot();
    expect(value.controller.saveShared()).toBe(true);
    value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot()).toEqual(local);
    expect(value.target.setItem).not.toHaveBeenCalled();
    expect(value.source.score).not.toHaveBeenCalled();
  });

  it('save failure keeps the temporary state and original local fallback, and reports unavailable storage', async () => {
    const value = setup(); await load(value, state([first]));
    value.target.setItem.mockImplementation(() => { throw new Error('QuotaExceededError'); });
    const shared = structuredClone(value.controller.getSnapshot().state);
    expect(value.controller.saveShared()).toBe(false);
    expect(value.controller.getSnapshot()).toMatchObject({ shared: true, state: shared, storageUnavailable: true });
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
    value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, state: value.local });
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
    expect(value.target.removeItem).not.toHaveBeenCalled();
  });

  it('a later successful explicit save clears the unavailable flag and commits the current temporary edits', async () => {
    const value = setup(); const save = value.target.setItem.getMockImplementation()!;
    await load(value, state([first]));
    value.target.setItem.mockImplementation(() => { throw new Error('Denied'); });
    expect(value.controller.saveShared()).toBe(false);
    value.controller.dispatch({ type: 'add', postal: second });
    value.target.setItem.mockImplementation(save);
    expect(value.controller.saveShared()).toBe(true);
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, storageUnavailable: false,
      state: { ...state([first, second]), activePostal: second } });
    expect(value.target.setItem).toHaveBeenCalledTimes(2);
  });

  it('local actions after explicit save resume normal persistence rather than staying ephemeral', async () => {
    const value = setup(); await load(value, state([first]));
    expect(value.controller.saveShared()).toBe(true);
    expect(value.controller.dispatch({ type: 'add', postal: second })).toBeNull();
    expect(value.target.setItem).toHaveBeenCalledTimes(2);
    expect(value.controller.getSnapshot().shared).toBe(false);
  });

  it('discard restores latest local in-memory state even when its earlier storage write failed', async () => {
    const value = setup(state([first])); value.controller.restore();
    value.target.setItem.mockImplementation(() => { throw new Error('Local write denied'); });
    expect(value.controller.dispatch({ type: 'add', postal: third })).toBeNull();
    const remembered = structuredClone(value.controller.getSnapshot().state);
    expect(remembered).toEqual({ ...state([first, third]), activePostal: third });
    await load(value, state([second]));
    value.controller.dispatch({ type: 'category', category: 'mrt_lrt' });
    value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, state: remembered });
    expect(value.target.getItem).toHaveBeenCalledTimes(1);
    expect(value.target.setItem).toHaveBeenCalledTimes(1);
  });
});

describe('T11 shared controller: discard and import invalidate every old delivery', () => {
  it('discard while open starts local requests and rejects late temporary score and geometry delivery', async () => {
    const value = setup(state([second], 'mrt_lrt')); await load(value, state([first]));
    value.controller.discardShared(); await flush(); await deliver(value, second);
    const local = value.controller.getSnapshot();
    expect(local).toMatchObject({ shared: false, open: true, state: value.local });
    expect(Object.keys(local.entries)).toEqual([second]);
    request(value.scores).resolve(null); request(value.geometries).reject(new Error('Discarded geometry')); await flush();
    expect(value.controller.getSnapshot()).toEqual(local);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('discard while closed restores local state but starts no reads until reopened', async () => {
    const value = setup(); await load(value, state([first]));
    value.controller.setOpen(false); const count = value.scores.length;
    value.controller.discardShared(); await flush();
    expect(value.controller.getSnapshot()).toMatchObject({ shared: false, open: false, state: value.local, entries: {} });
    expect(value.scores).toHaveLength(count);
    expect(value.geometries).toHaveLength(count);
    value.controller.setOpen(true); await flush();
    expect(value.scores.map(item => item.postal)).toEqual([first, third]);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('import A/B/A uses new tokens even when the final postal/category equals the original import', async () => {
    const value = setup(); await load(value, state([first]));
    await load(value, state([second])); await load(value, state([first]));
    await deliver(value, first, 1); const latest = value.controller.getSnapshot();
    request(value.scores, first, 0).resolve(null);
    request(value.geometries, first, 0).reject(new Error('Old A geometry'));
    request(value.scores, second, 0).reject(new Error('Old B score'));
    request(value.geometries, second, 0).resolve(null); await flush();
    expect(value.controller.getSnapshot()).toEqual(latest);
    expect(entry(value.controller).row?.metrics).toEqual(busMetrics);
    expect(value.controller.getSnapshot().entries[second]).toBeUndefined();
  });

  it('shared close/reopen renews delivery identity while retaining temporary state', async () => {
    const value = setup(); await load(value, state([first]));
    value.controller.setOpen(false); value.controller.setOpen(true); await flush();
    await deliver(value, first, 1); const latest = value.controller.getSnapshot();
    request(value.scores).reject(new Error('Before close score'));
    request(value.geometries).resolve(null); await flush();
    expect(value.controller.getSnapshot()).toEqual(latest);
    expect(latest).toMatchObject({ shared: true, state: state([first]), open: true });
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('source replacement during sharing rejects old-source results without implicitly saving or discarding', async () => {
    const value = setup(); await load(value, state([first]));
    const replacement = harness('synthetic-new-bundle');
    value.controller.setSource(replacement.source); await flush(); await deliver(replacement);
    const latest = value.controller.getSnapshot();
    expect(latest).toMatchObject({ shared: true, state: state([first]) });
    expect(entry(value.controller).row?.bundle).toBe('synthetic-new-bundle');
    request(value.scores).resolve(null); request(value.geometries).reject(new Error('Previous source')); await flush();
    expect(value.controller.getSnapshot()).toEqual(latest);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });

  it('discard cannot revive pre-import local requests when returning to the same local postal', async () => {
    const value = setup(state([first])); value.controller.restore(); value.controller.setOpen(true); await flush();
    await load(value, state([second])); value.controller.discardShared(); await flush();
    await deliver(value, first, 1); const latest = value.controller.getSnapshot();
    request(value.scores, first, 0).resolve(null); request(value.geometries, first, 0).resolve(null);
    request(value.scores, second, 0).reject(new Error('Old temporary score'));
    request(value.geometries, second, 0).reject(new Error('Old temporary geometry')); await flush();
    expect(value.controller.getSnapshot()).toEqual(latest);
    expect(entry(value.controller).row?.metrics).toEqual(busMetrics);
    expect(value.target.setItem).not.toHaveBeenCalled();
  });
});
