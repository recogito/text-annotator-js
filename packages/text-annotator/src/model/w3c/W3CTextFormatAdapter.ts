import { v4 as uuidv4 } from 'uuid';
import { ParseResult, parseW3CBodies, serializeW3CBodies } from '@annotorious/core';
import { isCompleteTextSelector, type TextAnnotation, type TextFormatAdapter, type TextSelector } from '../core';
import type { W3CTextAnnotation, W3CTextAnnotationSelector } from './W3CAnnotation';
import { reviveTargetRange } from '../../state';

export type W3CTextFormatAdapter = TextFormatAdapter<TextAnnotation, W3CTextAnnotation>;

export const W3CTextFormat = (source: string): W3CTextFormatAdapter => ({
  parse: (serialized, container) => parseW3CTextAnnotation(serialized, container),
  serialize: (annotation) => serializeW3CTextAnnotation(annotation, source)
});

export const parseW3CTextAnnotation = (annotation: W3CTextAnnotation, container: HTMLElement): ParseResult<TextAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const { body, ...rest } = annotation;

  const bodies = parseW3CBodies(body, annotationId);

  const target = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;

  const w3cSelectors = Array.isArray(target.selector) ? target.selector : [target.selector];

  const selector = w3cSelectors.reduce<Partial<TextSelector>>((s, w3cSelector) => {
    if (w3cSelector.type === 'TextQuoteSelector') {
      s.quote = w3cSelector.exact;
      s.quotePrefix = w3cSelector.prefix;
      s.quoteSuffix = w3cSelector.suffix;
    } else if (w3cSelector.type === 'TextPositionSelector') {
      s.start = w3cSelector.start;
      s.end = w3cSelector.end;
    }
    return s;
  }, {});

  if (selector.start !== undefined && selector.end !== undefined) {
    selector.range = reviveTargetRange(selector.start, selector.end, container);
  }

  return isCompleteTextSelector(selector) ? {
    parsed: {
      id: annotationId,
      bodies,
      target: {
        annotation: annotationId,
        selector
      },
      properties: rest
    }
  } : {
    error: getParsingError(selector)
  };

  function getParsingError(incompleteSelector: Partial<TextSelector>): Error {
    let missingTypes = [];
    if (!incompleteSelector.start) missingTypes.push('TextPositionSelector');
    if (!incompleteSelector.quote) missingTypes.push('TextQuoteSelector');

    let errorMessage = missingTypes.length === 1
      ? `Missing selector type: ${missingTypes[0]}`
      : `Missing selector types: ${missingTypes.join(' and ')}`;
    return Error(errorMessage);
  }
};

export const serializeW3CTextAnnotation = (annotation: TextAnnotation, source: string): W3CTextAnnotation => {
  // TODO Replace with real function
  return {
    id: '1',
    type: 'Annotation',
    body: {
      type: 'TextualBody',
      value: '1',
      format: 'text/plain'
    },
    target: {
      source: source,
      selector: {
        type: 'TextPositionSelector',
        start: 0,
        end: 0
      }
    }
  };
};
