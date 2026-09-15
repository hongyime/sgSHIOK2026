export function auditUrl(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return 'https://redacted.invalid/credentials-present';
    if (url.origin === 'https://www.onemap.gov.sg') {
      // Retain disqualifying query/hash presence without exposing their contents.
      return url.origin + url.pathname + (url.search ? '?redacted=present' : '') + (url.hash ? '#redacted' : '');
    }
    const params = new URLSearchParams();
    for (const key of ['postal', 'transit', 'stop', 'route']) {
      if (url.searchParams.has(key)) params.set(key, url.searchParams.get(key));
    }
    return url.origin + url.pathname + (params.size ? '?' + params : '');
  } catch { return 'invalid-url'; }
}
