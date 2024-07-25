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
  [Symbol.iterator]: function* (): IterableIterator<DOMRect> {
    for (let i = 0; i < this.length; i++)
      yield this.item(i)!;
  }
})
