import type { Filter, Store, ViewportState } from '@annotorious/core';
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
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import { createSpatialTree, type SpatialTreeEvents } from '../state/spatial-tree';
import type { AnnotationRects, TextAnnotationStore } from '../state/text-annotation-store';
import { isRevived, reviveAnnotation, reviveTarget } from '../utils/annotation';
import type { TextAnnotatorOptions } from '../text-annotator-options';

export interface TextAnnotatorState<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> extends AnnotatorState<I, E> {

  store: TextAnnotationStore<I>;

  selection: SelectionState<I, E>;

  hover: HoverState<I>;

  viewport: ViewportState;

}

export const createTextAnnotatorState = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  container: HTMLElement,
  opts: TextAnnotatorOptions<I, E>
): TextAnnotatorState<I, E> => {

  const store: Store<I> = createStore<I>();

  const tree = createSpatialTree(store, container, opts.mergeHighlights?.horizontalTolerance, opts.mergeHighlights?.verticalTolerance);

  const selection = createSelectionState<I, E>(store, opts.userSelectAction, opts.adapter);

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

  const bulkAddAnnotations = (
    annotations: I[], 
    replace = true, 
    origin = Origin.LOCAL
  ): I[] => {
    const revived = annotations.map(a => reviveAnnotation<I>(a, container));

    // Initial page load might take some time. Retry for more robustness.
    const couldNotRevive = revived.filter(a => !isRevived(a.target.selector));
    store.bulkAddAnnotations(revived, replace, origin);

    return couldNotRevive;
  }
  
  const bulkUpsertAnnotations = (
    annotations: I[], 
    origin = Origin.LOCAL
  ): I[] => {
    const revived = annotations.map(a => reviveAnnotation(a, container));

    // Initial page load might take some time. Retry for more robustness.
    const couldNotRevive = revived.filter(a => !isRevived(a.target.selector));
    
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

  function getAt(x: number, y: number, all: true, filter?: Filter): I[] | undefined;
  function getAt(x: number, y: number, all: false, filter?: Filter): I | undefined;
  function getAt(x: number, y: number, all?: boolean, filter?: Filter): I | I[] | undefined {
    const getAll = all || Boolean(filter);

    const annotations = tree.getAt(x, y, getAll).map(id => store.getAnnotation(id));

    const filtered = filter ? annotations.filter(filter) : annotations;

    if (filtered.length === 0)
      return undefined;

    return all ? filtered : filtered[0];
  }

  const getAnnotationBounds = (id: string): DOMRect | undefined => {
    const rects = tree.getAnnotationRects(id);
    return rects.length > 0 ? tree.getAnnotationBounds(id) : undefined;
  }

  const getIntersecting = (
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): AnnotationRects<I>[] => tree.getIntersecting(minX, minY, maxX, maxY);

  const getAnnotationRects = (id: string): DOMRect[] => tree.getAnnotationRects(id);

  const recalculatePositions = () => tree.recalculate();
  const onRecalculatePositions = (callback: SpatialTreeEvents['recalculate']) => tree.on('recalculate', callback);

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
      bulkAddAnnotations,
      bulkUpdateTargets,
      bulkUpsertAnnotations,
      getAnnotationBounds,
      getAnnotationRects,
      getIntersecting,
      getAt,
      recalculatePositions,
      onRecalculatePositions,
      updateTarget
    },
    selection,
    hover,
    viewport
  }

}
