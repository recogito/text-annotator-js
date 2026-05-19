import { 
  type TextAnnotation,
  type TextAnnotationTarget,
  type TextAnnotatorOptions,
  createTextAnnotator, 
} from '@recogito/text-annotator';
import { 
  Origin,
  type Annotator,
  type Store,  
} from '@annotorious/core';
import { 
  compareSelectors,
  reviveSelector,
  textToTEIAnnotation, 
  textToTEITarget 
} from './crosswalk';
import type { 
  TEIAnnotation,
  TEIAnnotationTarget
} from './tei-annotation';

export type TEIAnnotationStore = Store<TEIAnnotation> & {

  // Minor change to default Annotorious store - text store returns annotations
  // that failed to render, to support lazy document loading scenarios
  bulkAddAnnotation(annotations: TextAnnotation[], replace: boolean, origin: Origin): TEIAnnotation[];

  getAt(x: number, y: number): TEIAnnotation | undefined;
  
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): TEIAnnotation[];
  
  recalculatePositions(): void;

}

export interface TEIAnnotator<T extends unknown = TEIAnnotation> extends Annotator<TEIAnnotation, T> { }

export const createTEIAnnotator = <T extends unknown>(
  container: HTMLElement,
  options: TextAnnotatorOptions<TEIAnnotation, T> = {}
): TEIAnnotator => {
  const anno = createTextAnnotator(container, {
    ...options,
    selectorReviveFn: reviveSelector,
    selectorCompareFn: compareSelectors
  });

  const toTEI = textToTEIAnnotation(container);

  const toTEITarget = textToTEITarget(container);

  // Monkey-patch the store
  const store = anno.state.store;

  const _addAnnotation = store.addAnnotation;
  store.addAnnotation = (annotation: TEIAnnotation | TextAnnotation, origin: Origin) => {
    const { selector } = annotation.target;
    try {
      return ('startSelector' in selector && 'start' in selector) ?
        _addAnnotation(annotation as TEIAnnotation, origin) :
        _addAnnotation(toTEI(annotation), origin);
    } catch (error) {
      console.warn(error);
      console.warn(`Failed to render annotation`, annotation);
      return false;
    }
  }

  /*
  const _bulkAddAnnotations = store.bulkAddAnnotations;
  store.bulkAddAnnotations = (annotations: Array<TEIAnnotation | TextAnnotation>, replace = true, origin: Origin) => {
    return _bulkAddAnnotations(annotations as TEIAnnotation[], replace, origin);
  }
  */

  const _updateAnnotation = store.updateAnnotation;
  // @ts-ignore
  store.updateAnnotation = (annotation: TEIAnnotation | TextAnnotation, origin: Origin) =>
    _updateAnnotation(toTEI(annotation), origin);

  const _updateTarget = store.updateTarget;
  store.updateTarget = (target: TEIAnnotationTarget | TextAnnotationTarget, origin: Origin = Origin.LOCAL) => 
    _updateTarget(toTEITarget(target), origin);

  return {
    ...anno,
    // @ts-ignore
    state: {
      ...anno.state,
      store: store as Store<TEIAnnotation>
    }
  }

}
