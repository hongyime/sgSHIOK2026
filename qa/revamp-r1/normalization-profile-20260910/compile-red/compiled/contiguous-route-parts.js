"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContiguousPartMatcher = createContiguousPartMatcher;
const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];
/** Exact matching within one validated part, in either direction, without mutation. */
function createContiguousPartMatcher(parts) {
    return (points) => {
        for (const part of parts)
            for (let start = 0; start <= part.length - points.length; start++) {
                if (points.every((point, offset) => samePoint(point, part[start + offset]))
                    || points.every((point, offset) => samePoint(point, part[start + points.length - 1 - offset])))
                    return true;
            }
        return false;
    };
}
