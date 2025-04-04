import { serializeW3CBodies } from '@annotorious/core';
import type { FormatAdapter, ParseResult } from '@annotorious/core';
import type { W3CTEIAnnotation } from './W3CTEIAnnotation';
import type { TEIAnnotation } from '../TEIAnnotation';

export type W3CTEIFormatAdapter = FormatAdapter<TEIAnnotation, W3CTEIAnnotation>;

/**
 * @param source - the IRI of the annotated content
 * @param container - the HTML container of the annotated content,
 *                    Required to locate the content's `range` within the DOM
 */
export const W3CTextFormat = (
  source: string
): W3CTEIFormatAdapter => ({
  parse: (serialized) => parseW3CTEIAnnotation(serialized),
  serialize: (annotation) => serializeW3CTEIAnnotation(annotation, source)
});

export const parseW3CTEIAnnotation = <E extends W3CTEIAnnotation = W3CTEIAnnotation>(
  annotation: E
): ParseResult<TEIAnnotation> => {

  // TODO
  return undefined;

};

export const serializeW3CTEIAnnotation = <I extends TEIAnnotation = TEIAnnotation, E extends W3CTEIAnnotation = W3CTEIAnnotation>(
  annotation: I,
  source: string
): E => {
  const { bodies, target, ...rest } = annotation;

  const {
    selector,
    creator,
    created,
    updated,
    ...targetRest
  } = target;

  const w3cTargets = selector.map(s => {
    const { id, quote, startSelector, endSelector } = s;

    const w3cSelectors = [{
      type: 'TextQuoteSelector',
      exact: quote
    }, {
      type: 'RangeSelector',
      startSelector,
      endSelector
    }];

    return {
      ...targetRest,
      id,
      source,
      selector: w3cSelectors
    };
  });

  return {
    ...rest,
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: annotation.id,
    type: 'Annotation',
    body: serializeW3CBodies(annotation.bodies),
    creator,
    created: created?.toISOString(),
    modified: updated?.toISOString(),
    target: w3cTargets
  } as unknown as E;

};
