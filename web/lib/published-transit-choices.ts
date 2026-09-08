import type {
  MetricCapability,
  PublishedTransitCategory,
  PublishedTransitNormalizationResult,
  PublishedTransitOption,
} from './published-transit-options';

export const MAX_PUBLISHED_TRANSIT_CHOICES = 3;
export type PublishedChoiceRole = 'shortest' | 'most_covered' | 'current' | 'default';

export interface PublishedTransitChoice {
  option: PublishedTransitOption;
  roles: PublishedChoiceRole[];
}

export interface PublishedTransitChoices {
  choices: PublishedTransitChoice[];
  defaultKey: string | null;
  selectedKey: string | null;
}

export function declaredPublishedTransitDefault(
  pool: PublishedTransitNormalizationResult,
  category: PublishedTransitCategory,
): PublishedTransitOption | null {
  if (pool.contextStatus !== 'valid') return null;
  const options = pool.options.filter(option => option.category === category);
  // An unavailable category default still owns reset; do not replace it with a top default.
  return options.find(option => option.sources.some(source =>
    source.selectionRef.kind === 'category_default' && source.selectionRef.category === category))
    ?? options.find(option => option.sources.some(source => source.selectionRef.kind === 'top_default'))
    ?? null;
}

function compareKeys(a: PublishedTransitOption, b: PublishedTransitOption): number {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

function compareMetric(a: MetricCapability, b: MetricCapability, descending = false): number {
  if (a.status !== 'valid') return b.status === 'valid' ? 1 : 0;
  if (b.status !== 'valid') return -1;
  return descending ? b.value - a.value : a.value - b.value;
}

function shortestFirst(a: PublishedTransitOption, b: PublishedTransitOption): number {
  return compareMetric(a.metrics.sheltered_m, b.metrics.sheltered_m)
    || compareMetric(a.metrics.covered_ratio, b.metrics.covered_ratio, true)
    || compareKeys(a, b);
}

function coverageFirst(a: PublishedTransitOption, b: PublishedTransitOption): number {
  return compareMetric(a.metrics.covered_ratio, b.metrics.covered_ratio, true)
    || compareMetric(a.metrics.sheltered_m, b.metrics.sheltered_m)
    || compareKeys(a, b);
}

/** Choose among the normalized published walks, never among unmeasured nearby POIs. */
export function selectPublishedTransitChoices(
  pool: PublishedTransitNormalizationResult,
  category: PublishedTransitCategory,
  currentKey?: string | null,
): PublishedTransitChoices {
  if (pool.contextStatus !== 'valid') {
    return { choices: [], defaultKey: null, selectedKey: null };
  }

  const options = pool.options.filter(option => option.category === category);
  const defaultOption = declaredPublishedTransitDefault(pool, category);
  const defaultKey = defaultOption?.key ?? null;
  const requestedKey = currentKey === undefined ? defaultKey : currentKey;
  const usable = options.filter(option => option.retainable);
  const current = usable.find(option => option.key === requestedKey);
  const shortest = usable
    .filter(option => option.distanceRankable && option.metrics.sheltered_m.status === 'valid')
    .sort(shortestFirst)[0];
  const mostCovered = usable
    .filter(option => option.coverageRankable && option.metrics.covered_ratio.status === 'valid')
    .sort(coverageFirst)[0];

  const choices: PublishedTransitChoice[] = [];
  const byKey = new Map<string, PublishedTransitChoice>();
  const add = (option: PublishedTransitOption | undefined, role: PublishedChoiceRole) => {
    if (!option) return;
    const existing = byKey.get(option.key);
    if (existing) {
      if (!existing.roles.includes(role)) existing.roles.push(role);
      return;
    }
    if (choices.length === MAX_PUBLISHED_TRANSIT_CHOICES) return;
    const choice = { option, roles: [role] };
    choices.push(choice);
    byKey.set(option.key, choice);
  };

  add(shortest, 'shortest');
  add(mostCovered, 'most_covered');
  add(current, 'current');
  if (defaultOption?.retainable && !byKey.has(defaultOption.key)) add(defaultOption, 'default');

  return { choices, defaultKey, selectedKey: current?.key ?? null };
}
