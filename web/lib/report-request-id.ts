const MAX_TIMESTAMP = 0xffffffffffff;
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** RFC 9562 section 5.7: 48-bit Unix milliseconds and 74 random bits. */
export function createReportRequestId(
  now: number = Date.now(),
  random: Pick<Crypto, 'getRandomValues'> = globalThis.crypto,
): string {
  if (!Number.isInteger(now) || now < 0 || now > MAX_TIMESTAMP) {
    throw new RangeError('Invalid report request timestamp');
  }
  const bytes = new Uint8Array(16);
  try {
    if (!random || typeof random.getRandomValues !== 'function') throw new Error();
    random.getRandomValues(bytes);
  } catch {
    throw new Error('Secure random generation unavailable');
  }

  // Arithmetic preserves all 48 timestamp bits; JavaScript bitwise operators truncate to 32.
  let remaining = now;
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Parse identity only. Admission age, clock skew and replay expiry belong to the server. */
export function parseReportRequestTime(id: unknown): number | null {
  if (typeof id !== 'string' || id.length !== 36 || !UUID_V7.test(id)) return null;
  return Number.parseInt(id.slice(0, 8) + id.slice(9, 13), 16);
}
