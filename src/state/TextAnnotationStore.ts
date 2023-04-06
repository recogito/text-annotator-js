import { Origin, createHoverState, createSelectionState, createStore} from '@annotorious/core';
import { createSpatialTree } from './spatialTree';
import type { TextAnnotation, TextAnnotationTarget } from '../model';

/**
 * Recalculates the DOM range from the given text annotation target.
 * 
 * @param annotation the text annotation
 * @param container the HTML container of the annotated content
 * @returns the DOM range
 */
const reviveTarget = (target: TextAnnotationTarget, container: HTMLElement): TextAnnotationTarget => {
  const { quote, start, end } = target.selector;

  const iterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT);

  let runningOffset = 0;

  let range = document.createRange();

  let n = iterator.nextNode();

  // set range start
  while (n !== null) {
    const len = n.textContent.length;

    if (runningOffset + len > start) {
      range.setStart(n, start - runningOffset);
      break;
    }

    runningOffset += len;

    n = iterator.nextNode();
  }

  // set range end
  while (n !== null) {
    const len = n.textContent.length;

    if (runningOffset + len > end) {
      range.setEnd(n, end - runningOffset);
      break;
    }

    runningOffset += len;

    n = iterator.nextNode();
  }

  return {
    ...target,
    selector: { quote, start, end, range }
  }
}

export type TextAnnotationStore = ReturnType<typeof createTextStore>;

export const createTextStore = (container: HTMLElement) => {

  const store = createStore<TextAnnotation>();

  const tree = createSpatialTree(store, container);

  const selection = createSelectionState<TextAnnotation>(store);

  const hover = createHoverState(store);

  // Wrap store interface to intercept annotations and revive DOM ranges, if needed
  const addAnnotation = (annotation: TextAnnotation, origin = Origin.LOCAL) => {
    const revived = annotation.target.selector.range instanceof Range ?
      annotation : { ...annotation, target: reviveTarget(annotation.target, container) };

    store.addAnnotation(revived, origin);
  }

  const bulkAddAnnotation = (annotations: TextAnnotation[], replace = true, origin = Origin.LOCAL) => {
    const revived = annotations.map(a => a.target.selector.range instanceof Range ?
      a : { ...a, target: reviveTarget(a.target, container )});

    store.bulkAddAnnotation(revived, replace, origin);
  }

  const updateTarget = (target: TextAnnotationTarget, origin = Origin.LOCAL) => {
    const revived = target.selector.range instanceof Range ?
      target : reviveTarget(target, container);

    store.updateTarget(revived, origin);
  }

  const bulkUpdateTarget = (targets: TextAnnotationTarget[], origin = Origin.LOCAL) => {
    const revived = targets.map(t => t.selector.range instanceof Range ? t : reviveTarget(t, container));
    store.bulkUpdateTarget(revived, origin);
  }

  const getAt = (x: number, y: number): TextAnnotation | undefined => {
    const annotationId = tree.getAt(x, y);
    return annotationId ? store.getAnnotation(annotationId) : undefined;
  }

  const getIntersecting = (minX: number, minY: number, maxX: number, maxY: number) => {
    const ids = tree.getIntersecting(minX, minY, maxX, maxY);
    return ids.map(id => store.getAnnotation(id));
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
    ...store,
    addAnnotation,
    bulkAddAnnotation,
    bulkUpdateTarget,
    getAt,
    getIntersecting,
    hover,
    recalculatePositions,
    selection,
    updateTarget
  }

}