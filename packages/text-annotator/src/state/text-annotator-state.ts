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
import { isRevived } from '../model';
import type {
  RevivedTextAnnotationLike,
  RevivedTextAnnotationTargetLike,
  TextAnnotation,
  TextAnnotationLike,
  TextAnnotationTargetLike
} from '../model';
import { createSpatialTree, type SpatialTreeEvents } from '../state/spatial-tree';
import type { AnnotationRects, TextAnnotationStore } from '../state/text-annotation-store';
import { reviveAnnotation, reviveTarget } from '../utils/annotation';
import type { TextAnnotatorOptions } from '../text-annotator-options';

export interface TextAnnotatorState<I extends TextAnnotationLike = TextAnnotationLike, E extends unknown = TextAnnotation> 
  extends Omit<AnnotatorState<I, E>, 'store'> {

  store: TextAnnotationStore<I>;

  selection: SelectionState<I, E>;

  hover: HoverState<I>;

  viewport: ViewportState;

}

export const createTextAnnotatorState = <I extends TextAnnotationLike = TextAnnotation, E extends unknown = TextAnnotation>(
  container: HTMLElement,
  opts: TextAnnotatorOptions<I, E>
): TextAnnotatorState<I, E> => {

  const store: Store<I> = createStore<I>();

  const tree = createSpatialTree(
    store,
    container,
    opts.mergeHighlights?.horizontalTolerance,
    opts.mergeHighlights?.verticalTolerance
  );

  const selection = createSelectionState<I, E>(store, opts.userSelectAction, opts.adapter);

  const hover = createHoverState(store);

  const viewport = createViewportState();

  const reviveAll = (annotations: I[]): { revived: I[], couldNotRevive: I[] } => {
    const revived = annotations.map(a => reviveAnnotation<I>(a, container, opts.selectorReviveFn));
    // Initial page load might take some time. Retry for more robustness.
    const couldNotRevive = revived.filter(a => !isRevived(a.target.selector));
    return { revived, couldNotRevive };
  }

  // Wrap store interface to intercept annotations and revive DOM ranges, if needed
  const addAnnotation = (annotation: I, origin = Origin.LOCAL): boolean => {
    const revived = reviveAnnotation(annotation, container, opts.selectorReviveFn);
    
    const isValid = isRevived(revived.target.selector);
    if (isValid)
      store.addAnnotation(revived, origin); 

    return isValid;
  }

  const syncAnnotations = (
    annotations: I[],
    origin = Origin.LOCAL
  ): I[] => {
    const { revived, couldNotRevive } = reviveAll(annotations);
    store.syncAnnotations(revived, origin);
    return couldNotRevive;
  }

  /**
   * @deprecated use {@link syncAnnotations} (replace) or {@link bulkUpsertAnnotations} (merge) instead.
   */
  const bulkAddAnnotations = (
    annotations: I[],
    replace = true,
    origin = Origin.LOCAL
  ): I[] => replace
    ? syncAnnotations(annotations, origin)
    : bulkUpsertAnnotations(annotations, origin);

  const updateAnnotation = (arg1: string | I, arg2?: I | Origin, arg3?: Origin) => {
    if (typeof arg1 === 'string') {
      const revived = reviveAnnotation(arg2 as I, container, opts.selectorReviveFn);
      store.updateAnnotation(arg1, revived, arg3);
    } else {
      const revived = reviveAnnotation(arg1, container, opts.selectorReviveFn);
      store.updateAnnotation(revived, arg2 as Origin);
    }
  }

  const bulkUpsertAnnotations = (
    annotations: I[],
    origin = Origin.LOCAL
  ): I[] => {
    const { revived, couldNotRevive } = reviveAll(annotations);
    store.bulkUpsertAnnotations(revived, origin);
    return couldNotRevive;
  }

  const updateTarget = (target: TextAnnotationTargetLike, origin = Origin.LOCAL) => {
    const revived = reviveTarget(target, container, opts.selectorReviveFn);
    store.updateTarget(revived, origin);
  }

  const bulkUpdateTargets = (targets: TextAnnotationTargetLike[], origin = Origin.LOCAL) => {
    const revived = targets.map(t => reviveTarget(t, container, opts.selectorReviveFn));
    store.bulkUpdateTargets(revived, origin);
  }

  function getAt(x: number, y: number, all: true, filter?: Filter): RevivedTextAnnotationLike<I>[] | undefined;
  function getAt(x: number, y: number, all: false, filter?: Filter): RevivedTextAnnotationLike<I> | undefined;
  function getAt(x: number, y: number, all?: boolean, filter?: Filter): RevivedTextAnnotationLike<I> | RevivedTextAnnotationLike<I>[] | undefined {
    const getAll = all || Boolean(filter);

    const annotations = tree.getAt(x, y, getAll).map(id => 
      store.getAnnotation(id) as RevivedTextAnnotationLike<I>).filter(Boolean);

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
  ): AnnotationRects<RevivedTextAnnotationLike<I>>[] => tree.getIntersecting(minX, minY, maxX, maxY);

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
      tree.set(created.map(a => a.target as RevivedTextAnnotationTargetLike), false);

    if (updated?.length > 0)
      updated.forEach(({ newValue }) => tree.update(newValue.target as RevivedTextAnnotationTargetLike));
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
      syncAnnotations,
      updateAnnotation,
      updateTarget
    },
    selection,
    hover,
    viewport
  }

}
