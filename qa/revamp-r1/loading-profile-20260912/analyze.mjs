export const COUNTERS = ['\\Memory\\Available MBytes', '\\Memory\\Pages Input/sec', '\\Memory\\Pages Output/sec', '\\Processor(_Total)\\% Processor Time'];
export function stages(sample) {
  const events = sample.page.events;
  const first = name => events.find(e => e.name === name)?.at ?? null;
  const complete = part => events.find(e => e.name === 'body-decode-parse-end' && e.url.includes(part))?.at ?? null;
  const nav = sample.page.navigation[0];
  return { cache: sample.cache, htmlRequestToFirstByteMs: nav.responseStart - nav.requestStart,
    textObservedMs: first('selected-text-visible'), mapPublishedMs: first('map-published'),
    routeObservedMs: first('current-selected-route-visible'), basemapObservedMs: first('basemap-source-loaded'),
    geometryBodyCompleteMs: complete('/geom/h3/'), scoreBodyCompleteMs: complete('/scores/DOWNTOWN_CORE_PART_001.json'),
    selectedRouteWrites: events.filter(e => e.name === 'source-setData' && e.source === 'shiokest-route'),
    sourceWrites: events.filter(e => e.name === 'source-setData').length,
    longTasks: sample.page.longTasks };
}
