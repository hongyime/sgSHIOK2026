import { decodeComparisonState, encodeComparisonState, type ComparisonState } from './comparison-state';

const MAX_HASH_CHARS = 512;
const OWNED_KEYS = ['compare', 'postals', 'transit', 'active'] as const;
const CONTROL_CHARACTERS = /[\x00-\x1f\x7f]/;
const MALFORMED_PERCENT_ESCAPE = /%(?![0-9a-fA-F]{2})/;

export type ComparisonLinkResult =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'valid'; state: ComparisonState };

export function readComparisonLink(hash: unknown): ComparisonLinkResult {
  if (typeof hash !== 'string' || hash.length > MAX_HASH_CHARS || CONTROL_CHARACTERS.test(hash)) {
    return { kind: 'invalid' };
  }
  if (hash === '' || hash === '#') return { kind: 'none' };
  // URLSearchParams otherwise preserves malformed escapes rather than rejecting them.
  if (!hash.startsWith('#') || MALFORMED_PERCENT_ESCAPE.test(hash)) return { kind: 'invalid' };
  const params = new URLSearchParams(hash.slice(1));
  if (!OWNED_KEYS.some(key => params.has(key))) return { kind: 'none' };
  if (Array.from(params.keys()).length !== OWNED_KEYS.length ||
      !OWNED_KEYS.every(key => params.getAll(key).length === 1) || params.get('compare') !== '1') {
    return { kind: 'invalid' };
  }
  const state = decodeComparisonState(JSON.stringify({
    version: 1,
    postals: params.get('postals')?.split(','),
    category: params.get('transit'),
    activePostal: params.get('active'),
  }));
  return state && state.postals.length > 0 ? { kind: 'valid', state } : { kind: 'invalid' };
}

export function comparisonLinkFragment(state: ComparisonState): string | null {
  const encoded = encodeComparisonState(state);
  const validated = encoded === null ? null : decodeComparisonState(encoded);
  if (!validated || validated.postals.length === 0 || validated.activePostal === null) return null;
  const params = new URLSearchParams([
    ['compare', '1'],
    ['postals', validated.postals.join(',')],
    ['transit', validated.category],
    ['active', validated.activePostal],
  ]);
  return `#${params.toString()}`;
}

export function buildComparisonLink(href: string, state: ComparisonState): string | null {
  if (typeof href !== 'string' || href.trim() !== href || CONTROL_CHARACTERS.test(href) ||
      href.includes('\\') || !/^https?:\/\//i.test(href)) return null;
  const fragment = comparisonLinkFragment(state);
  if (fragment === null) return null;
  try {
    const url = new URL(href);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return null;
    url.search = '';
    url.hash = fragment;
    return url.href;
  } catch {
    return null;
  }
}
