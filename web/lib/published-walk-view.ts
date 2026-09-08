import type { PublishedTransitOption } from './published-transit-options';
import type { PostalGeom } from './types';

/** Rendering data only: partial validated pieces do not establish a complete walk. */
export function publishedOptionGeometry(postal: string, option: PublishedTransitOption): PostalGeom | null {
  if (typeof postal !== 'string' || !/^[0-9]{6}$/.test(postal)) return null;
  if (option.classification !== 'routed') return null;
  // The normalizer's versioned key binds these already-paired capabilities to this postal.
  let identity: unknown;
  try { identity = JSON.parse(option.key); } catch { return null; }
  if (!Array.isArray(identity) || identity[0] !== 'pw' || identity[1] !== 1 || identity[3] !== postal || identity[4] !== option.category) return null;

  const shortest = option.geometry.shortest.parts.map(part => part.encoded);
  const sheltered = option.geometry.sheltered.parts.map(part => part.encoded);
  if (!shortest.length && !sheltered.length) return null;
  const geom: PostalGeom = {
    postal,
    // Never flatten disconnected parts by inventing an edge between them.
    shortest: shortest.length === 1 ? shortest[0] : '',
    sheltered: sheltered.length === 1 ? sheltered[0] : '',
    shortest_parts: shortest,
    sheltered_parts: sheltered,
    // Highlightability includes exact membership in a surviving sheltered part.
    exposure_gaps: option.gaps.sheltered.fragments.entries.flatMap(fragment =>
      sheltered.length > 0 && fragment.highlightable && fragment.length.status === 'valid' && fragment.encoded
        ? [{ geom: fragment.encoded, len_m: fragment.length.value, label: fragment.label ?? 'Exposed stretch' }] : []),
  };
  for (const variant of ['shortest', 'sheltered'] as const) {
    const capability = option.geometry.routeSegments[variant];
    if (capability.status === 'complete' && option.geometry[variant].status === 'complete') {
      geom.route_segments ??= {};
      geom.route_segments[variant] = capability.segments.map(segment => ({ ...segment }));
    }
  }
  return geom;
}
