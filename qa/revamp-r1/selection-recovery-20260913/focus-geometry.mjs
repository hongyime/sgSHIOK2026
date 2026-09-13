export function focusGeometry(rect, clip, canvas, outlineWidth, outlineOffset) {
  const fits = box => box.right > box.left && box.bottom > box.top
    && box.left >= clip.left - 0.5 && box.top >= clip.top - 0.5
    && box.right <= clip.right + 0.5 && box.bottom <= clip.bottom + 0.5;
  const controlFits = !!rect && fits(rect);
  const edge = outlineWidth + outlineOffset;
  const ring = rect && Number.isFinite(edge) && outlineWidth > 0 ? {
    left: rect.left - edge, right: rect.right + edge,
    top: rect.top - edge, bottom: rect.bottom + edge,
  } : null;
  const ringFits = !!ring && fits(ring);
  return { controlFits, ring, ringFits, fits: canvas ? ringFits && edge <= 0 : controlFits };
}
