// Diagnostic injection only: wrappers call native operations unchanged; no payloads retained.
(() => {
  const events = [], longTasks = [], memory = [];
  const mark = (name, detail = {}) => events.push({ name, at: performance.now(), ...detail });
  const tags = new WeakMap();
  window.__loadingDiagnosis = { events, longTasks, memory };
  new PerformanceObserver(list => longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = String(args[0]?.url || args[0]), start = performance.now();
    mark('fetch-start', { url });
    try { const response = await originalFetch.apply(this, args); tags.set(response, url); if (response.body) tags.set(response.body, url); mark('fetch-headers', { url, start, status: response.status }); return response; }
    catch (error) { mark('fetch-error', { url, start, error: String(error) }); throw error; }
  };
  const pipe = ReadableStream.prototype.pipeThrough;
  ReadableStream.prototype.pipeThrough = function (...args) {
    const output = pipe.apply(this, args), url = tags.get(this);
    if (url) { tags.set(output, url); mark('decode-stream-start', { url }); }
    return output;
  };
  const NativeResponse = window.Response;
  window.Response = new Proxy(NativeResponse, { construct(target, args) {
    const response = Reflect.construct(target, args); if (tags.has(args[0])) tags.set(response, tags.get(args[0])); return response;
  } });
  const nativeJson = NativeResponse.prototype.json;
  NativeResponse.prototype.json = async function (...args) {
    const url = tags.get(this) || this.url, start = performance.now();
    mark('body-decode-parse-start', { url });
    try { const result = await nativeJson.apply(this, args); mark('body-decode-parse-end', { url, start, duration: performance.now() - start }); return result; }
    catch (error) { mark('body-decode-parse-error', { url, start, error: String(error) }); throw error; }
  };
  const nativeParse = JSON.parse;
  JSON.parse = function (...args) { const start = performance.now(); try { return nativeParse.apply(this, args); } finally { const duration = performance.now() - start; if (duration >= 1) mark('explicit-JSON.parse', { start, duration, characters: typeof args[0] === 'string' ? args[0].length : null }); } };
  const NativeWorker = window.Worker;
  window.Worker = new Proxy(NativeWorker, { construct(target, args) {
    const start = performance.now(), url = String(args[0]); mark('worker-constructor-start', { url });
    const worker = Reflect.construct(target, args); mark('worker-constructor-end', { url, start });
    worker.addEventListener('message', () => mark('worker-first-message', { url, start }), { once: true });
    const post = worker.postMessage; let first = true;
    worker.postMessage = function (...messages) { if (first) { mark('worker-first-post', { url }); first = false; } return post.apply(this, messages); };
    return worker;
  } });
  let mapValue; const observed = new WeakSet();
  Object.defineProperty(window, '__shiokRouteMap', { configurable: true, get: () => mapValue, set(map) {
    mapValue = map; if (!map || observed.has(map)) return; observed.add(map); mark('map-published');
    for (const event of ['load', 'idle', 'sourcedataloading', 'sourcedata', 'error']) map.on(event, e => {
      if (events.length < 15000) mark('map-' + event, { source: e.sourceId, loaded: e.isSourceLoaded, type: e.sourceDataType, error: e.error?.message });
    });
    const patchSource = id => { const source = map.getSource(id); if (!source?.setData || source.__diagnosticPatched) return; source.__diagnosticPatched = true; const setData = source.setData; source.setData = function (data, ...rest) { mark('source-setData', { source: id, features: data?.features?.length, key: data?.features?.[0]?.properties?.render_key }); return setData.call(this, data, ...rest); }; };
    const addSource = map.addSource;
    map.addSource = function (id, data) { mark('source-add', { source: id, type: data.type, features: data.data?.features?.length }); const result = addSource.call(this, id, data); patchSource(id); return result; };
    for (const id of Object.keys(map.getStyle()?.sources || {})) patchSource(id);
  } });
  let textSeen = false, routeSeen = false, basemapSeen = false, status;
  const timer = setInterval(() => {
    const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
    const currentStatus = document.querySelector('main')?.dataset.mapStatus;
    if (currentStatus !== status) { status = currentStatus; mark('ui-map-status', { status }); }
    if (!textSeen && document.querySelector('[aria-label="Walk summary"]')?.textContent.includes('81 m')) { textSeen = true; mark('selected-text-visible'); }
    if (!basemapSeen && map?.getSource('onemap') && map.isSourceLoaded('onemap')) { basemapSeen = true; mark('basemap-source-loaded'); }
    if (!routeSeen && map?.getLayer('shiokest-route-line') && debug?.padding && !map.isMoving()) {
      const p = debug.padding, box = [[p.left, p.top], [innerWidth - p.right, innerHeight - p.bottom]];
      const count = map.queryRenderedFeatures(box, { layers: ['shiokest-route-line'] }).filter(f => f.properties.render_key === debug.routeKey).length;
      if (count && map.isSourceLoaded('shiokest-route')) { routeSeen = true; mark('current-selected-route-visible', { count, key: debug.routeKey }); }
    }
    if (memory.length < 150 && (!memory.length || performance.now() - memory.at(-1).at > 1000)) memory.push({ at: performance.now(), usedJSHeapSize: performance.memory?.usedJSHeapSize, totalJSHeapSize: performance.memory?.totalJSHeapSize });
  }, 100);
  window.__loadingDiagnosis.stop = () => clearInterval(timer);
})();
