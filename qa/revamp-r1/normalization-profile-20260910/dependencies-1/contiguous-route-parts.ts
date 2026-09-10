type Point = readonly [number, number];
const samePoint = (a: Point, b: Point): boolean => a[0] === b[0] && a[1] === b[1];
const pointKey = (point: Point): string => `${point[0]},${point[1]}`;

/** Exact matching within one validated part, in either direction, without mutation. */
export function createContiguousPartMatcher(parts: readonly (readonly Point[])[]) {
  const starts = new Map<string, { part: readonly Point[]; index: number }[]>();
  for (const part of parts) for (let index = 0; index < part.length; index++) {
    const key = pointKey(part[index]);
    const positions = starts.get(key);
    if (positions) positions.push({ part, index });
    else starts.set(key, [{ part, index }]);
  }
  return (points: readonly Point[]): boolean => {
    if (points.length === 0) return parts.length > 0;
    // Only starts with the exact first coordinate can match; retain every repeated occurrence.
    for (const { part, index } of starts.get(pointKey(points[0])) ?? []) {
      for (const direction of [1, -1]) {
        const end = index + direction * (points.length - 1);
        if (end < 0 || end >= part.length) continue;
        let offset = 0;
        while (offset < points.length && samePoint(points[offset], part[index + direction * offset])) offset++;
        if (offset === points.length) return true;
      }
    }
    return false;
  };
}
