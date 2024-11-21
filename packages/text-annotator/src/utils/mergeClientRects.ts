// The three topological relations we need to check for
type Relation = 
  // Inline elements, same height, directly adjacent
  'inline-adjacent' |
  // Inline elements, A fully contains B
  'inline-contains' |
  // Inline elements, A is fully contained inside B
  'inline-is-contained' |
  // At least one block element, A fully contains B
  'block-contains' |
  // At least one block element, A is fully contained in B
  'block-is-contained';

// Note that this is not a general topology test. Takes a 
// few shortcuts to test ONLY the situations we'll encounter
// with text selections.
const getRelation = (rectA: DOMRect, rectB: DOMRect): Relation | undefined => {
  const round = (num: number ) => Math.round(num * 10) / 10;

  // Some browsers have fractional pixel differences (looking at you FF!)
  const a = {
    top: round(rectA.top),
    bottom: round(rectA.bottom),
    left: round(rectA.left),
    right: round(rectA.right)
  };

  const b = {
    top: round(rectB.top),
    bottom: round(rectB.bottom),
    left: round(rectB.left),
    right: round(rectB.right)
  };

  if (Math.abs(a.top - b.top) < 0.5 && Math.abs(a.bottom - b.bottom) < 0.5) {
    // Same height - check for containment and adjacency
    if (Math.abs(a.left - b.right) < 0.5 || Math.abs(a.right - b.left) < 0.5)
      return 'inline-adjacent';

    if (a.left >= b.left && a.right <= b.right)
      return 'inline-is-contained';

    if (a.left <= b.left && a.right >= b.right)
      return 'inline-contains';
  } else {
    // Different heights - check for containment
    if (a.top <= b.top && a.bottom >= b.bottom) {
      if (a.left <= b.left && a.right >= b.right) {
        return 'block-contains'
      }
    } else if (a.top >= b.top && a.bottom <= b.bottom) {
      if (a.left >= b.left && a.right <= b.right) {
        return 'block-is-contained';
      }
    }
  }
}

const union = (a: DOMRect, b: DOMRect): DOMRect => {
  const left = Math.min(a.left, b.left);
  const right = Math.max(a.right, b.right);
  const top = Math.min(a.top, b.top);
  const bottom = Math.max(a.bottom, b.bottom);

  return new DOMRect(left, top, right - left, bottom - top);
}

export const mergeClientRects = (rects: DOMRect[]) => rects.reduce<DOMRect[]>((merged, rectA) => {
  // Some browser report empty rects - discard
  if (rectA.width === 0 || rectA.height === 0)
    return merged;

  let next = [...merged];

  let wasMerged = false;

  for (const rectB of merged) {
    const relation = getRelation(rectA, rectB);
    
    if (relation === 'inline-adjacent') {
      // A and B are adjacent - remove B and keep union
      next = next.map(r => r === rectB ? union(rectA, rectB) : r);
      wasMerged = true;
      break;
    } else if (relation === 'inline-contains') {
      // A contains B - remove B and keep A
      next = next.map(r => r === rectB ? rectA : r);
      wasMerged = true;
      break;
    } else if (relation === 'inline-is-contained') {
      // B contains A - skip A
      wasMerged = true;
      break;
    } else if (relation === 'block-contains' || relation === 'block-is-contained') {
      // Block containment - keep the element with smaller width
      if (rectA.width < rectB.width) {
        next = next.map(r => r === rectB ? rectA : r);
      }
      wasMerged = true;
      break;
    }
  }

  return wasMerged ? next : [ ...next, rectA ];
}, []);

export const toDomRectList = (rects: DOMRect[]): DOMRectList => ({
  length: rects.length,
  item: (index) => rects[index],
  [Symbol.iterator]: function* (): ArrayIterator<DOMRect> {
    for (let i = 0; i < this.length; i++)
      yield this.item(i)!;
  }
})

/* Pixels that rects can be apart vertically while still
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
*/
