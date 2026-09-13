import { normalizePublishedSelection, type PublishedWalkSelection } from './published-walk-selection';
import type { PublishedTransitCategory, PublishedTransitOption } from './published-transit-options';

export interface SavedWalkDefault {
  option: PublishedTransitOption;
  route: 'shortest' | 'shiokest';
  distance: number;
}

/** Rank only renderable, authoritative saved walks, never straight-line POI distance. */
export function shortestSavedWalk(selection: PublishedWalkSelection | null, bundle: string, category?: PublishedTransitCategory): SavedWalkDefault | null {
  const choices: SavedWalkDefault[] = [];
  for (const kind of category ? [category] : ['bus', 'mrt_lrt'] as const) {
    const pool = normalizePublishedSelection(selection, kind, bundle);
    if (pool.contextStatus !== 'valid') continue;
    for (const option of pool.options) {
      if (!option.retainable) continue;
      for (const [variant, route, metric] of [
        ['shortest', 'shortest', 'shortest_m'], ['sheltered', 'shiokest', 'sheltered_m'],
      ] as const) {
        const distance = option.metrics[metric];
        if (option.geometry[variant].status === 'complete' && option.geometry[variant].parts.length && distance.status === 'valid') {
          choices.push({ option, route, distance: distance.value });
        }
      }
    }
  }
  choices.sort((a,b) => a.distance-b.distance || (a.option.key < b.option.key ? -1 : a.option.key > b.option.key ? 1 : 0)
    || (a.route === b.route ? 0 : a.route === 'shiokest' ? -1 : 1));
  return choices[0] ?? null;
}
