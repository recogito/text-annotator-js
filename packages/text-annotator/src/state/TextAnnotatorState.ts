import type { Filter, PointerSelectAction, Store, ViewportState } from '@annotorious/core';
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
import { createSpatialTree } from './spatialTree';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { TextAnnotationStore } from './TextAnnotationStore';
import { isRevived, reviveAnnotation, reviveTarget } from '../utils';

export interface TextAnnotatorState extends AnnotatorState<TextAnnotation> {

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
  
  const bulkUpsertAnnotations = (
    annotations: TextAnnotation[], 
    origin = Origin.LOCAL
  ): TextAnnotation[] => {
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

  const getAt = (x: number, y: number, filter?: Filter): TextAnnotation | undefined => {
    const annotations = tree.getAt(x, y, Boolean(filter)).map(id => store.getAnnotation(id));
    const filtered = filter ? annotations.filter(filter) : annotations;
    return filtered.length > 0 ? filtered[0] : undefined;
  }

  const getAnnotationBounds = (id: string, x?: number, y?: number, buffer = 5): DOMRect => {
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
      getAt,
      getIntersecting: tree.getIntersecting,
      recalculatePositions,
      updateTarget
    },
    selection,
    hover,
    viewport
  }

}
