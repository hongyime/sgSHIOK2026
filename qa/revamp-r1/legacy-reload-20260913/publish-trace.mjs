const allowedHeaders = new Set(['content-type', 'content-length', 'content-encoding', 'cache-control', 'etag', 'date']);
const privateFields = new Set(['associatedcookies', 'blockedcookies', 'exemptedcookies', 'cookie', 'cookies', 'cookiepartitionkey', 'headerstext', 'requestheaderstext', 'remoteipaddress', 'postdata', 'postdataentries']);

export function publicTrace(input) {
  const redactions = {};
  const count = key => { redactions[key] = (redactions[key] ?? 0) + 1; };
  function visit(value, key = '') {
    if (privateFields.has(key.toLowerCase())) { count(key); return '[REDACTED]'; }
    if (key.toLowerCase() === 'headers' || key.toLowerCase() === 'requestheaders') {
      return Object.fromEntries(Object.entries(value ?? {}).filter(([name]) => {
        if (allowedHeaders.has(name.toLowerCase())) return true;
        count('header:' + name.toLowerCase()); return false;
      }));
    }
    if (Array.isArray(value)) return value.map(item => visit(item));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, visit(item, name)]));
    return value;
  }
  return { trace: visit(input), redactions };
}
