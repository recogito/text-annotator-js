// Pixels that rects can be apart vertically while still
// being considered to be on the same line.
const TOLERANCE = 3;

export const mergeClientRects = (rects: DOMRect[]) => {
  const lines: DOMRect[][] = [];

  // Sort rects from the top, to make grouping simpler
  rects.sort((a, b) => a.top - b.top);

  // Group rects into lines
  for (const rect of rects) {
    if (lines.length === 0 || Math.abs(rect.top - lines[lines.length - 1][0].top) > TOLERANCE) {
      // Start a new line
      lines.push([rect]);
    } else {
      lines[lines.length - 1].push(rect);
    }
  }

  // Merge lines
  const mergedRects = lines.map(line => {
    const top = Math.min(...line.map(r => r.top));
    const bottom = Math.max(...line.map(r => r.bottom));
    const left = Math.min(...line.map(r => r.left));
    const right = Math.max(...line.map(r => r.right));

    return {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      height: bottom - top,
      width: right - left
    } as DOMRect;
  }).filter(r => r.height > 0 && r.width > 0);

  // Checks if the given rect contains any other rects
  const containsOthers = (rect: DOMRect) => mergedRects.some(other => 
    other !== rect &&
    other.left >= rect.left &&
    other.right <= rect.right &&
    other.top >= rect.top &&
    other.bottom <= rect.bottom
  );

  // Remove all rects that contain other rects (block-level elements!)
  return mergedRects.filter(rect => !containsOthers(rect));
}
