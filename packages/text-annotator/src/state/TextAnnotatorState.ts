import type { PointerSelectAction, Store, ViewportState } from '@annotorious/core';
import { 
  createHoverState, 
  createSelectionState, 
  createStore, 
  AnnotatorState, 
  SelectionState, 
  HoverState, 
  Origin,
  createViewportState
} from '@annotorious/core';
import { IndexedHighlightRect, createSpatialTree } from './spatialTree';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { AnnotationRects, TextAnnotationStore } from './TextAnnotationStore';

export type TextAnnotatorState = AnnotatorState<TextAnnotation> & {

  store: TextAnnotationStore;

  selection: SelectionState<TextAnnotation>;

  hover: HoverState<TextAnnotation>;

  viewport: ViewportState;

}

export const createTextAnnotatorState = (
  container: HTMLElement,
  defaultPointerAction?: PointerSelectAction | ((annotation: TextAnnotation) => PointerSelectAction)
): TextAnnotatorState => {

  const store: Store<TextAnnotation> = createStore<TextAnnotation>();

  const tree = createSpatialTree(store, container);

  const selection = createSelectionState<TextAnnotation>(store, defaultPointerAction);

  const hover = createHoverState(store);

  const viewport = createViewportState();

  const getAt = (x: number, y: number): TextAnnotation | undefined => {
    const annotationId = tree.getAt(x, y);
    return annotationId ? store.getAnnotation(annotationId) : undefined;
  }

  const getIntersecting = (minX: number, minY: number, maxX: number, maxY: number) => {
    const rects = tree.getIntersectingRects(minX, minY, maxX, maxY);
    const ids = Array.from(new Set(rects.map(item => item.annotation.id)));

    // Note that the tree could be slightly out of sync (because it updates
    // by listening to changes, just like anyone else)
    return ids.map(id => store.getAnnotation(id)).filter(a => a);
  }

  const getAnnotationBounds = (id: string, x?: number, y?: number, buffer = 5) => {
    const rects = tree.getDOMRectsForAnnotation(id);
    if (rects.length > 0) {
      if (x && y) {
        const match = rects.find(({ top, right, bottom, left }) =>
          x >= left - buffer && x <= right + buffer && y >= top - buffer && y <= bottom + buffer);

        if (match)
          // Preferred bounds: the rectangle 
          return [match];
      }
        
      return rects;
    }
  }

  const getIntersectingRects = (
    minX: number, 
    minY: number, 
    maxX: number, 
    maxY: number
  ): AnnotationRects[] => {
    const rects = tree.getIntersectingRects(minX, minY, maxX, maxY);

    // Group by annotation ID
    const groupedByAnnotationId: { [key:string]: IndexedHighlightRect[] } = rects.reduce((grouped, rect) => {
      (grouped[rect.annotation.id] = grouped[rect.annotation.id] || []).push(rect);
      return grouped;
    }, {});

    // Resolve annotation IDs
    return Object.entries(groupedByAnnotationId).map(([annotationId, rects]) => ({
      annotation: store.getAnnotation(annotationId),
      rects: rects.map(({ minX, minY, maxX, maxY }) => 
        ({ x: minX, y: minY, width: maxX - minX, height: maxY - minY }))
    }));
  }

  const recalculatePositions = () => tree.recalculate();

  store.observe(({ changes }) => {
    const { created, deleted, updated } = changes;
    
    if (created?.length > 0)
      tree.set(created.map(a => a.target), false);

    if (deleted?.length > 0)
      deleted.forEach(a => tree.remove(a.target));

    if (updated?.length > 0)
      updated.forEach(({ newValue }) =>
        tree.update(newValue.target));
  });

  return {
    store: {
      ...store,
      getAnnotationBounds,
      getAt,
      getIntersecting,
      getIntersectingRects,
      recalculatePositions,

    } as TextAnnotationStore,
    selection,
    hover,
    viewport
  }

}