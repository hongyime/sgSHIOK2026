// Inject before browser-probe.js. In the measured path retain identity only.
// Equality fingerprints are computed after the screenshot/measurement bracket.
(() => {
  const ids = new WeakMap(), retained = [];
  let finalized = false, overflow = 0;
  window.__sourcePayloads = {
    identify(data) {
      if (!data || typeof data !== 'object' || finalized) return null;
      if (ids.has(data)) return ids.get(data);
      if (retained.length >= 512) { overflow++; return null; }
      const id = retained.length + 1;
      ids.set(data, id); retained.push(data); return id;
    },
    async finalize() {
      finalized = true;
      const payloads = [];
      for (let i = 0; i < retained.length; i++) {
        const serialized = JSON.stringify(retained[i]);
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
        payloads.push({ id: i + 1, sha256: [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('') });
      }
      retained.length = 0;
      return { payloads, overflow, scope: 'Reference identity recorded at submission. SHA-256 of JSON serialization at finalization, outside measured window; not a call-time snapshot of mutable objects. Equal render keys alone do not establish equal payloads.' };
    },
  };
})();
