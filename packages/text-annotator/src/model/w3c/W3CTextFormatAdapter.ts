import { v4 as uuidv4 } from 'uuid';
import {
  type FormatAdapter,
  ParseResult,
  parseW3CBodies,
  parseW3CUser,
  serializeW3CBodies
} from '@annotorious/core';
import type { TextAnnotation, TextSelector } from '../core';
import type { W3CTextAnnotation, W3CTextSelector } from '../w3c';
import { reviveTarget } from '../../state';
import { getQuoteContext } from '../../utils';

export type W3CTextFormatAdapter = FormatAdapter<TextAnnotation, W3CTextAnnotation>;

/**
 * @param source - the IRI of the annotated content
 * @param container - the HTML container of the annotated content,
 *                    Required to locate the content's `range` within the DOM
 */
export const W3CTextFormat = (
  source: string, 
  container: HTMLElement
): W3CTextFormatAdapter => ({
  parse: (serialized) => parseW3CTextAnnotation(serialized, container),
  serialize: (annotation) => serializeW3CTextAnnotation(annotation, source, container)
});

export const parseW3CTextAnnotation = (
  annotation: W3CTextAnnotation, 
  container: HTMLElement
): ParseResult<TextAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const {
    creator,
    created,
    modified,
    body,
    ...rest
  } = annotation;

  const bodies = parseW3CBodies(body, annotationId);

  const w3cTarget = Array.isArray(annotation.target) 
    ? annotation.target[0] : annotation.target;

  const w3cSelectors = Array.isArray(w3cTarget.selector) 
    ? w3cTarget.selector : [ w3cTarget.selector ];

  const selector = w3cSelectors.reduce<Partial<TextSelector>>((s, w3cSelector) => {
    switch (w3cSelector.type) {
      case 'TextQuoteSelector':
        s.quote = w3cSelector.exact;
        break;
      case 'TextPositionSelector':
        s.start = w3cSelector.start;
        s.end = w3cSelector.end;
        break;
    }
    return s;
  }, {});

  const isTextSelector= (selector: Partial<TextSelector>): selector is TextSelector =>
    selector.quote !== undefined && selector.start !== undefined && selector.end !== undefined;

  if (isTextSelector(selector)) {
    return {
      parsed: {
        ...rest,
        id: annotationId,
        bodies,
        target: reviveTarget({
          ...rest.target,
          created: created ? new Date(created) : undefined,
          creator: parseW3CUser(creator),
          updated: modified ? new Date(modified) : undefined,
          annotation: annotationId,
          selector
        }, container)
      }
    }
  } else {
    const missingTypes = [
      !selector.start ? 'TextPositionSelector' : undefined,
      !selector.quote ? 'TextQuoteSelector' : undefined
    ].filter(Boolean);

    return {
      error: Error(`Missing selector types: ${missingTypes.join(' and ')}`)
    }
  }
}

export const serializeW3CTextAnnotation = (
  annotation: TextAnnotation, 
  source: string, 
  container: HTMLElement
): W3CTextAnnotation => {
  const { bodies, target, ...rest } = annotation;

  const {
    selector,
    creator,
    created,
    updated,
    ...targetRest
  } = target;

  const { quote, start, end, range } = selector;

  const { prefix, suffix } = getQuoteContext(range, container);

  const w3cSelector: W3CTextSelector[] = [{
    type: 'TextQuoteSelector',
    exact: quote,
    prefix,
    suffix
  },{
    type: 'TextPositionSelector',
    start,
    end
  }];

  return {
    ...rest,
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: annotation.id,
    type: 'Annotation',
    body: serializeW3CBodies(annotation.bodies),
    creator,
    created: created?.toISOString(),
    modified: updated?.toISOString(),
    target: {
      ...targetRest,
      source,
      selector: w3cSelector
    }
  }

}
