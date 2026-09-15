import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { createReportRequestId, parseReportRequestTime } from '../report-request-id';

const maxTimestamp = 0xffffffffffff;
const rfcTimestamp = 1645557742000;
const rfcUuid = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f';
const epochUuid = '00000000-0000-7000-8000-000000000000';
const asRandom = (value: unknown) => value as Pick<Crypto, 'getRandomValues'>;

function filledRandom(value = 0) {
  return { getRandomValues: vi.fn((bytes: Uint8Array) => { bytes.fill(value); return bytes; }) };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('RFC 9562 UUIDv7 report request identity', () => {
  it('reproduces the Appendix A.6 vector from its timestamp and random fields', () => {
    const random = { getRandomValues: vi.fn((bytes: Uint8Array) => {
      bytes.set([0, 0, 0, 0, 0, 0, 0xcc, 0xc3, 0x18, 0xc4, 0xdc, 0x0c, 0x0c, 0x07, 0x39, 0x8f]);
      return bytes;
    }) };
    expect(rfcTimestamp.toString(16)).toBe('17f22e279b0');
    expect(createReportRequestId(rfcTimestamp, asRandom(random))).toBe(rfcUuid);
    expect(parseReportRequestTime(rfcUuid)).toBe(rfcTimestamp);
    expect(random.getRandomValues).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, epochUuid],
    [1, '00000000-0001-7000-8000-000000000000'],
    [0x010203040506, '01020304-0506-7000-8000-000000000000'],
    [maxTimestamp, 'ffffffff-ffff-7000-8000-000000000000'],
  ] as const)('encodes the timestamp in big-endian byte order: %s', (time, expected) => {
    expect(createReportRequestId(time, asRandom(filledRandom()))).toBe(expected);
    expect(parseReportRequestTime(expected)).toBe(time);
  });

  it.each([
    0, -0, 1, 255, 256, 65535, 65536, 0x7fffffff, 0x80000000,
    0xffffffff, 0x100000000, 0x100000001, rfcTimestamp, maxTimestamp - 1, maxTimestamp,
  ])('round-trips the full 48-bit range without 32-bit truncation: %s', time => {
    const id = createReportRequestId(time, asRandom(filledRandom(255)));
    expect(parseReportRequestTime(id)).toBe(time === 0 ? 0 : time);
    expect(id).toHaveLength(36);
    expect(id).toBe(id.toLowerCase());
  });

  it('fixes only the version and variant bits and preserves all 74 random bits', () => {
    for (let value = 0; value <= 255; value += 1) {
      const random = filledRandom(value);
      const id = createReportRequestId(0, asRandom(random));
      const bytes = id.replaceAll('-', '').match(/../g)!.map(byte => Number.parseInt(byte, 16));
      expect(bytes.slice(0, 6)).toEqual([0, 0, 0, 0, 0, 0]);
      expect(bytes[6]).toBe(0x70 | (value & 0x0f));
      expect(bytes[8]).toBe(0x80 | (value & 0x3f));
      for (const index of [7, 9, 10, 11, 12, 13, 14, 15]) expect(bytes[index]).toBe(value);
      expect(random.getRandomValues).toHaveBeenCalledTimes(1);
      expect(random.getRandomValues.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
      expect(random.getRandomValues.mock.calls[0][0]).toHaveLength(16);
    }
  });

  it('uses Date.now and global crypto without weak randomness or UUIDv4 fallback', () => {
    const random = filledRandom();
    vi.stubGlobal('crypto', random);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(rfcTimestamp);
    const weak = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Weak RNG used'); });
    expect(createReportRequestId()).toBe('017f22e2-79b0-7000-8000-000000000000');
    expect(clock).toHaveBeenCalledTimes(1);
    expect(random.getRandomValues).toHaveBeenCalledTimes(1);
    expect(weak).not.toHaveBeenCalled();
  });

  it('works with the installed native Web Crypto receiver, without a Node-only UUID dependency', () => {
    expect(parseReportRequestTime(createReportRequestId(rfcTimestamp, asRandom(webcrypto)))).toBe(rfcTimestamp);
  });

  it('has no monotonic clock or counter state between calls', () => {
    const random = asRandom(filledRandom());
    expect(createReportRequestId(rfcTimestamp, random)).toBe(createReportRequestId(rfcTimestamp, random));
    expect(createReportRequestId(0, random)).toBe(epochUuid);
  });

  it.each([
    -1, -0.1, 0.1, 1.5, NaN, Infinity, -Infinity, maxTimestamp + 1,
    Number.MAX_SAFE_INTEGER, Number.MAX_VALUE, '0', null, true, 0n,
  ])('rejects invalid timestamps before using crypto: %s', time => {
    const random = filledRandom();
    expect(() => createReportRequestId(time as number, asRandom(random)))
      .toThrow(new RangeError('Invalid report request timestamp'));
    expect(random.getRandomValues).not.toHaveBeenCalled();
  });

  it.each([null, {}, { getRandomValues: null }, { getRandomValues: 1 }])(
    'fails closed for an unavailable random source: %j', random => {
      expect(() => createReportRequestId(0, asRandom(random)))
        .toThrow(new Error('Secure random generation unavailable'));
    },
  );

  it('fails closed when global crypto is absent', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => createReportRequestId(0)).toThrow(new Error('Secure random generation unavailable'));
  });

  it.each(['getter', 'method'])('does not leak random-source errors from the %s', source => {
    const fail = () => { throw new Error('Sensitive random provider detail'); };
    const random = source === 'getter'
      ? Object.defineProperty({}, 'getRandomValues', { get: fail })
      : { getRandomValues: fail };
    expect(() => createReportRequestId(0, asRandom(random)))
      .toThrow(new Error('Secure random generation unavailable'));
  });
});

describe('strict report request timestamp parsing', () => {
  it.each(['8', '9', 'a', 'b'])('accepts RFC variant nibble %s', variant => {
    expect(parseReportRequestTime(`${rfcUuid.slice(0, 19)}${variant}${rfcUuid.slice(20)}`)).toBe(rfcTimestamp);
  });

  it('does not consult the clock or impose admission and expiry windows', () => {
    vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Admission belongs to SQL'); });
    expect(parseReportRequestTime(epochUuid)).toBe(0);
    expect(parseReportRequestTime('ffffffff-ffff-7fff-bfff-ffffffffffff')).toBe(maxTimestamp);
  });

  it.each([undefined, null, 0, true, [], {}, new String(rfcUuid), Symbol('id'), 1n])(
    'rejects non-string inputs without coercion: %s', value => {
      expect(parseReportRequestTime(value)).toBeNull();
    },
  );

  it('does not invoke input coercion or property accessors', () => {
    const fail = vi.fn(() => { throw new Error('Do not coerce'); });
    expect(parseReportRequestTime({ toString: fail, [Symbol.toPrimitive]: fail })).toBeNull();
    expect(parseReportRequestTime(new Proxy({}, { get: fail }))).toBeNull();
    expect(fail).not.toHaveBeenCalled();
  });

  it.each([
    '', rfcUuid.toUpperCase(), rfcUuid.replace('f', 'F'), rfcUuid.slice(1), `${rfcUuid}0`,
    rfcUuid.replaceAll('-', ''), rfcUuid.replace('-', '_'), rfcUuid.replace('017f', '017g'),
    ` ${rfcUuid}`, `${rfcUuid} `, `{${rfcUuid}}`, `urn:uuid:${rfcUuid}`,
    `${rfcUuid}\n`, `${rfcUuid}\r`, `${rfcUuid}\r\n`, `${rfcUuid}\u2028`, `${rfcUuid}\u2029`,
    `${rfcUuid.slice(0, -1)}\n`, `${rfcUuid.slice(0, -1)}\0`, `\n${rfcUuid}`,
    `${rfcUuid.slice(0, 8)}\n${rfcUuid.slice(9)}`,
  ])('rejects noncanonical encodings: %j', value => {
    expect(parseReportRequestTime(value)).toBeNull();
  });

  it.each('012345689abcdef'.split(''))('rejects UUID version %s', version => {
    expect(parseReportRequestTime(`${rfcUuid.slice(0, 14)}${version}${rfcUuid.slice(15)}`)).toBeNull();
  });

  it.each('01234567cdef'.split(''))('rejects non-RFC variant nibble %s', variant => {
    expect(parseReportRequestTime(`${rfcUuid.slice(0, 19)}${variant}${rfcUuid.slice(20)}`)).toBeNull();
  });
});
