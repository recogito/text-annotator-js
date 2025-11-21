import type { Highlight } from '../../rendering';
import type { Rect } from '../../state';

export const computeZIndex = (rect: Rect, all: Highlight[]): number => {
  const intersects = (a: Rect, b: Rect): boolean => (
    a.x <= b.x + b.width && a.x + a.width >= b.x &&
    a.y <= b.y + b.height && a.y + a.height >= b.y
  )

  const getLength = (h: Highlight) => 
    h.rects.reduce((total, rect) => total + rect.width, 0);

  // Any highlights that intersect this rect, sorted by total length
  const intersecting = all.filter(({ rects }) => rects.some(r => intersects(rect, r)));
  intersecting.sort((a, b) => getLength(b) - getLength(a));

  return intersecting.findIndex(h => h.rects.includes(rect));
}