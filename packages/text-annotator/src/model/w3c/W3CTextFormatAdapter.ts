import { v4 as uuidv4 } from 'uuid';
import {
  type FormatAdapter,
  ParseResult,
  parseW3CBodies,
  parseW3CUser
} from '@annotorious/core';
import type { TextAnnotation, TextSelector } from '../core';
import type { W3CTextAnnotation } from '../w3c';
import { reviveTargetRange } from '../../state';

export type W3CTextFormatAdapter = FormatAdapter<TextAnnotation, W3CTextAnnotation>;

/**
 * @param source - the IRI of the annotated content
 * @param container - the HTML container of the annotated content,
 *                    Required to locate the content's `range` within the DOM
 */
export const W3CTextFormat = (source: string, container: HTMLElement): W3CTextFormatAdapter => ({
  parse: (serialized) => parseW3CTextAnnotation(serialized, container),
  serialize: (annotation) => serializeW3CTextAnnotation(annotation, source)
});

export const parseW3CTextAnnotation = (annotation: W3CTextAnnotation, container: HTMLElement): ParseResult<TextAnnotation> => {
  const annotationId = annotation.id || uuidv4();

  const {
    creator,
    created,
    updatedBy,
    updated,
    body,
    ...rest
  } = annotation;

  const bodies = parseW3CBodies(body, annotationId);

  const w3cTarget = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;
  const w3cSelectors = Array.isArray(w3cTarget.selector) ? w3cTarget.selector : [w3cTarget.selector];

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

  if (selector.start !== undefined && selector.end !== undefined) {
    selector.range = reviveTargetRange(selector.start, selector.end, container);
  }

  return isCompleteTextSelector(selector) ? {
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      target: {
        created: created ? new Date(created) : undefined,
        creator: parseW3CUser(creator),
        ...rest.target,
        annotation: annotationId,
        selector
      }
    }
  } : { error: getParsingError(selector) };

  function isCompleteTextSelector(selector: Partial<TextSelector>): selector is TextSelector {
    return selector.quote !== undefined && selector.range !== undefined;
  }

  function getParsingError(incompleteSelector: Partial<TextSelector>): Error {
    let missingTypes = [
      !incompleteSelector.start ? 'TextPositionSelector' : undefined,
      !incompleteSelector.quote ? 'TextQuoteSelector' : undefined
    ].filter(Boolean);
    return Error(`Missing selector types: ${missingTypes.join(' and ')}`);
  }
};


export const serializeW3CTextAnnotation = (annotation: TextAnnotation, source: string): W3CTextAnnotation => {
  return {} as any;
};
