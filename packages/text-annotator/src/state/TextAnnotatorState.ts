import type { Store } from '@annotorious/core';
import { 
  createHighlightState,
  createHoverState, 
  createSelectionState, 
  createStore, 
  AnnotatorState, 
  SelectionState, 
  HoverState, 
  HighlightState,  
  Origin
} from '@annotorious/core';
import { createSpatialTree } from './spatialTree';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { TextAnnotationStore } from './TextAnnotationStore';
import { reviveTarget } from './reviveTarget';

export type TextAnnotatorState = AnnotatorState<TextAnnotation> & {

  store: TextAnnotationStore;

  selection: SelectionState<TextAnnotation>;

  hover: HoverState<TextAnnotation>;

  highlight: HighlightState<TextAnnotation>;

}

export const createTextAnnotatorState = (container: HTMLElement): TextAnnotatorState => {

  const store: Store<TextAnnotation> = createStore<TextAnnotation>();

  const tree = createSpatialTree(store, container);

  const selection = createSelectionState<TextAnnotation>(store);

  const hover = createHoverState(store);

  const highlight = createHighlightState(store);

  // Wrap store interface to intercept annotations and revive DOM ranges, if needed
  const addAnnotation = (annotation: TextAnnotation, origin = Origin.LOCAL) => {
    const revived = annotation.target.selector.range instanceof Range ?
      annotation : { ...annotation, target: reviveTarget(annotation.target, container) };

    store.addAnnotation(revived, origin);
  }

  const bulkAddAnnotation = (annotations: TextAnnotation[], replace = true, origin = Origin.LOCAL) => {
    const bulkAdd = (retriesLeft: number = 5) => { 

      const revived = annotations.map(a => a.target.selector.range instanceof Range ?
        a : { ...a, target: reviveTarget(a.target, container )});
  
      // Initial render might take some time, and seems to happen in async. We'll
      // check if there are any collapsed ranges and, if so, wait a bit.
      const hasCollapsedRanges = revived.some(a => a.target.selector.range.collapsed);

      if (hasCollapsedRanges) {
        if (retriesLeft > 0) {
          console.warn('Found collapsed ranges - waiting');
          setTimeout(() => bulkAdd(retriesLeft - 1), 500);
        } else {
          console.warn('Could not revive all text ranges', 
            revived.filter(a => a.target.selector.range.collapsed));

          store.bulkAddAnnotation(revived, replace, origin);
        }
      } else {
        store.bulkAddAnnotation(revived, replace, origin);
      } 
    }

    bulkAdd();
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
    const ids = tree.getIntersecting(minX, minY, maxX, maxY);

    // Note that the tree could be slightly out of sync (because it updates
    // by listening to changes, just like anyone else)
    return ids.map(id => store.getAnnotation(id)).filter(a => a);
  }

  const recalculatePositions = () => tree.recalculate();

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
    store: {
      ...store,
      addAnnotation,
      bulkAddAnnotation,
      bulkUpdateTargets,
      getAt,
      getIntersecting,
      recalculatePositions,
      updateTarget
    },
    selection,
    hover,
    highlight
  }

}