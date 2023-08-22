import type { TextAnnotation, TextAnnotationTarget, TextAnnotator } from '@recogito/text-annotator';
import type { Origin, LifecycleEvents, StoreChangeEvent, StoreObserveOptions } from '@annotorious/core';
import { teiToTextAnnotation, teiToTextTarget, textToTEIAnnotation, textToTEITarget } from './crosswalk';
import type { TEIAnnotation, TEIAnnotationTarget } from './TEIAnnotation';
import type { TextAnnotatorState } from '@recogito/text-annotator/dist/src/state';

type TextEvents = LifecycleEvents<TextAnnotation>;

export const TEIPlugin = (anno: TextAnnotator) => {

  const container: HTMLElement = anno.element;

  console.log('tei plugin container', container)

  const observers: Array<{
    onChange: (event: StoreChangeEvent<TEIAnnotation>) => void,
    wrapped: (event: StoreChangeEvent<TextAnnotation>) => void
  }> = [];

  // Wrap lifecycle handlers
  const on = <E extends keyof TextEvents>(event: E, callback: TextEvents[E]) => {
    if (event === 'createAnnotation' || event === 'deleteAnnotation') {
      // @ts-ignore
      anno.on(event, (a: TextAnnotation) => callback(textToTEIAnnotation(a)));
    } else if (event === 'selectionChanged') {
      // @ts-ignore
      anno.on(event, (a: TextAnnotation[]) => callback(a.map(textToTEIAnnotation)));
    } else if (event === 'updateAnnotation') {
      // @ts-ignore
      anno.on(event, (a: TextAnnotation, b: TextAnnotation) => callback(textToTEIAnnotation(a), textToTEIAnnotation(b)));
    }
  }

  // Wrap store
  const { store } = anno.state as TextAnnotatorState;

  const toText = teiToTextAnnotation(container);

  const toTextTarget = teiToTextTarget(container);

  const addAnnotation = (annotation: TEIAnnotation, origin: Origin) =>
    store.addAnnotation(teiToTextAnnotation(container)(annotation), origin);

  // TODO cache this!
  const all = () => 
    store.all().map(textToTEIAnnotation)

  const bulkAddAnnotation = (annotations: TEIAnnotation[], replace = true, origin: Origin) =>
    store.bulkAddAnnotation(annotations.map(toText), replace, origin);

  const bulkUpdateTargets = (targets: TEIAnnotationTarget[], origin: Origin) =>
    store.bulkUpdateTargets(targets.map(toTextTarget), origin); 
  
  const getAnnotation = (id: string) => {
    const textAnnotation = store.getAnnotation(id);
    if (textAnnotation)
      return textToTEIAnnotation(textAnnotation);
  }

  const getAt = (x: number, y: number): TEIAnnotation | undefined => {
    const textAnnotation = store.getAt(x, y);
    if (textAnnotation)
      return textToTEIAnnotation(textAnnotation);
  }

  const getIntersecting = (minX: number, minY: number, maxX: number, maxY: number) =>
    store.getIntersecting(minX, minY, maxX, maxY).map(textToTEIAnnotation);
  
  const updateAnnotation = (annotation: TEIAnnotation, origin: Origin) => {
    store.updateAnnotation(toText(annotation), origin);
  }

  const updateTarget = (target: TEIAnnotationTarget, origin: Origin) => 
    store.updateTarget(toTextTarget(target), origin);

  // Wrap observe/unobserve
  const observe = (
    onChange: { (event: StoreChangeEvent<TEIAnnotation>): void }, 
    options: StoreObserveOptions = {}
  ) => {
    const wrapped = (event: StoreChangeEvent<TextAnnotation>) => {
      const { changes, origin, state } = event;

      const crosswalkedChanges = {
        created: (changes.created || []).map(textToTEIAnnotation),
        deleted: (changes.deleted || []).map(textToTEIAnnotation),
        updated: (changes.updated || []).map(update => ({
          ...update,
          oldValue: textToTEIAnnotation(update.oldValue),
          newValue: textToTEIAnnotation(update.newValue),
          targetUpdated: update.targetUpdated ? ({ 
            oldTarget: textToTEITarget(update.targetUpdated.oldTarget as TextAnnotationTarget), 
            newTarget: textToTEITarget(update.targetUpdated.newTarget as TextAnnotationTarget)
          }) : undefined
        }))
      }

      onChange({ 
        changes: crosswalkedChanges, 
        origin, 
        // TODO keep local copies. Otherwise every store change
        // would mean we'll re-compute all DOM ranges!
        state: state as unknown as TEIAnnotation[] 
      });
    };

    // TODO need to keep a record of 'wrapped' and intercept the unobserve method
    store.observe(wrapped, options);

    return observers.push({ onChange, wrapped });
  }

  const unobserve = (onChange: { (event: StoreChangeEvent<TEIAnnotation>): void }) => {
    const idx = observers.findIndex(observer => observer.onChange == onChange);
    if (idx > -1) {
      store.unobserve(observers[idx].wrapped);
      observers.splice(idx, 1);
    }
  }

  return {
    ...anno,
    on,
    state: {
      ...anno.state,
      store: {
        ...anno.state.store,
        addAnnotation,
        all,
        bulkAddAnnotation,
        bulkUpdateTargets,
        getAnnotation,
        getAt,
        getIntersecting,
        observe,
        unobserve,
        updateAnnotation,
        updateTarget
      }
    }
  }

}