import type { PublishedTransitCategory } from './published-transit-options';

export const COMPARISON_STORAGE_KEY = 'shiok:comparison:v1';
export const MAX_COMPARISON_POSTALS = 3;
export const MAX_COMPARISON_STATE_CHARS = 1024;

export interface ComparisonState {
  version: 1;
  postals: readonly string[];
  category: PublishedTransitCategory;
  activePostal: string | null;
}

export type ComparisonAction =
  | { type: 'add' | 'remove' | 'activate'; postal: string }
  | { type: 'category'; category: PublishedTransitCategory }
  | { type: 'reset' };
export type ComparisonRejection =
  | 'invalid_state' | 'invalid_action' | 'invalid_postal'
  | 'duplicate' | 'limit' | 'not_found' | 'invalid_category';
export type ComparisonStorageAccess = () => Pick<Storage, 'getItem' | 'setItem'> | null;
export type ComparisonReadStatus = 'restored' | 'empty' | 'invalid' | 'unavailable';
export type ComparisonWriteStatus = 'saved' | 'invalid' | 'unavailable';

const isCategory = (value: unknown): value is PublishedTransitCategory => value === 'bus' || value === 'mrt_lrt';
const isPostal = (value: unknown): value is string => typeof value === 'string' && value.length === 6 && /^[0-9]{6}$/.test(value);

export function emptyComparisonState(category: PublishedTransitCategory = 'mrt_lrt'): ComparisonState {
  if (!isCategory(category)) throw new RangeError('Invalid comparison category');
  return { version: 1, postals: [], category, activePostal: null };
}

function validatedState(value: unknown): ComparisonState | null {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const state = value as Record<string, unknown>;
    if (Object.keys(state).sort().join('|') !== 'activePostal|category|postals|version') return null;
    if (state.version !== 1 || !isCategory(state.category) || !Array.isArray(state.postals)
      || state.postals.length > MAX_COMPARISON_POSTALS) return null;
    const postals = Array.from(state.postals);
    if (!postals.every(isPostal) || new Set(postals).size !== postals.length) return null;
    if (postals.length === 0 ? state.activePostal !== null
      : !isPostal(state.activePostal) || !postals.includes(state.activePostal)) return null;
    return { version: 1, postals, category: state.category, activePostal: state.activePostal as string | null };
  } catch {
    return null;
  }
}

export function transitionComparison(state: ComparisonState, action: ComparisonAction): {
  state: ComparisonState; reason: ComparisonRejection | null;
} {
  const reject = (reason: ComparisonRejection) => ({ state, reason });
  if (!validatedState(state)) return reject('invalid_state');
  if (!action || typeof action !== 'object') return reject('invalid_action');
  if (action.type === 'reset') return { state: emptyComparisonState(state.category), reason: null };
  if (action.type === 'category') {
    if (!isCategory(action.category)) return reject('invalid_category');
    return { state: action.category === state.category ? state : { ...state, category: action.category }, reason: null };
  }
  if (!['add', 'remove', 'activate'].includes(action.type)) return reject('invalid_action');
  if (!('postal' in action) || !isPostal(action.postal)) return reject('invalid_postal');
  const index = state.postals.indexOf(action.postal);
  if (action.type === 'add') {
    if (index >= 0) return reject('duplicate');
    if (state.postals.length === MAX_COMPARISON_POSTALS) return reject('limit');
    return { state: { ...state, postals: [...state.postals, action.postal], activePostal: action.postal }, reason: null };
  }
  if (index < 0) return reject('not_found');
  if (action.type === 'activate') {
    return { state: action.postal === state.activePostal ? state : { ...state, activePostal: action.postal }, reason: null };
  }
  const postals = state.postals.filter(postal => postal !== action.postal);
  const activePostal = state.activePostal === action.postal
    ? postals[index] ?? postals[postals.length - 1] ?? null : state.activePostal;
  return { state: { ...state, postals, activePostal }, reason: null };
}

export function decodeComparisonState(raw: unknown): ComparisonState | null {
  if (typeof raw !== 'string' || raw.length > MAX_COMPARISON_STATE_CHARS) return null;
  try { return validatedState(JSON.parse(raw)); } catch { return null; }
}

export function encodeComparisonState(state: ComparisonState): string | null {
  const validated = validatedState(state);
  return validated ? JSON.stringify(validated) : null;
}

// Reading never repairs, persists or prunes storage. Restore before wiring user-action writes.
export function readComparisonState(
  storageAccess: ComparisonStorageAccess,
  fallback: ComparisonState = emptyComparisonState(),
): { state: ComparisonState; status: ComparisonReadStatus } {
  const initial = validatedState(fallback) ?? emptyComparisonState();
  try {
    const storage = storageAccess();
    if (!storage) return { state: initial, status: 'unavailable' };
    const raw = storage.getItem(COMPARISON_STORAGE_KEY);
    if (raw === null) return { state: initial, status: 'empty' };
    const restored = decodeComparisonState(raw);
    return restored ? { state: restored, status: 'restored' } : { state: initial, status: 'invalid' };
  } catch {
    return { state: initial, status: 'unavailable' };
  }
}

export function writeComparisonState(storageAccess: ComparisonStorageAccess, state: ComparisonState): ComparisonWriteStatus {
  const encoded = encodeComparisonState(state);
  if (encoded === null) return 'invalid';
  try {
    const storage = storageAccess();
    if (!storage) return 'unavailable';
    storage.setItem(COMPARISON_STORAGE_KEY, encoded);
    return 'saved';
  } catch {
    return 'unavailable';
  }
}

export interface ComparisonRequest {
  bundle: string;
  postal: string;
  category: PublishedTransitCategory;
  requestId: number;
}

/** Delivery guard only: the loader must invalidate current tokens on every lifecycle change. */
export function comparisonRequestMatches(
  token: ComparisonRequest | null,
  current: ComparisonRequest | null,
  context: { state: ComparisonState; bundle: string; open: boolean },
): boolean {
  if (!token || !current || context.open !== true || !validatedState(context.state)) return false;
  if (!Number.isSafeInteger(token.requestId) || token.requestId <= 0
    || typeof token.bundle !== 'string' || !token.bundle.length || token.bundle.trim() !== token.bundle
    || /[\x00-\x1f\x7f]/.test(token.bundle) || !isPostal(token.postal) || !isCategory(token.category)) return false;
  return token.requestId === current.requestId && token.bundle === current.bundle
    && token.postal === current.postal && token.category === current.category
    && token.bundle === context.bundle && token.category === context.state.category
    && context.state.postals.includes(token.postal);
}
