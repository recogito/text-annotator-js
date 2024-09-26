import type { Filter, Store, ViewportState, UserSelectActionExpression, Annotation } from '@annotorious/core';
import { 
  createHoverState, 
  createSelectionState, 
  createStore, 
  Origin,
  createViewportState
} from '@annotorious/core';
import type { 
  AnnotatorState, 
  SelectionState, 
  HoverState, 
} from '@annotorious/core';
import { createSpatialTree } from './spatialTree';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { AnnotationRects, TextAnnotationStore } from './TextAnnotationStore';
import { isRevived, reviveAnnotation, reviveTarget } from '../utils';

export interface TextAnnotatorState<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> extends AnnotatorState<I, E> {

  store: TextAnnotationStore<I>;

  selection: SelectionState<I, E>;

  hover: HoverState<I>;

  viewport: ViewportState;

}

export const createTextAnnotatorState = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  container: HTMLElement,
  defaultUserSelectAction?: UserSelectActionExpression<E>
): TextAnnotatorState<I, E> => {

  const store: Store<I> = createStore<I>();

  const tree = createSpatialTree(store, container);

  // Temporary
  const selection = createSelectionState<I, E>(store)
  selection.setUserSelectAction(defaultUserSelectAction);

  const hover = createHoverState(store);

  const viewport = createViewportState();

  // Wrap store interface to intercept annotations and revive DOM ranges, if needed
  const addAnnotation = (annotation: I, origin = Origin.LOCAL): boolean => {
    const revived = reviveAnnotation(annotation, container);

    const isValid = isRevived(revived.target.selector);
    if (isValid)
      store.addAnnotation(revived, origin); 

    return isValid;
  }

  const bulkAddAnnotation = (
    annotations: I[], 
    replace = true, 
    origin = Origin.LOCAL
  ): I[] => {
    const revived = annotations.map(a => reviveAnnotation<I>(a, container));

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
  
  const bulkUpsertAnnotations = (
    annotations: I[], 
    origin = Origin.LOCAL
  ): I[] => {
    const revived = annotations.map(a => reviveAnnotation(a, container));

    // Initial page load might take some time. Retry for more robustness.
    const couldNotRevive = revived.filter(a => !isRevived(a.target.selector));
    if (couldNotRevive.length > 0)
      console.warn('Could not revive all targets for these annotations:', couldNotRevive);

    revived.forEach(a => {
      if (store.getAnnotation(a.id))
        store.updateAnnotation(a, origin);
      else 
        store.addAnnotation(a, origin);
    })

    return couldNotRevive;
  }

  const updateTarget = (target: TextAnnotationTarget, origin = Origin.LOCAL) => {
    const revived = reviveTarget(target, container);
    store.updateTarget(revived, origin);
  }

  const bulkUpdateTargets = (targets: TextAnnotationTarget[], origin = Origin.LOCAL) => {
    const revived = targets.map(t => reviveTarget(t, container));
    store.bulkUpdateTargets(revived, origin);
  }

  const getAt = (x: number, y: number, filter?: Filter): I | undefined => {
    const annotations = tree.getAt(x, y, Boolean(filter)).map(id => store.getAnnotation(id));
    const filtered = filter ? annotations.filter(filter) : annotations;
    return filtered.length > 0 ? filtered[0] : undefined;
  }

  const getAnnotationBounds = (id: string, x?: number, y?: number, buffer = 5): DOMRect | undefined => {
    const rects = tree.getAnnotationRects(id);
    if (rects.length === 0) return;

    if (x && y) {
      const match = rects.find(({ top, right, bottom, left }) =>
        x >= left - buffer && x <= right + buffer && y >= top - buffer && y <= bottom + buffer);

      // Preferred bounds: the rectangle
      if (match) return match;
    }

    return tree.getAnnotationBounds(id);
  }

  const getIntersecting = (
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): AnnotationRects<I>[] => tree.getIntersecting(minX, minY, maxX, maxY);

  const getAnnotationRects = (id: string): DOMRect[] => tree.getAnnotationRects(id);

  const recalculatePositions = () => tree.recalculate();

  store.observe(({ changes }) => {
    const deleted = (changes.deleted || []).filter(a => isRevived(a.target.selector));
    const created = (changes.created || []).filter(a => isRevived(a.target.selector));
    const updated = (changes.updated || []).filter(u => isRevived(u.newValue.target.selector));

    if (deleted?.length > 0)
      deleted.forEach(a => tree.remove(a.target));

    if (created.length > 0)
      tree.set(created.map(a => a.target), false);

    if (updated?.length > 0)
      updated.forEach(({ newValue }) => tree.update(newValue.target));
  });

  return {
    store: {
      ...store,
      addAnnotation,
      bulkAddAnnotation,
      bulkUpdateTargets,
      bulkUpsertAnnotations,
      getAnnotationBounds,
      getAnnotationRects,
      getIntersecting,
      getAt,
      recalculatePositions,
      updateTarget
    },
    selection,
    hover,
    viewport
  }

}
