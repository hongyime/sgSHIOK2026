// Injected only in the owned diagnostic browser. Return values and exceptions are unchanged.
export const tracePage = `(() => {
  let emitted = 0;
  const emit = value => {
    if (++emitted <= 1200) window.qaMapTrace(JSON.stringify({ at: performance.now(), ...value }));
  };
  const timed = (owner, method, details) => {
    const original = owner[method];
    if (typeof original !== 'function') return;
    owner[method] = function(...args) {
      const start = performance.now();
      emit({ kind: method + ':start', ...details?.(args) });
      try {
        const value = original.apply(this, args);
        emit({ kind: method + ':end', milliseconds: performance.now() - start,
          ...(method === 'queryRenderedFeatures' ? { count: value.length,
            keys: [...new Set(value.map(f => f.properties?.render_key))] } : {}) });
        return value;
      } catch (error) { emit({ kind: method + ':error', error: String(error) }); throw error; }
    };
  };
  for (const method of ['createProgram', 'compileShader', 'linkProgram']) {
    if (window.WebGL2RenderingContext) timed(WebGL2RenderingContext.prototype, method);
  }
  let map, debug;
  const hooked = new WeakSet();
  Object.defineProperty(window, '__shiokRouteMap', { configurable: true, get: () => map, set: value => {
    map = value;
    if (!value || hooked.has(value)) return;
    hooked.add(value);
    emit({ kind: 'map-attached' });
    timed(value, 'queryRenderedFeatures', args => ({ args, currentKey: debug?.routeKey }));
  } });
  Object.defineProperty(window, '__shiokRouteDebug', { configurable: true, get: () => debug, set: value => {
    debug = value;
    emit({ kind: 'route-debug', value });
  } });
  let previousStatus;
  new MutationObserver(() => {
    const status = document.querySelector('main')?.dataset.mapStatus;
    if (status !== previousStatus) { previousStatus = status; emit({ kind: 'map-status', status }); }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-map-status'], childList: true });
})();`;
