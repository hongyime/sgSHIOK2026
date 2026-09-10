type Point = readonly [number, number];
const samePoint = (a: Point, b: Point): boolean => a[0] === b[0] && a[1] === b[1];

/** Exact matching within one validated part, in either direction, without mutation. */
export function createContiguousPartMatcher(parts: readonly (readonly Point[])[]) {
  return (points: readonly Point[]): boolean => {
    for (const part of parts) for (let start = 0; start <= part.length - points.length; start++) {
      if (points.every((point, offset) => samePoint(point, part[start + offset]))
        || points.every((point, offset) => samePoint(point, part[start + points.length - 1 - offset]))) return true;
    }
    return false;
  };
}
