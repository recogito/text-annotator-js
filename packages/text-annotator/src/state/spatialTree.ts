import RBush from 'rbush';
import type { Store } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import { mergeClientRects } from '../utils';

export interface IndexedHighlightRect {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

  annotation: {
    
    id: string;

    rects: DOMRect[];

  }

}

export const createSpatialTree = (store: Store<TextAnnotation>, container: HTMLElement) => {

  const tree = new RBush<IndexedHighlightRect>();

  const index = new Map<string, IndexedHighlightRect[]>();

  // Helper: converts a single text annotation target to a list of hightlight rects
  const toItems = (target: TextAnnotationTarget): IndexedHighlightRect[] => {
    const offset = container.getBoundingClientRect();

    const rects = Array.from(target.selector.range.getClientRects());
    const merged = mergeClientRects(rects);

    return merged.map(rect => {
      const { x, y, width, height } = rect;

      return {
        minX: x - offset.x,
        minY: y - offset.y,
        maxX: x - offset.x + width,
        maxY: y - offset.y + height,
        annotation: {
          id: target.annotation,
          rects: merged
        }
      }
    });
  }

  const all = () => // tree.all().map(item => item.annotation.id);
    [...index.values()];

  const clear = () => {
    tree.clear();
    index.clear();
  }

  const insert = (target: TextAnnotationTarget) => {
    const rects = toItems(target);
    rects.forEach(rect => tree.insert(rect));
    index.set(target.annotation, rects);
  }

  const remove = (target: TextAnnotationTarget) => {
    const rects = index.get(target.annotation);
    rects.forEach(rect => tree.remove(rect));
    index.delete(target.annotation);
  }

  const update = (previous: TextAnnotationTarget, updated: TextAnnotationTarget) => {
    remove(previous);
    insert(updated);
  }

  const set = (targets: TextAnnotationTarget[], replace: boolean = true) => {
    if (replace)
      clear();

    const rectsByTarget = targets.map(target => ({ target, rects: toItems(target) }));
    rectsByTarget.forEach(({ target, rects }) => index.set(target.annotation, rects));

    const allRects = rectsByTarget.reduce((all, { rects }) => [...all, ...rects], []);
    tree.load(allRects);
  }

  const getAt = (x: number, y: number): string | undefined => {
    const hits = tree.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    });

    const area = (rect: IndexedHighlightRect) =>
      rect.annotation.rects.reduce((area, r) =>
        r.width * r.height, 0);
    
    // Get smallest rect
    if (hits.length > 0) {
      hits.sort((a, b) => area(a) - area(b));
      return hits[0].annotation.id;
    }
  }

  const getDOMRectsForAnnotation = (id: string): DOMRect[] => {
    const indexed = index.get(id);
    if (indexed) {
      // Reminder: *each* IndexedHighlightRect stores *all*
      // DOMRects for the annotation for convenience
      return indexed[0].annotation.rects;
    } else {
      return [];
    }
  }

  const getIntersectingRects = (minX: number, minY: number, maxX: number, maxY: number) =>
    tree.search({ minX, minY, maxX, maxY });

  const size = () => tree.all().length;

  const recalculate = () => set(store.all().map(a => a.target), true);

  return {
    all,
    clear,
    getAt,
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