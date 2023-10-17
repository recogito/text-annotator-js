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
import { reviveTarget } from './reviveTarget';

export type TextAnnotatorState = AnnotatorState<TextAnnotation> & {

  store: TextAnnotationStore;

  selection: SelectionState<TextAnnotation>;

  hover: HoverState<TextAnnotation>;

  viewport: ViewportState;

}

// Shorthand
const hasValidRange = (annotation: TextAnnotation) => {
  const { range } = annotation.target.selector;
  return range instanceof Range && !range.collapsed;
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

  // Wrap store interface to intercept annotations and revive DOM ranges, if needed
  const addAnnotation = (annotation: TextAnnotation, origin = Origin.LOCAL): boolean => {
    const revived = annotation.target.selector.range instanceof Range ?
      annotation : { ...annotation, target: reviveTarget(annotation.target, container) };

    const { range } = revived.target.selector;
    const isValid = range && !range.collapsed;

    if (isValid)
      store.addAnnotation(revived, origin); 

    return isValid;
  }

  const bulkAddAnnotation = (
    annotations: TextAnnotation[], 
    replace = true, 
    origin = Origin.LOCAL
  ): TextAnnotation[] => {
    const revived = annotations.map(a => hasValidRange(a) ?
      a : { ...a, target: reviveTarget(a.target, container )});

    // Initial page load might take some time. Retry for more robustness.
    const hasCollapsedRanges = revived.some(a => a.target.selector.range.collapsed);
    if (hasCollapsedRanges) {
      const couldNotRevive = revived.filter(a => a.target.selector.range.collapsed);
      console.warn('Could not revive all targets');
      console.warn(couldNotRevive);

      // Note: we want to keep ALL annotations in the store, even those that
      // were not revived - even if the highlighter won't be able to render
      // the un-revived ones to the screen.
      store.bulkAddAnnotation(revived, replace, origin);

      return couldNotRevive;
    } else {
      store.bulkAddAnnotation(revived, replace, origin);
      return [];
    }
  }

  const updateTarget = (target: TextAnnotationTarget, origin = Origin.LOCAL) => {
    const revived = target.selector.range instanceof Range ?
      target : reviveTarget(target, container);

    store.updateTarget(revived, origin);
  }

  const bulkUpdateTargets = (targets: TextAnnotationTarget[], origin = Origin.LOCAL) => {
    const revived = targets.map(t => t.selector.range instanceof Range ? t : reviveTarget(t, container));
    store.bulkUpdateTargets(revived, origin);
  }

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
    const created = (changes.created || []).filter(hasValidRange);
    const deleted = (changes.deleted || []).filter(hasValidRange);
    const updated = (changes.updated || []).filter(u => hasValidRange(u.newValue));

    if (created.length > 0)
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
      addAnnotation,
      bulkAddAnnotation,
      bulkUpdateTargets,
      getAnnotationBounds,
      getAt,
      getIntersecting,
      getIntersectingRects,
      recalculatePositions,
      updateTarget
    } as TextAnnotationStore,
    selection,
    hover,
    viewport
  }

}