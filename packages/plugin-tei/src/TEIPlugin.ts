import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';
import { Origin, type LifecycleEvents } from '@annotorious/core';
import { rangeToTEIRangeSelector, teiRangeSelectorToRange } from './crosswalk';
import type { TEIAnnotation } from './TEIAnnotation';

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

  const loadAnnotations = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then(annotations => {
        setAnnotations(annotations);
        return annotations;
      });

  const setAnnotations = (annotations: TEIAnnotation[]) => {
    const crosswalked = annotations.map(rvs);
    anno.state.store.bulkAddAnnotation(crosswalked, true, Origin.REMOTE);
  }

  return {
    loadAnnotations,
    on,
    setAnnotations
  }

}