import type { 
  RecogitoTextAnnotator,
  TextAnnotation, 
  TextAnnotationStore,
  TextAnnotationTarget, 
} from '@recogito/text-annotator';
import type { 
  Annotator,
  LifecycleEvents,
  Origin,  
  Store,  
  // StoreChangeEvent,
  // StoreObserveOptions 
} from '@annotorious/core';
import { 
  // teiToTextAnnotation, 
  // teiToTextTarget, 
  textToTEIAnnotation, 
  textToTEITarget 
} from './crosswalk';
import type { 
  TEIAnnotation,
  TEIAnnotationTarget
} from './TEIAnnotation';

// type TEIEvents = LifecycleEvents<TEIAnnotation>;

export type TEIAnnotationStore = Store<TEIAnnotation> & {

  getAt(x: number, y: number): TEIAnnotation | undefined;
  
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): TEIAnnotation[];
  
  recalculatePositions(): void;

}

export interface RecogitoTEIAnnotator<T extends unknown = TEIAnnotation> extends Annotator<TEIAnnotation, T> { }

export const TEIPlugin = (anno: RecogitoTextAnnotator): RecogitoTEIAnnotator => {

  const container: HTMLElement = anno.element;

  const toTEI = textToTEIAnnotation(container);

  const toTEITarget = textToTEITarget(container);

  /*
  const observers: Array<{
    onChange: (event: StoreChangeEvent<TEIAnnotation>) => void,
    wrapped: (event: StoreChangeEvent<TextAnnotation>) => void
  }> = [];

  const listeners: Array<{
    callback: TEIEvents[keyof TEIEvents],
    wrapped: LifecycleEvents<TextAnnotation>[keyof TEIEvents]
  }> = [];

  // Wrap lifecycle handlers
  const on = <E extends keyof TEIEvents>(event: E, callback: TEIEvents[E]) => {
    let wrapped: LifecycleEvents<TextAnnotation>[E]; 

    if (event === 'createAnnotation' || event === 'deleteAnnotation') {
      // @ts-ignore
      wrapped = (a: TextAnnotation) => callback(toTEI(a), undefined);
      anno.on(event, wrapped);
    } else if (event === 'selectionChanged') {
      // @ts-ignore
      wrapped = (a: TextAnnotation[]) => callback(a.map(toTEI));
      anno.on(event, wrapped);
    } else if (event === 'updateAnnotation') {
      // @ts-ignore
      wrapped =  (a: TextAnnotation, b: TextAnnotation) => callback(toTEI(a), teiTEI(b));
      anno.on(event, wrapped);
    } else if (event === 'viewportIntersect') {
      // @ts-ignore
      wrapped = (a: TextAnnotation[]) => callback(a.map(teiTEI));
      anno.on(event, wrapped);
    }

    if (wrapped)
      listeners.push({ callback, wrapped });
  }

  const off = <E extends keyof TEIEvents>(event: E, callback: TEIEvents[E]) => {
    const idx = listeners.findIndex(listener => listener.callback === callback);
    if (idx > -1) {
      // @ts-ignore
      anno.off(event, listeners[idx].wrapped);
      listeners.splice(idx, 1);
    }
  }
  */

  // Monkey-patch the store
  const store = anno.state.store as TextAnnotationStore;

  const _addAnnotation = store.addAnnotation;
  store.addAnnotation = (annotation: TEIAnnotation | TextAnnotation, origin: Origin) => {
    const { selector } = annotation.target;
    if (!('startSelector' in selector))
      _addAnnotation(toTEI(annotation), origin);
  }

  const _bulkAddAnnotation = store.bulkAddAnnotation;
  store.bulkAddAnnotation = (annotations: Array<TEIAnnotation | TextAnnotation>, replace = true, origin: Origin) => {
    const teiAnnotations = annotations.map(a => {
      const { selector } = a.target;
      return 'startSelector' in selector ? a : toTEI(a);
    });
    
    _bulkAddAnnotation(teiAnnotations, replace, origin);
  }

  const _updateAnnotation = store.updateAnnotation;
  store.updateAnnotation = (annotation: TEIAnnotation | TextAnnotation, origin: Origin) =>
    _updateAnnotation(toTEI(annotation), origin);

  const _updateTarget = store.updateTarget;
  store.updateTarget = (target: TEIAnnotationTarget | TextAnnotationTarget, origin: Origin) => 
    _updateTarget(toTEITarget(target), origin);

  /*
  const _observe = store.observe;
  store.observe = (
    onChange: { (event: StoreChangeEvent<TEIAnnotation>): void }, 
    options: StoreObserveOptions = {}
  ) => {
    const wrapped = (event: StoreChangeEvent<TextAnnotation>) => {
      const { changes, origin, state } = event;

      const crosswalkedChanges = {
        created: (changes.created || []).map(toTEI),
        deleted: (changes.deleted || []).map(toTEI),
        updated: (changes.updated || []).map(update => ({
          ...update,
          oldValue: toTEI(update.oldValue),
          newValue: toTEI(update.newValue),
          targetUpdated: update.targetUpdated ? ({ 
            oldTarget: textToTEITarget(container)(update.targetUpdated.oldTarget as TextAnnotationTarget), 
            newTarget: textToTEITarget(container)(update.targetUpdated.newTarget as TextAnnotationTarget)
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

    _observe(wrapped, options);

    return observers.push({ onChange, wrapped });
  }

  const _unobserve = store.unobserve;
  store.unobserve = (onChange: { (event: StoreChangeEvent<TEIAnnotation>): void }) => {
    const idx = observers.findIndex(observer => observer.onChange == onChange);
    if (idx > -1) {
      _unobserve(observers[idx].wrapped);
      observers.splice(idx, 1);
    }
  }*/

  return {
    ...anno,
    // on,
    // off,
    state: {
      ...anno.state,
      // @ts-ignore
      store
    }
  }

}