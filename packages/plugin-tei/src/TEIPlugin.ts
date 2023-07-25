import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';
import type { LifecycleEvents } from '@annotorious/core';
import { rangeToXPathRangeSelector } from './crosswalk';
import type { TEIAnnotation } from './TEIAnnotation';

type TextEvents = LifecycleEvents<TextAnnotation>;

export const TEIPlugin = (a: TextAnnotator) => {

  const container: HTMLElement = a.element;

  // Forward crosswalk - text offset to XPath selector
  const fwd = (a: TextAnnotation): TEIAnnotation => {
    const selector = rangeToXPathRangeSelector(container, a.target.selector);

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
  const rvs = (a: TextAnnotation): TEIAnnotation => {
    return null;
  }

  const on = <E extends keyof TextEvents>(event: E, callback: TextEvents[E]) => {
    if (event === 'createAnnotation' || event === 'deleteAnnotation') {
      // @ts-ignore
      a.on(event, (a: TextAnnotation) => callback(fwd(a)));
    } else if (event === 'selectionChanged') {
      // @ts-ignore
      a.on(event, (a: TextAnnotation[]) => callback(a.map(fwd)));
    } else if (event === 'updateAnnotation') {
      // @ts-ignore
      a.on(event, (a: TextAnnotation, b: TextAnnotation) => callback(fwd(a), fwd(b)));
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
    console.log('setting', annotations);
  }

  return {
    loadAnnotations,
    on,
    setAnnotations
  }

}