import RBush from 'rbush';
import { createSelectionState, createStore, type Store } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget } from '../model';

interface IndexedHighlightRect {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

  annotationId: string;

}

const createSpatialTree = (store: Store<TextAnnotation>) => {

  const tree = new RBush<IndexedHighlightRect>();

  // Helper: converts a single text annotation target to a list of hightlight rects
  const toItems = (target: TextAnnotationTarget): IndexedHighlightRect[] => {
    const rects = Array.from(target.selector.range.getClientRects());

    return rects.map(rect => {
      const { x, y, width, height } = rect;

      return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
        annotationId: target.annotation
      }
    });
  }

  const all = () => tree.all().map(item => item.annotationId);

  const clear = () => tree.clear();

  const insert = (target: TextAnnotationTarget) => {
    const rects = toItems(target);
    rects.forEach(rect => tree.insert(rect));
  }

  const remove = (target: TextAnnotationTarget) => {
    const rects = toItems(target);
    rects.forEach(rect => tree.remove(rect, (a, b) => a.annotationId === b.annotationId));
  }

  const update = (previous: TextAnnotationTarget, updated: TextAnnotationTarget) => {
    remove(previous);
    insert(updated);
  }

  const set = (targets: TextAnnotationTarget[], replace: boolean = true) => {
    if (replace) tree.clear();

    const rects = targets.reduce((all, target) => [...all, ...toItems(target)], []);
    tree.load(rects);
  }

  const getAt = (x: number, y: number): string | undefined => {
    const hits = tree.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    });

    const area = (rect: IndexedHighlightRect) => 
      (rect.maxX - rect.minX) * (rect.maxY - rect.maxY);

    // Get smallest rect
    if (hits.length > 0) {
      hits.sort((a, b) => area(a) - area(b));
      return hits[0].annotationId;
    }
  }

  const size = () => tree.all().length;

  const recalculate = () => set(store.all().map(a => a.target), true);

  return {
    all,
    clear,
    getAt,
    insert,
    recalculate,
    remove,
    set,
    size,
    update
  }

}

export type TextAnnotationStore = ReturnType<typeof createTextStore>;

export const createTextStore = () => {

  const store = createStore<TextAnnotation>();

  const tree = createSpatialTree(store);

  const selection = createSelectionState<TextAnnotation>(store);

  const getAt = (x: number, y: number): TextAnnotation | undefined => {
    const annotationId = tree.getAt(x, y);
    return annotationId ? store.getAnnotation(annotationId) : undefined;
  }

  store.observe(({ changes }) => {
    const { created, deleted, updated } = changes;

    if (created?.length > 0)
      tree.set(created.map(a => a.target), false);

    if (deleted?.length > 0)
      deleted.forEach(a => tree.remove(a.target));

    if (updated?.length > 0)
      updated.forEach(({ oldValue, newValue}) =>
        tree.update(oldValue.target, newValue.target));
  });

  return {
    ...store,
    getAt,
    selection
  }

}