import type { TextAnnotation, TextAnnotationTarget, TextAnnotator } from '@recogito/text-annotator';
import type { Origin, LifecycleEvents, ChangeSet, StoreChangeEvent, StoreObserveOptions } from '@annotorious/core';
import { rangeToTEIRangeSelector, teiRangeSelectorToRange } from './crosswalk';
import type { TEIAnnotation, TEIAnnotationTarget } from './TEIAnnotation';
import type { TextAnnotatorState } from '@recogito/text-annotator/dist/src/state';

type TextEvents = LifecycleEvents<TextAnnotation>;

export const TEIPlugin = (anno: TextAnnotator) => {

  const container: HTMLElement = anno.element;

  // Forward crosswalk - text offset to XPath selector
  const fwd = (a: TextAnnotation): TEIAnnotation => {
    const selector = rangeToTEIRangeSelector(a.target.selector);

    return {
      ...a,
      target: {
        ...a.target,
        selector: {
          ...selector,
          range: a.target.selector.range,
          quote: a.target.selector.quote
        }
      }
    }
  }

  // TODO reverse crosswalk - XPath to text offset selector
  const rvs = (a: TEIAnnotation): TextAnnotation => {
    const range = teiRangeSelectorToRange(a.target.selector, container);

    return {
      ...a,
      target: {
        ...a.target,
        selector: {
          // Ideally, we'd populate these values. But they are never
          // used in practice - AT THE MOMENT...
          start: null,
          end: null,
          quote: a.target.selector.quote,
          range
        }
      }
    }
  }

  const fwdTarget = (t: TextAnnotationTarget): TEIAnnotationTarget => {
    const selector = rangeToTEIRangeSelector(t.selector);
    return {
      ...t,
      selector: {
        ...selector,
        range: t.selector.range,
        quote: t.selector.quote
      }
    }
  }

  const rvsTarget = (t: TEIAnnotationTarget): TextAnnotationTarget => {
    const range = teiRangeSelectorToRange(t.selector, container);
    return {
      ...t,
      selector: {
        // Ideally, we'd populate these values. But they are never
        // used in practice - AT THE MOMENT...
        start: null,
        end: null,
        quote: t.selector.quote,
        range
      }
    }
  }

  const on = <E extends keyof TextEvents>(event: E, callback: TextEvents[E]) => {
    if (event === 'createAnnotation' || event === 'deleteAnnotation') {
      // @ts-ignore
      anno.on(event, (a: TextAnnotation) => callback(fwd(a)));
    } else if (event === 'selectionChanged') {
      // @ts-ignore
      anno.on(event, (a: TextAnnotation[]) => callback(a.map(fwd)));
    } else if (event === 'updateAnnotation') {
      // @ts-ignore
      anno.on(event, (a: TextAnnotation, b: TextAnnotation) => callback(fwd(a), fwd(b)));
    }
  }

  // Wrap state

  const state = anno.state as TextAnnotatorState;

  const addAnnotation = (annotation: TEIAnnotation, origin: Origin) =>
    state.store.addAnnotation(rvs(annotation), origin);

  const all = () => 
    state.store.all().map(fwd);

  const bulkAddAnnotation = (annotations: TEIAnnotation[], replace = true, origin: Origin) =>
    state.store.bulkAddAnnotation(annotations.map(rvs), replace, origin);

  const bulkUpdateTargets = (targets: TEIAnnotationTarget[], origin: Origin) =>
    state.store.bulkUpdateTargets(targets.map(rvsTarget), origin); 
  
  const getAnnotation = (id: string) => {
    const a = state.store.getAnnotation(id);
    if (a)
      return fwd(a);
  }

  const getAt = (x: number, y: number): TEIAnnotation | undefined => {
    const a = state.store.getAt(x, y);
    if (a)
      return fwd(a);
  }

  const getIntersecting = (minX: number, minY: number, maxX: number, maxY: number) =>
    state.store.getIntersecting(minX, minY, maxX, maxY).map(fwd);
  
  const updateAnnotation = (annotation: TEIAnnotation, origin: Origin) =>
    state.store.updateAnnotation(rvs(annotation), origin);

  const updateTarget = (target: TEIAnnotationTarget, origin: Origin) => 
    state.store.updateTarget(rvsTarget(target), origin);

  const observe = (onChange: { (event: StoreChangeEvent<TEIAnnotation>): void }, options: StoreObserveOptions = {}) => {
    const wrapped = (event: StoreChangeEvent<TextAnnotation>) => {
      const { changes, origin, state } = event;

      const crosswalkedChanges = {
        created: (changes.created || []).map(fwd),
        deleted: (changes.deleted || []).map(fwd),
        updated: (changes.updated || []).map(update => ({
          ...update,
          oldValue: fwd(update.oldValue),
          newValue: fwd(update.newValue),
          targetUpdated: update.targetUpdated ? ({ 
            oldTarget: fwdTarget(update.targetUpdated.oldTarget as TextAnnotationTarget), 
            newTarget: fwdTarget(update.targetUpdated.newTarget as TextAnnotationTarget)
          }) : undefined
        }))
      }

      onChange({ 
        changes: crosswalkedChanges, 
        origin, 
        // TODO keep local copies. Otherwise every store change
        // would mean we'll re-compute all DOM ranges!
        state: [] as TEIAnnotation[] 
      });
    };

    // TODO need to keep a record of 'wrapped' and intercept the unobserve method
    state.store.observe(wrapped);
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
        updateAnnotation,
        updateTarget
      }
    }
  }

}