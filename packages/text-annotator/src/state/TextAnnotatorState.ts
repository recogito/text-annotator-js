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
import { isRevived, reviveAnnotation, reviveTarget } from '../utils';

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

  // Wrap store interface to intercept annotations and revive DOM ranges, if needed
  const addAnnotation = (annotation: TextAnnotation, origin = Origin.LOCAL): boolean => {
    const revived = reviveAnnotation(annotation, container);

    const isValid = isRevived(revived.target.selector);
    if (isValid)
      store.addAnnotation(revived, origin); 

    return isValid;
  }

  const bulkAddAnnotation = (
    annotations: TextAnnotation[], 
    replace = true, 
    origin = Origin.LOCAL
  ): TextAnnotation[] => {
    const revived = annotations.map(a => reviveAnnotation(a, container));

    // Initial page load might take some time. Retry for more robustness.
    const couldNotRevive = revived.filter(a => !isRevived(a.target.selector));
    if (couldNotRevive.length > 0) {
      console.warn('Could not revive all targets for these annotations:', couldNotRevive);

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
    const revived = reviveTarget(target, container);
    store.updateTarget(revived, origin);
  }

  const bulkUpdateTargets = (targets: TextAnnotationTarget[], origin = Origin.LOCAL) => {
    const revived = targets.map(t => reviveTarget(t, container));
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
    return ids.map(id => store.getAnnotation(id)).filter(Boolean);
  }

  const getAnnotationBounds = (id: string, x?: number, y?: number, buffer = 5): DOMRect => {
    const rects = tree.getDOMRectsForAnnotation(id);
    if (rects.length === 0) return;

    if (x && y) {
      const match = rects.find(({ top, right, bottom, left }) =>
        x >= left - buffer && x <= right + buffer && y >= top - buffer && y <= bottom + buffer);

      // Preferred bounds: the rectangle
      if (match) return match;
    }

    return tree.getBoundsForAnnotation(id);
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
    const created = (changes.created || []).filter(a => isRevived(a.target.selector));
    const deleted = (changes.deleted || []).filter(a => isRevived(a.target.selector));
    const updated = (changes.updated || []).filter(u => isRevived(u.newValue.target.selector));

    if (created.length > 0)
      tree.set(created.map(a => a.target), false);

    if (deleted?.length > 0)
      deleted.forEach(a => tree.remove(a.target));

    if (updated?.length > 0)
      updated.forEach(({ newValue }) => tree.update(newValue.target));
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
