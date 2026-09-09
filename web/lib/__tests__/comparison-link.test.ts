import { describe, expect, it } from 'vitest';
import { buildComparisonLink, comparisonLinkFragment, readComparisonLink } from '../comparison-link';
import type { ComparisonState } from '../comparison-state';

// Synthetic identifiers test the codec only; no published evidence or private samples.
const postals = ['001001', '002002', '003003'];
const valid = '#compare=1&postals=001001,002002&transit=bus&active=002002';
function state(count = 2, category: ComparisonState['category'] = 'bus'): ComparisonState {
  return { version: 1, postals: postals.slice(0, count), category, activePostal: postals[count - 1] ?? null };
}

describe('T11 comparison link codec: exact owned fragment', () => {
  it.each(['', '#', '#about', '#postal=001001'])('leaves absent or unrelated anchors alone: %s', hash => {
    expect(readComparisonLink(hash)).toEqual({ kind: 'none' });
  });

  it('rejects non-string input without coercion or treating it as an unrelated anchor', () => {
    for (const hash of [null, undefined, 1, false, [], [valid], { toString: () => valid }]) {
      expect(readComparisonLink(hash)).toEqual({ kind: 'invalid' });
    }
  });

  it.each([1, 2, 3])('round-trips %s leading-zero postals, category, order and active selection', count => {
    for (const category of ['bus', 'mrt_lrt'] as const) {
      const original = state(count, category), before = structuredClone(original);
      Object.freeze(original.postals); Object.freeze(original);
      const fragment = comparisonLinkFragment(original);
      expect(typeof fragment).toBe('string');
      expect(fragment!.startsWith('#')).toBe(true);
      expect(fragment!.length).toBeLessThanOrEqual(512);
      expect(readComparisonLink(fragment)).toEqual({ kind: 'valid', state: original });
      expect(original).toEqual(before);
    }
  });

  it('emits exactly the four public link keys and no state payload or provenance fields', () => {
    const fragment = comparisonLinkFragment(state())!;
    const params = new URLSearchParams(fragment.slice(1));
    expect([...params.keys()].sort()).toEqual(['active', 'compare', 'postals', 'transit']);
    expect(params.get('compare')).toBe('1');
    expect(params.get('postals')).toBe('001001,002002');
    expect(params.get('transit')).toBe('bus');
    expect(params.get('active')).toBe('002002');
  });

  it('requires the hash delimiter for an owned nonempty fragment', () => {
    expect(readComparisonLink(valid.slice(1))).toEqual({ kind: 'invalid' });
    expect(readComparisonLink(` ${valid}`)).toEqual({ kind: 'invalid' });
  });

  it('accepts each key once regardless of incoming key order', () => {
    expect(readComparisonLink('#active=002002&transit=bus&postals=001001,002002&compare=1'))
      .toEqual({ kind: 'valid', state: state() });
  });

  it('rejects an owned fragment missing any required key, including the version key', () => {
    for (const key of ['compare', 'postals', 'transit', 'active']) {
      const params = new URLSearchParams(valid.slice(1)); params.delete(key);
      expect(readComparisonLink(`#${params.toString()}`), key).toEqual({ kind: 'invalid' });
    }
    expect(readComparisonLink('#compare')).toEqual({ kind: 'invalid' });
  });

  it('rejects unknown versions and noncanonical version values', () => {
    for (const version of ['0', '2', '01', '', 'true']) {
      expect(readComparisonLink(valid.replace('compare=1', `compare=${version}`))).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects every duplicate known key rather than taking its first or last value', () => {
    const params = new URLSearchParams(valid.slice(1));
    for (const [key, value] of params) {
      expect(readComparisonLink(`${valid}&${key}=${encodeURIComponent(value)}`), key).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects duplicate keys after percent decoding, including otherwise identical values', () => {
    for (const duplicate of ['%63ompare=1', '%70ostals=001001%2C002002', '%74ransit=bus', '%61ctive=002002']) {
      expect(readComparisonLink(`${valid}&${duplicate}`)).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects unknown fields, private content, nested payloads and lookalike key names', () => {
    for (const key of ['notes', 'reports', 'rows', 'history', 'provenance', '__proto__', 'Compare', 'active[]']) {
      expect(readComparisonLink(`${valid}&${key}=synthetic-private-value`), key).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects empty, fourth, duplicate and decoded-duplicate postal lists', () => {
    for (const list of ['', '001001,002002,003003,004004', '001001,001001', '001001,%30%30%31%30%30%31']) {
      const hash = `#compare=1&postals=${list}&transit=bus&active=001001`;
      expect(readComparisonLink(hash), list).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects malformed identifiers without trimming, Unicode normalization or numeric coercion', () => {
    for (const postal of ['00100', '0010010', ' 001001', '001001 ', '001001\n', '001001\r\n', '00a001', '\uFF10\uFF10\uFF11\uFF10\uFF10\uFF11']) {
      const encoded = encodeURIComponent(postal);
      expect(readComparisonLink(`#compare=1&postals=${encoded}&transit=bus&active=${encoded}`), postal).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects invalid categories and absent, malformed or unlisted active postals', () => {
    for (const transit of ['BUS', 'mrt', 'best_transit', '', 'bus%0A']) {
      expect(readComparisonLink(valid.replace('transit=bus', `transit=${transit}`))).toEqual({ kind: 'invalid' });
    }
    for (const active of ['', '003003', '2002', '002002%0A', 'null']) {
      expect(readComparisonLink(valid.replace('active=002002', `active=${active}`))).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects raw controls, malformed escapes and over-limit owned input', () => {
    for (const hash of [valid + '\n', valid + '\0', valid + '\x7f', valid.replace('001001', '%ZZ1001'),
      valid + '&%61ctive=%', valid + '&notes=' + 'x'.repeat(512)]) {
      expect(readComparisonLink(hash)).toEqual({ kind: 'invalid' });
    }
  });

  it('does not produce a fragment for empty, malformed or excess-field state', () => {
    const invalid = [state(0), { ...state(), version: 2 }, { ...state(), postals: [...postals, '004004'] },
      { ...state(), postals: ['001001', '001001'], activePostal: '001001' }, { ...state(), activePostal: '004004' },
      { ...state(), notes: 'synthetic-private-note' }, { ...state(), postals: ['001001\n'] }];
    for (const value of invalid) expect(comparisonLinkFragment(value as ComparisonState)).toBeNull();
  });
});

describe('T11 comparison link builder: sanitized absolute URL', () => {
  it.each(['https://example.test/path/walk', 'http://localhost:4326/walk/'])('preserves origin and pathname: %s', href => {
    const result = buildComparisonLink(`${href}?token=synthetic-secret&postal=001001#old-private-anchor`, state())!;
    const parsed = new URL(result), base = new URL(href);
    expect(parsed.origin).toBe(base.origin);
    expect(parsed.pathname).toBe(base.pathname);
    expect(parsed.search).toBe('');
    expect(readComparisonLink(parsed.hash)).toEqual({ kind: 'valid', state: state() });
    expect(result).not.toContain('synthetic-secret');
    expect(result).not.toContain('old-private-anchor');
  });

  it('removes all old query and fragment parameters rather than merging owned or unrelated state', () => {
    const href = `https://example.test/nested%20path/?report=synthetic-private&compare=0&notes=private${valid}&history=private`;
    const result = buildComparisonLink(href, state(1, 'mrt_lrt'))!;
    expect(new URL(result).pathname).toBe('/nested%20path/');
    expect(new URL(result).search).toBe('');
    expect(readComparisonLink(new URL(result).hash)).toEqual({ kind: 'valid', state: state(1, 'mrt_lrt') });
    expect(result).not.toContain('private');
  });

  it('rejects nonabsolute URLs, non-HTTP schemes and embedded credentials', () => {
    for (const href of ['/walk', '//example.test/walk', 'not a url', 'javascript:alert(1)', 'file:///C:/walk',
      'ftp://example.test/walk', 'data:text/plain,hello', 'https://user@example.test/', 'https://user:password@example.test/']) {
      expect(buildComparisonLink(href, state()), href).toBeNull();
    }
  });

  it('rejects invalid state rather than building an apparently usable URL without its intended selection', () => {
    expect(buildComparisonLink('https://example.test/', state(0))).toBeNull();
    expect(buildComparisonLink('https://example.test/', { ...state(), reports: ['synthetic-note'] } as ComparisonState)).toBeNull();
  });
});
