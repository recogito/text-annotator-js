// The three topological relations we need to check for
type Relation = 'contains' | 'is_inside' | 'adjacent' | 'disjoint';

// Note that this is not a general topology test. Takes a 
// few shortcuts to test ONLY the situations we'll encounter
// with text selections.
const getRelation = (a: DOMRect, b: DOMRect): Relation => {
  // Everything with a different Y-coord is considered 'disjoint'
  if (a.top !== b.top || a.bottom !== b.bottom)
    return 'disjoint';

  if (a.left <= b.left && a.right >= b.right)
    return 'contains';

  if (a.left >= b.left && a.right <= b.right)
    return 'is_inside';

  if (a.left === b.right || a.right === b.left)
    return 'adjacent';

  return 'disjoint';
}

const computeUnionRect = (rects: DOMRect[]): DOMRect => {
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const rect of rects) {
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return new DOMRect(left, top, right - left, bottom - top);
}

export const mergeClientRects = (rects: DOMRect[]) => rects.reduce((merged, rectA) => {
  const canMergeWith = [];

  for (const rectB of merged) {
    const relation = getRelation(rectA, rectB);

    if (relation === 'contains' || relation === 'adjacent') {
      canMergeWith.push(rectB);
    } else if (relation === 'is_inside') {
      return merged;
    }
  }

  if (canMergeWith.length === 0) {
    return [...merged, rectA];
  } else {
    const union = computeUnionRect([...canMergeWith, rectA]);

    const m = [
      ...merged.filter(rect => !canMergeWith.includes(rect)),
      union
    ];

    let minHeight = Number.POSITIVE_INFINITY;
    m.forEach(m => {
      if (m.height > 0 && m.height < minHeight)
        minHeight = m.height;
    });

    console.log(minHeight);

    const deduped = m.reduce((prev, rect) => {
      if (rect.height > minHeight)
        return prev;

      const exists = prev.find(r => r.x === rect.x && r.y === rect.y && r.width === rect.width && r.height === rect.height);
      return exists ? prev : [...prev, rect];
    }, [] as DOMRect[]);

    return deduped;
  }
}, [] as DOMRect[]);
