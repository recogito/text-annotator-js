import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';
import type { LifecycleEvents } from '@annotorious/core';
import { rangeToXPathRangeSelector } from './crosswalk';

type TextEvents = LifecycleEvents<TextAnnotation>;

export const TEIPlugin = (a: TextAnnotator) => {

  const container: HTMLElement = a.element;

  const teiify = (a: TextAnnotation) => {
    const selector = rangeToXPathRangeSelector(container, a.target.selector.range);

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

  const _on = a.on;

  a.on = <E extends keyof TextEvents>(event: E, callback: TextEvents[E]) => {
    if (event === 'createAnnotation' || event === 'deleteAnnotation') {
      // @ts-ignore
      _on(event, (a: TextAnnotation) => callback(teiify(a)));
    } else if (event === 'selectionChanged') {
      // @ts-ignore
      _on(event, (a: TextAnnotation[]) => callback(a.map(teiify)));
    } else if (event === 'updateAnnotation') {
      // @ts-ignore
      _on(event, (a: TextAnnotation, b: TextAnnotation) => callback(teiify(a), teiify(b)));
    }
  }

}