import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export function displayImageUrl(value) {
  try {
    const url = new URL(value);
    return url.href === value && !url.username && !url.password && !url.search && !url.hash &&
      url.origin === 'https://www.onemap.gov.sg' &&
      (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(url.pathname) ||
       url.pathname === '/web-assets/images/logo/om_logo.png');
  } catch { return false; }
}

// Public display images only. This never reads credentials or pipeline inputs.
export function displayImages({ end, save, fetchImage = fetch, maxImages = 256, maxBytes = 16 * 1024 * 1024 }) {
  const pending = new Map(), queue = [], receipts = [];
  let active = 0, totalBytes = 0, exhausted = false;
  const abort = new AbortController();
  async function download(url) {
    if (active >= 6) await new Promise(done => queue.push(done));
    else active++;
    try {
      assert.ok(!exhausted, 'Display-image byte budget exhausted');
      assert.ok(Date.now() < end, 'Display-image deadline');
      const response = await fetchImage(url, { redirect: 'error', credentials: 'omit',
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(Math.min(15000, end - Date.now()))]) });
      assert.equal(response.status, 200, url);
      const contentType = response.headers.get('content-type');
      assert.ok(['image/png', 'image/undefined'].includes(contentType), contentType);
      const accessControlAllowOrigin=response.headers.get('access-control-allow-origin');
      assert.equal(accessControlAllowOrigin,'*','Public display-image CORS response');
      const chunks = []; let length = 0;
      for await (const chunk of response.body) {
        length += chunk.length; totalBytes += chunk.length;
        if(totalBytes > maxBytes || length > 2 * 1024 * 1024) {
          exhausted = true; abort.abort(new Error('Display-image byte budget exhausted'));
        }
        assert.ok(length <= 2 * 1024 * 1024 && totalBytes <= maxBytes, 'Display-image byte budget');
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG signature');
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const filename = createHash('sha256').update(url).digest('hex') + '.png';
      await save(filename, bytes);
      receipts.push({ url, filename, sha256, bytes: length, contentType, accessControlAllowOrigin, capturedAt: new Date().toISOString() });
      return bytes;
    } finally { const next = queue.shift(); if (next) next(); else active--; }
  }
  return {
    receipts,
    get(url) {
      assert.ok(displayImageUrl(url), 'Not an approved public display image');
      if (!pending.has(url)) {
        assert.ok(!exhausted, 'Display-image byte budget exhausted');
        assert.ok(pending.size < maxImages, 'Display-image request budget');
        pending.set(url, download(url));
      }
      return pending.get(url);
    },
    async drain() { await Promise.allSettled(pending.values()); },
    stats() { return { requested: pending.size, captured: receipts.length, totalBytes, maxImages, maxBytes }; },
  };
}
