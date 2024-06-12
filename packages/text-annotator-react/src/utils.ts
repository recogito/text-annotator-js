/** Note that these will go into Annotorious eventually **/

/**
 * Finds the closest DOMRect to a given client X/Y point from a DOMRectList.
 */
export const getClosestRect = (rects: DOMRectList, pos: { x: number, y: number }): DOMRect => {
  const uncollapsed = [...rects].filter(r => r.width > 0 && r.height > 0);

  let closest: DOMRect;

  let minDist = Number.MAX_VALUE;

  uncollapsed.forEach(rect => {
    const centerY = rect.top + rect.height / 2;

    const dist = Math.abs(centerY - pos.y);

    if (dist < minDist) {
      minDist = dist;
      closest = rect;
    }
  });

  return closest!;
}

/** 
 * Wraps a single DOMRect into an object that properly
 * implements the DOMRectList interface.
 */
export const toClientRects = (rect: DOMRect) => ({
  length: 1,
  item: (index: number) => index === 0 ? rect : undefined,
  [Symbol.iterator]: function* (): IterableIterator<DOMRect> {
    for (let i = 0; i < this.length; i++)
      yield this.item(i)!;
  }
} as DOMRectList)