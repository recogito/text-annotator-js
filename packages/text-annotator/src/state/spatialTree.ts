import RBush from 'rbush';
import type { Store } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import { mergeClientRects } from '../utils';
import { getClientRectsPonyfill } from '../utils/getClientRectsPonyfill';
import { reviveTarget } from './reviveTarget';

// TODO Removed unused imports of ponyfill
const isFirefox = false; // navigator.userAgent.match(/firefox|fxios/i);
if (isFirefox) console.warn('Firefox interop enabled');

/**
 * Stores rects captured by the annotation's target range
 * Those ranges can be non-contiguous
 */
export interface IndexedHighlightRects {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

  target: {

    id: string;

    annotation: string;

    rects: DOMRect[];

  };

}

export const createSpatialTree = (store: Store<TextAnnotation>, container: HTMLElement) => {

  const tree = new RBush<IndexedHighlightRects>();

  /**
   * Binds annotation to the targets' rects (possibly non-contiguous)
   */
  const index = new Map<string, { [targetId: string]: IndexedHighlightRects[] }>();

  // Helper: converts a single text annotation target to a list of hightlight rects
  const toItems = (target: TextAnnotationTarget): IndexedHighlightRects[] => {
    const offset = container.getBoundingClientRect();

    const isValidRange =
      target.selector.range instanceof Range &&
      !target.selector.range.collapsed &&
      target.selector.range.startContainer.nodeType === Node.TEXT_NODE &&
      target.selector.range.endContainer.nodeType === Node.TEXT_NODE;

    const t = isValidRange ? target : reviveTarget(target, container);

    const rects = isFirefox ?
      getClientRectsPonyfill(t.selector.range) :
      Array.from(t.selector.range.getClientRects());

    const merged = mergeClientRects(rects);

    return merged.map(rect => {
      const { x, y, width, height } = rect;

      return {
        minX: x - offset.x,
        minY: y - offset.y,
        maxX: x - offset.x + width,
        maxY: y - offset.y + height,
        target: {
          id: target.id,
          annotation: target.annotation,
          rects: merged
        }
      };
    });
  };

  const all = () => [...index.values()];

  const clear = () => {
    tree.clear();
    index.clear();
  }

  const insert = (target: TextAnnotationTarget) => {
    const targetRects = toItems(target);
    targetRects.forEach(rect => tree.insert(rect));

    const annoRects = index.get(target.annotation) || {};
    annoRects[target.id] = targetRects;

    index.set(target.annotation, annoRects);
  }

  const remove = (target: TextAnnotationTarget) => {
    const annoRects = index.get(target.annotation);

    const targetRects = annoRects[target.id];
    targetRects.forEach(rect => tree.remove(rect));

    delete annoRects[target.id]; // Mutates the object within the index
    if (Object.keys(annoRects).length === 0) {
      index.delete(target.annotation);
    }
  };

  const update = (target: TextAnnotationTarget) => {
    remove(target);
    insert(target);
  }

  const set = (targets: TextAnnotationTarget[], replace: boolean = true) => {
    if (replace)
      clear();

    const rectsByTarget = targets.map(target => ({ target, rects: toItems(target) }));
    rectsByTarget.forEach(({ target, rects }) => {
      const annoRects = index.get(target.annotation) || {};
      annoRects[target.id] = rects;
      index.set(target.annotation, annoRects);
    });

    /**
     * Bulk insertion is usually ~2-3 times faster than inserting items one by one.
     * After bulk loading (bulk insertion into an empty tree), subsequent query performance is also ~20-30% better.
     */
    const allRects = rectsByTarget.flatMap(({ rects }) => rects);
    tree.load(allRects);
  };

  const getAt = (x: number, y: number): string | undefined => {
    const hits = tree.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    });

    const area = (rect: IndexedHighlightRects) =>
      rect.target.rects.reduce((area, r) =>
        area + r.width * r.height, 0);
    
    // Get smallest rect
    if (hits.length > 0) {
      hits.sort((a, b) => area(a) - area(b));
      return hits[0].target.annotation;
    }
  }

  const getBoundsForAnnotation = (id: string): DOMRect => {
    const rects = getDOMRectsForAnnotation(id);

    if (rects.length === 0)
      return undefined;

    let left = rects[0].left;
    let top = rects[0].top;
    let right = rects[0].right;
    let bottom = rects[0].bottom;

    for (let i = 1; i < rects.length; i++) {
      const rect = rects[i];

      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }

    return new DOMRect(left, top, right - left, bottom - top);
  }

  const getDOMRectsForAnnotation = (id: string): DOMRect[] => {
    const annoRects = index.get(id);

    return annoRects ? Object.values(annoRects).flatMap(
        // Reminder: *each* IndexedHighlightRect stores *all* DOMRects for the target for convenience
        targetRects => targetRects[0].target.rects
      ) : [];
  };

  const getIntersectingRects = (minX: number, minY: number, maxX: number, maxY: number) =>
    tree.search({ minX, minY, maxX, maxY });

  const size = () => tree.all().length;

  const recalculate = () =>
    set(store.all().flatMap(a => a.targets), true);

  return {
    all,
    clear,
    getAt,
    getBoundsForAnnotation,
    getDOMRectsForAnnotation,
    getIntersectingRects,
    insert,
    recalculate,
    remove,
    set,
    size,
    update
  }

}
