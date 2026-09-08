import type { LatLng } from './polyline';
import type { PublishedTransitOption } from './published-transit-options';

export interface MappedExposedSection {
  key: string;
  encoded: string;
  points: readonly LatLng[];
  lengthM: number;
}

export interface PublishedExposureSections {
  contextKey: string;
  status: 'available' | 'partial' | 'empty' | 'unavailable';
  sections: readonly MappedExposedSection[];
}

export interface MappedSectionFocus extends MappedExposedSection {
  kind: 'mapped-section';
  contextKey: string;
}

function usablePoints(points: readonly LatLng[] | null): points is readonly LatLng[] {
  return Array.isArray(points) && points.length >= 2
    && points.every(point => Array.isArray(point) && point.length === 2
      && Number.isFinite(point[0]) && Math.abs(point[0]) <= 90
      && Number.isFinite(point[1]) && Math.abs(point[1]) <= 180)
    && points.some(point => point[0] !== points[0][0] || point[1] !== points[0][1]);
}

const copyPoints = (points: readonly LatLng[]): LatLng[] => points.map(([lat, lon]) => [lat, lon]);

export function publishedExposureSections(
  option: PublishedTransitOption | null,
  mode: 'shiokest' | 'shortest' | 'both',
): PublishedExposureSections {
  const base = option?.geometry.sheltered;
  const fragments = option?.gaps.sheltered.fragments;
  const sections = new Map<string, MappedExposedSection>();
  const eligible = option?.classification === 'routed' && mode !== 'shortest'
    && (mode === 'shiokest' || mode === 'both') && Boolean(base?.parts.length)
    && (base?.status === 'complete' || base?.status === 'partial')
    && (fragments?.status === 'complete' || fragments?.status === 'partial');
  let rejected = false;
  if (eligible && fragments) {
    for (const fragment of fragments.entries) {
      if (!fragment.highlightable || fragment.length.status !== 'valid'
        || !Number.isFinite(fragment.length.value) || fragment.length.value < 0
        || typeof fragment.encoded !== 'string' || !fragment.encoded
        || !usablePoints(fragment.points)) {
        rejected = true;
        continue;
      }
      // This identifies an exact mapped observation, never a logical gap or its array slot.
      const key = JSON.stringify(['mapped-section', 1, option!.key, 'sheltered', fragment.encoded, fragment.length.value]);
      sections.set(key, { key, encoded: fragment.encoded, lengthM: fragment.length.value, points: copyPoints(fragment.points) });
    }
  }
  const ordered = [...sections.values()].sort((a, b) => b.lengthM - a.lengthM || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const ref = option?.selectedSource.selectionRef;
  const source = ref?.kind === 'candidate' ? [ref.kind, ref.nodeId]
    : ref?.kind === 'category_default' ? [ref.kind, ref.category] : ref ? [ref.kind] : null;
  const status: PublishedExposureSections['status'] = !eligible ? 'unavailable'
    : ordered.length ? base?.status === 'complete' && fragments?.status === 'complete' && !rejected ? 'available' : 'partial'
    : base?.status === 'complete' && fragments?.status === 'complete' && !rejected ? 'empty' : 'unavailable';
  // Partial geometry has no signature. Its surviving parts must still invalidate old focus.
  const contextKey = JSON.stringify(['mapped-sections', 1, option?.key ?? null, source, mode,
    option?.classification ?? null, base?.status ?? null, base?.parts.map(part => part.encoded) ?? [],
    status, ordered.map(section => section.key)]);
  return { contextKey, status, sections: ordered };
}

export function resolveMappedExposureFocus(
  model: PublishedExposureSections,
  selection: { contextKey: string; sectionKey: string } | null,
): MappedSectionFocus | null {
  if (!selection || selection.contextKey !== model.contextKey
    || (model.status !== 'available' && model.status !== 'partial')) return null;
  const section = model.sections.find(item => item.key === selection.sectionKey);
  if (!section) return null;
  return { ...section, kind: 'mapped-section', contextKey: model.contextKey, points: copyPoints(section.points) };
}
