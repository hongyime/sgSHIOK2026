const bundle = 'generated_20260805_prefer_scored_routed';

export function profileCases(fixture, encode) {
  const scores = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
  const geom = fixture['geom/h3/886520db39fffff.json'][0];
  const real = scores.map(score => ({ name: 'retained-' + score.state, origin: 'retained published fixture; route_segments omitted',
    input: { bundle, postal: score.postal, indexed: true, score, geometry: score.postal === geom.postal ? geom : null,
      geometryLookup: score.postal === geom.postal ? 'record_present' : 'not_indexed' } }));
  const source = scores.find(row => row.postal === geom.postal);
  const candidate = source.candidates.find(row => row.node_id === 'bus:03509');
  if (!candidate) throw Error('Retained candidate missing');
  const synthetic = [];
  for (const vertices of [64, 256, 1024]) for (const segmented of [false, true]) {
    const points = Array.from({ length: vertices }, (_, i) => [1.3 + i / 100000, 103.8 + i / 100000]);
    const encoded = encode(points);
    const detail = { shortest: encoded, sheltered: encoded, exposure_gaps: [] };
    if (segmented) {
      const segments = points.slice(1).map((point, i) => ({ geom: encode([points[i], point]), len_m: 1, is_covered: i % 2 === 0 }));
      detail.route_segments = { shortest: segments, sheltered: segments };
    }
    synthetic.push({ name: `synthetic-${vertices}-${segmented ? 'edge-segments' : 'no-segments'}`, origin: 'synthetic geometry and segment lengths; retained candidate metadata, not a measured walk',
      vertices, segmented, input: { bundle, postal: source.postal, indexed: true,
        score: { postal: source.postal, state: source.state, best_node: { type: 'mrt_lrt_exit' }, candidates: [structuredClone(candidate)] },
        geometry: { postal: source.postal, candidates: { [candidate.node_id]: detail } }, geometryLookup: 'record_present' } });
  }
  return [...real, ...synthetic];
}
