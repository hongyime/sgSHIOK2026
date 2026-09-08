import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COMPARISON_STORAGE_KEY,
  MAX_COMPARISON_POSTALS,
  MAX_COMPARISON_STATE_CHARS,
  comparisonRequestMatches,
  decodeComparisonState,
  emptyComparisonState,
  encodeComparisonState,
  readComparisonState,
  transitionComparison,
  writeComparisonState,
  type ComparisonRequest,
  type ComparisonState,
} from '../comparison-state';

// These postals are synthetic identifiers, not evidence about published walks.
const postals = ['001001', '002002', '003003'] as const;
const spare = '004004';
const unknownPostals = ['', '00100', '0010010', ' 001001', '001001 ', '001001\n', '001001\r\n', '00a001', 1001, null, ['001001']];

function state(category: ComparisonState['category'] = 'mrt_lrt'): ComparisonState {
  return { version: 1, postals: [...postals], category, activePostal: postals[1] };
}

function frozen(value: ComparisonState): ComparisonState {
  Object.freeze(value.postals);
  return Object.freeze(value);
}

function action(value: unknown): Parameters<typeof transitionComparison>[1] {
  return value as Parameters<typeof transitionComparison>[1];
}

function storage(raw: string | null = null) {
  return {
    getItem: vi.fn((_key: string): string | null => raw),
    setItem: vi.fn((_key: string, _value: string): void => {}),
    removeItem: vi.fn(() => { throw new Error('Comparison must not delete storage'); }),
    clear: vi.fn(() => { throw new Error('Comparison must not clear storage'); }),
    key: vi.fn(() => { throw new Error('Comparison must not enumerate storage'); }),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('T09: bounded comparison state transitions', () => {
  it('pins the storage contract and creates an independent empty MRT state', () => {
    expect(COMPARISON_STORAGE_KEY).toBe('shiok:comparison:v1');
    expect(MAX_COMPARISON_POSTALS).toBe(3);
    expect(MAX_COMPARISON_STATE_CHARS).toBe(1024);
    const first = emptyComparisonState(), second = emptyComparisonState();
    expect(first).toEqual({ version: 1, postals: [], category: 'mrt_lrt', activePostal: null });
    expect(first).not.toBe(second);
    expect(first.postals).not.toBe(second.postals);
  });

  it('initializes an explicitly requested bus category without a selected postal', () => {
    expect(emptyComparisonState('bus')).toEqual({ version: 1, postals: [], category: 'bus', activePostal: null });
  });

  it('adds and activates an exact six-digit identifier while retaining its leading zeros', () => {
    const original = frozen(emptyComparisonState('bus'));
    const result = transitionComparison(original, { type: 'add', postal: postals[0] });
    expect(result).toEqual({ reason: null, state: { version: 1, postals: [postals[0]], category: 'bus', activePostal: postals[0] } });
    expect(original).toEqual(emptyComparisonState('bus'));
  });

  it('does not reorder or activate an already present postal on duplicate add', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'add', postal: postals[0] })).toEqual({ state: original, reason: 'duplicate' });
  });

  it('rejects a fourth postal without dropping another entry or changing the active postal', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'add', postal: spare })).toEqual({ state: original, reason: 'limit' });
  });

  it('rejects malformed postals for every postal action without trimming or coercion', () => {
    const original = frozen(state());
    for (const type of ['add', 'remove', 'activate']) for (const postal of unknownPostals) {
      expect(transitionComparison(original, action({ type, postal })), `${type}: ${JSON.stringify(postal)}`)
        .toEqual({ state: original, reason: 'invalid_postal' });
    }
  });

  it('removes an inactive postal without changing the existing active postal', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'remove', postal: postals[0] }))
      .toEqual({ reason: null, state: { ...original, postals: [postals[1], postals[2]] } });
  });

  it('removing the active middle postal chooses the next remaining entry at the same index', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'remove', postal: postals[1] }))
      .toEqual({ reason: null, state: { ...original, postals: [postals[0], postals[2]], activePostal: postals[2] } });
  });

  it('removing the active last postal chooses the previous entry', () => {
    const original = frozen({ ...state(), activePostal: postals[2] });
    expect(transitionComparison(original, { type: 'remove', postal: postals[2] }))
      .toEqual({ reason: null, state: { ...original, postals: [postals[0], postals[1]], activePostal: postals[1] } });
  });

  it('removing the only postal clears the active postal but retains the category', () => {
    const original = frozen({ version: 1, category: 'bus', postals: [postals[0]], activePostal: postals[0] });
    expect(transitionComparison(original, { type: 'remove', postal: postals[0] }))
      .toEqual({ reason: null, state: emptyComparisonState('bus') });
  });

  it('removing a valid absent postal leaves state unchanged', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'remove', postal: spare })).toEqual({ state: original, reason: 'not_found' });
  });

  it('activates only an existing postal without reordering the list', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'activate', postal: postals[2] }))
      .toEqual({ reason: null, state: { ...original, activePostal: postals[2] } });
  });

  it('does not implicitly add a valid absent postal on activation', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'activate', postal: spare })).toEqual({ state: original, reason: 'not_found' });
  });

  it('changes the common category while preserving order and active postal', () => {
    const original = frozen(state());
    expect(transitionComparison(original, { type: 'category', category: 'bus' }))
      .toEqual({ reason: null, state: { ...original, category: 'bus' } });
  });

  it('rejects malformed categories instead of coercing them to supported values', () => {
    const original = frozen(state());
    for (const category of ['BUS', 'mrt', '', null, ['bus'], 1]) {
      expect(transitionComparison(original, action({ type: 'category', category })), JSON.stringify(category))
        .toEqual({ state: original, reason: 'invalid_category' });
    }
  });

  it('reset clears the shortlist and active postal but preserves its category', () => {
    expect(transitionComparison(frozen(state('bus')), { type: 'reset' }))
      .toEqual({ reason: null, state: emptyComparisonState('bus') });
  });

  it('rejects invalid incoming state rather than silently normalizing it during a transition', () => {
    for (const invalid of [null, {}, { ...state(), version: 2 }, { ...state(), postals: [...postals, spare] }]) {
      expect(transitionComparison(invalid as ComparisonState, { type: 'reset' }).reason).toBe('invalid_state');
    }
  });

  it('rejects unknown, absent, and non-string action types without changing valid state', () => {
    const original = frozen(state());
    for (const invalid of [null, undefined, {}, [], { type: 'hydrate' }, { type: ['reset'] }, { type: 0 }]) {
      expect(transitionComparison(original, action(invalid)), JSON.stringify(invalid))
        .toEqual({ state: original, reason: 'invalid_action' });
    }
  });

  it('a sequence of transitions neither mutates retained earlier states nor stores request/history data', () => {
    const initial = frozen(emptyComparisonState());
    const first = frozen(transitionComparison(initial, { type: 'add', postal: postals[0] }).state);
    const second = frozen(transitionComparison(first, { type: 'add', postal: postals[1] }).state);
    const changed = transitionComparison(second, { type: 'category', category: 'bus' }).state;
    expect(initial.postals).toEqual([]);
    expect(first.postals).toEqual([postals[0]]);
    expect(second).toEqual({ version: 1, category: 'mrt_lrt', postals: [postals[0], postals[1]], activePostal: postals[1] });
    expect(Object.keys(changed).sort()).toEqual(['activePostal', 'category', 'postals', 'version']);
  });
});

describe('T09: strict bounded persistence codec', () => {
  it('round-trips empty, two-postal and three-postal states without reordering or coercing identifiers', () => {
    const values = [emptyComparisonState('bus'), { ...state(), postals: [postals[2], postals[1]] }, state()];
    for (const value of values) {
      const encoded = encodeComparisonState(frozen(value));
      expect(typeof encoded).toBe('string');
      expect(JSON.parse(encoded!)).toEqual(value);
      expect(Object.keys(JSON.parse(encoded!)).sort()).toEqual(['activePostal', 'category', 'postals', 'version']);
      expect(decodeComparisonState(encoded)).toEqual(value);
    }
  });

  it('decodes only JSON strings, not pre-parsed objects, nulls, numbers or coercible arrays', () => {
    for (const invalid of [null, undefined, false, 1, state(), [JSON.stringify(state())]]) {
      expect(decodeComparisonState(invalid)).toBeNull();
    }
  });

  it('fails closed for invalid JSON and non-object JSON payloads', () => {
    for (const raw of ['', '\n', '{', '{"version":1', 'null', '[]', '1', 'true', '"state"']) {
      expect(decodeComparisonState(raw), raw).toBeNull();
    }
  });

  it('rejects unknown or coercible versions instead of migrating implicitly', () => {
    for (const version of [0, 2, '1', null, [1]]) {
      expect(decodeComparisonState(JSON.stringify({ ...state(), version }))).toBeNull();
    }
  });

  it('rejects all excess keys including rows, history, reports, provenance and request identities', () => {
    for (const key of ['rows', 'history', 'reports', 'provenance', 'requestId', 'notes', '__proto__']) {
      expect(decodeComparisonState(JSON.stringify({ ...state(), [key]: 'synthetic-private-payload' })), key).toBeNull();
    }
  });

  it('requires all four fields even where a missing field might have a plausible default', () => {
    for (const key of ['version', 'postals', 'category', 'activePostal']) {
      const value: Record<string, unknown> = { ...state() };
      delete value[key];
      expect(decodeComparisonState(JSON.stringify(value)), key).toBeNull();
    }
  });

  it('rejects oversized, duplicate, malformed or non-array postal lists', () => {
    const lists = [null, postals.join(','), [...postals, spare], [postals[0], postals[0]], ...unknownPostals.map(postal => [postal])];
    for (const list of lists) {
      expect(decodeComparisonState(JSON.stringify({ ...state(), postals: list })), JSON.stringify(list)).toBeNull();
    }
  });

  it('rejects persisted unsupported categories instead of restoring a different category', () => {
    for (const category of ['BUS', 'mrt', '', null, ['mrt_lrt'], 1]) {
      expect(decodeComparisonState(JSON.stringify({ ...state(), category }))).toBeNull();
    }
  });

  it('rejects an active postal outside the shortlist and malformed active identities', () => {
    for (const activePostal of [spare, '001001\n', 1001, ['001001'], {}]) {
      expect(decodeComparisonState(JSON.stringify({ ...state(), activePostal }))).toBeNull();
    }
    expect(decodeComparisonState(JSON.stringify({ ...emptyComparisonState(), activePostal: postals[0] }))).toBeNull();
  });

  it('enforces the input character limit before permissive JSON whitespace could conceal an oversized payload', () => {
    const raw = JSON.stringify(state()).padEnd(MAX_COMPARISON_STATE_CHARS + 1, ' ');
    expect(JSON.parse(raw)).toEqual(state());
    expect(raw).toHaveLength(1025);
    expect(decodeComparisonState(raw)).toBeNull();
  });

  it('encoding rejects invalid states without dropping excess fields or persisting private payloads', () => {
    const invalid = [null, {}, { ...state(), version: 2 }, { ...state(), reports: ['synthetic-note'] },
      { ...state(), postals: [...postals, spare] }, { ...state(), activePostal: spare }];
    for (const value of invalid) expect(encodeComparisonState(value as ComparisonState)).toBeNull();
  });

  it('rejects sparse in-memory postal arrays before encoding or applying an action', () => {
    const sparse = [postals[0]];
    sparse.length = 2;
    const invalid = frozen({ ...state(), postals: sparse, activePostal: postals[0] });
    expect(Object.hasOwn(sparse, 1)).toBe(false);
    expect(decodeComparisonState(JSON.stringify(invalid))).toBeNull();
    expect({
      encoded: encodeComparisonState(invalid),
      reason: transitionComparison(invalid, { type: 'reset' }).reason,
    }).toEqual({ encoded: null, reason: 'invalid_state' });
  });
});

describe('T09: optional storage without side effects on unrelated keys', () => {
  it('restores one exact key without writing, deleting or enumerating storage', () => {
    const original = state(), target = storage(JSON.stringify(original));
    expect(readComparisonState(() => target)).toEqual({ state: original, status: 'restored' });
    expect(target.getItem).toHaveBeenCalledExactlyOnceWith(COMPARISON_STORAGE_KEY);
    expect(target.setItem).not.toHaveBeenCalled();
    expect(target.removeItem).not.toHaveBeenCalled();
    expect(target.clear).not.toHaveBeenCalled();
    expect(target.key).not.toHaveBeenCalled();
  });

  it('an absent key returns the supplied fallback without creating a stored entry', () => {
    const fallback = frozen(state('bus')), target = storage();
    expect(readComparisonState(() => target, fallback)).toEqual({ state: fallback, status: 'empty' });
    expect(target.setItem).not.toHaveBeenCalled();
    expect(fallback).toEqual(state('bus'));
  });

  it('corrupt or old storage falls back without repairing, deleting or rewriting the payload', () => {
    const fallback = frozen(emptyComparisonState('bus'));
    for (const raw of ['bad-json', JSON.stringify({ ...state(), version: 0 })]) {
      const target = storage(raw);
      expect(readComparisonState(() => target, fallback)).toEqual({ state: fallback, status: 'invalid' });
      expect(target.setItem).not.toHaveBeenCalled();
      expect(target.removeItem).not.toHaveBeenCalled();
      expect(target.clear).not.toHaveBeenCalled();
      expect(target.key).not.toHaveBeenCalled();
    }
  });

  it('missing storage access falls back to in-memory state and reports writes unavailable', () => {
    const fallback = frozen(state());
    expect(readComparisonState(() => null, fallback)).toEqual({ state: fallback, status: 'unavailable' });
    expect(writeComparisonState(() => null, fallback)).toBe('unavailable');
  });

  it('a throwing storage getter is contained for both read and write', () => {
    const access = () => { throw new Error('Storage access denied'); };
    const fallback = frozen(state('bus'));
    expect(readComparisonState(access, fallback)).toEqual({ state: fallback, status: 'unavailable' });
    expect(writeComparisonState(access, fallback)).toBe('unavailable');
    expect(fallback).toEqual(state('bus'));
  });

  it('a failed getItem returns the fallback without attempting cleanup or a write', () => {
    const target = storage(), fallback = frozen(state());
    target.getItem.mockImplementation(() => { throw new Error('Read denied'); });
    expect(readComparisonState(() => target, fallback)).toEqual({ state: fallback, status: 'unavailable' });
    expect(target.setItem).not.toHaveBeenCalled();
    expect(target.removeItem).not.toHaveBeenCalled();
    expect(target.clear).not.toHaveBeenCalled();
    expect(target.key).not.toHaveBeenCalled();
  });

  it('saves only the canonical four-field state to the one comparison key without reading other data', () => {
    const original = frozen(state('bus')), target = storage();
    expect(writeComparisonState(() => target, original)).toBe('saved');
    expect(target.setItem).toHaveBeenCalledExactlyOnceWith(COMPARISON_STORAGE_KEY, encodeComparisonState(original));
    expect(JSON.parse(target.setItem.mock.calls[0][1])).toEqual(original);
    expect(target.getItem).not.toHaveBeenCalled();
    expect(target.removeItem).not.toHaveBeenCalled();
    expect(target.clear).not.toHaveBeenCalled();
    expect(target.key).not.toHaveBeenCalled();
  });

  it('a quota/write failure preserves the current state and never triggers deletion or a retry loop', () => {
    const target = storage(), original = frozen(state());
    target.setItem.mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(writeComparisonState(() => target, original)).toBe('unavailable');
    expect(original).toEqual(state());
    expect(target.setItem).toHaveBeenCalledTimes(1);
    expect(target.removeItem).not.toHaveBeenCalled();
    expect(target.clear).not.toHaveBeenCalled();
    expect(target.getItem).not.toHaveBeenCalled();
  });

  it('invalid state is rejected for writes before accessing storage', () => {
    const access = vi.fn(() => storage());
    expect(writeComparisonState(access, { ...state(), history: ['synthetic-private-payload'] } as ComparisonState)).toBe('invalid');
    expect(access).not.toHaveBeenCalled();
  });

  it('imports and performs pure transitions during SSR without DOM or implicit browser storage access', async () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    const target = storage();
    vi.stubGlobal('localStorage', target);
    vi.resetModules();
    const fresh = await import('../comparison-state');
    const result = fresh.transitionComparison(fresh.emptyComparisonState(), { type: 'add', postal: postals[0] });
    expect(result.reason).toBeNull();
    expect(fresh.decodeComparisonState(fresh.encodeComparisonState(result.state))).toEqual(result.state);
    expect(target.getItem).not.toHaveBeenCalled();
    expect(target.setItem).not.toHaveBeenCalled();
  });
});

describe('T09: request delivery identity without loader or UI side effects', () => {
  const token = (): ComparisonRequest => ({ requestId: 10, bundle: 'synthetic-bundle-v1', postal: postals[0], category: 'mrt_lrt' });
  const context = () => ({ state: frozen(state()), bundle: 'synthetic-bundle-v1', open: true });

  it('accepts a valid inactive listed row while rejecting malformed token values without coercion', () => {
    const request = token(), current = { ...request }, activeContext = context();
    expect(request.postal).not.toBe(activeContext.state.activePostal);
    expect(comparisonRequestMatches(request, current, activeContext)).toBe(true);
    const invalid: unknown[] = [null,
      ...[0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '10'].map(requestId => ({ ...request, requestId })),
      ...['', ' synthetic-bundle-v1', 'synthetic-bundle-v1\n', 1].map(bundle => ({ ...request, bundle })),
      { ...request, category: ['mrt_lrt'] }, { ...request, postal: '001001\n' },
    ];
    for (const value of invalid) {
      expect(comparisonRequestMatches(value as ComparisonRequest | null, value as ComparisonRequest | null, activeContext), JSON.stringify(value)).toBe(false);
    }
  });

  it('checks every request identity field and rejects cancelled current requests', () => {
    const request = token(), activeContext = context();
    const stale = [null, { ...request, requestId: 11 }, { ...request, bundle: 'synthetic-bundle-v2' },
      { ...request, postal: postals[1] }, { ...request, category: 'bus' as const }];
    for (const current of stale) expect(comparisonRequestMatches(request, current, activeContext)).toBe(false);
    expect(comparisonRequestMatches(request, request, { ...activeContext, bundle: 'synthetic-bundle-v2' })).toBe(false);
    expect(comparisonRequestMatches(request, request, { ...activeContext, state: state('bus') })).toBe(false);
    expect(comparisonRequestMatches(request, request, { ...activeContext, state: { ...state(), activePostal: spare } })).toBe(false);
  });

  it('fresh caller tokens reject old score, geometry and failure deliveries after remove/re-add, category ABA and retry', () => {
    const old = token(), initial = context();
    const removed = transitionComparison(initial.state, { type: 'remove', postal: old.postal }).state;
    expect(comparisonRequestMatches(old, old, { ...initial, state: removed })).toBe(false);
    const readded = transitionComparison(removed, { type: 'add', postal: old.postal }).state;
    const bus = transitionComparison(readded, { type: 'category', category: 'bus' }).state;
    const returned = transitionComparison(bus, { type: 'category', category: 'mrt_lrt' }).state;
    const phases = [
      { name: 'remove/re-add', state: readded, fresh: { ...old, requestId: 11 } },
      { name: 'category ABA', state: returned, fresh: { ...old, requestId: 12 } },
      { name: 'retry', state: returned, fresh: { ...old, requestId: 13 } },
      { name: 'bundle change', state: returned, fresh: { ...old, requestId: 14, bundle: 'synthetic-bundle-v2' } },
    ];
    // These are delivery-guard invocations, not claims about an implemented async loader.
    for (const phase of phases) for (const delivery of ['score', 'geometry', 'failure']) {
      const latest = { ...initial, state: phase.state, bundle: phase.fresh.bundle };
      expect(comparisonRequestMatches(old, phase.fresh, latest), `${phase.name}: late ${delivery}`).toBe(false);
      expect(comparisonRequestMatches(phase.fresh, phase.fresh, latest), `${phase.name}: current ${delivery}`).toBe(true);
    }
  });

  it('requires open to be exactly true, not a truthy malformed runtime value', () => {
    const request = token();
    for (const open of [false, 'false', 'true', 1, {}, null, undefined]) {
      const current = { ...context(), open } as unknown as Parameters<typeof comparisonRequestMatches>[2];
      expect(comparisonRequestMatches(request, request, current), JSON.stringify(open)).toBe(false);
    }
  });
});
