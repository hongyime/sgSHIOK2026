export interface MapPadding { top: number; right: number; bottom: number; left: number }
export interface OverlayBounds { left: number; top: number; right: number; bottom: number; edge: 'top' | 'bottom' | 'panel' }

/** DOM bounds are relative to the map, in CSS pixels, including expanded sheets. */
export function overlayPadding(width: number, height: number, overlays: OverlayBounds[]): MapPadding {
  const padding = { top: 12, right: 12, bottom: 12, left: 12 };
  for (const rect of overlays) {
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= width || rect.top >= height) continue;
    const edge = rect.edge === 'panel' ? (rect.right - rect.left > width / 2 ? 'bottom' : 'left') : rect.edge;
    if (edge === 'top') padding.top = Math.max(padding.top, rect.bottom + 12);
    if (edge === 'bottom') padding.bottom = Math.max(padding.bottom, height - rect.top + 12);
    if (edge === 'left') padding.left = Math.max(padding.left, rect.right + 12);
  }
  // Tiny windows must still have a nonempty camera/query rectangle.
  for (const [a, b, size] of [['left', 'right', width], ['top', 'bottom', height]] as const) {
    const limit = Math.max(0, size - 64);
    if (padding[a] + padding[b] > limit) {
      const scale = limit / (padding[a] + padding[b]);
      padding[a] *= scale; padding[b] *= scale;
    }
  }
  return padding;
}

export function usableMapBox(width: number, height: number, padding: MapPadding): [[number, number], [number, number]] {
  return [[padding.left, padding.top], [width - padding.right, height - padding.bottom]];
}

interface RenderMap {
  on(event: string, callback: () => void): unknown;
  off(event: string, callback: () => void): unknown;
  isMoving(): boolean;
  queryRenderedFeatures(box: [[number, number], [number, number]], options: { layers: string[] }): Array<{ properties: Record<string, unknown> }>;
}

/** One bounded listener per selection/layout. Old worker features cannot satisfy this probe. */
export function watchSelectedRoute(map: RenderMap, options: {
  key: string; layers: string[]; box: [[number, number], [number, number]];
  ready: () => void; timeout: () => void; timeoutMs?: number;
}) {
  let active = true;
  const stop = () => {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    map.off('render', check);
  };
  const check = () => {
    if (!active || map.isMoving()) return;
    const features = map.queryRenderedFeatures(options.box, { layers: options.layers });
    if (features.some(feature => feature.properties.render_key === options.key)) {
      stop(); options.ready();
    }
  };
  const timer = setTimeout(() => { if (active) { stop(); options.timeout(); } }, options.timeoutMs ?? 15000);
  map.on('render', check);
  return stop;
}
