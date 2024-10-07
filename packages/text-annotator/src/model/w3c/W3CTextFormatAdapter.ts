import { v4 as uuidv4 } from 'uuid';
import {
  type FormatAdapter,
  type ParseResult,
  parseW3CBodies,
  parseW3CUser,
  serializeW3CBodies
} from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget, TextSelector } from '../core';
import type { W3CTextAnnotation, W3CTextSelector } from '../w3c';
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
  parse: (serialized) => parseW3CTextAnnotation(serialized),
  serialize: (annotation) => serializeW3CTextAnnotation(annotation, source, container)
});

const isTextSelector = (selector: Partial<TextSelector>): selector is TextSelector =>
  selector.quote !== undefined && selector.start !== undefined && selector.end !== undefined;

const parseW3CTextTargets = (annotation: W3CTextAnnotation) => {
  const {
    id: annotationId,
    creator,
    created,
    modified,
    target
  } = annotation;

  const w3cTargets = Array.isArray(target) ? target : [target];
  if (w3cTargets.length === 0) {
    return { error: Error(`No targets found for annotation: ${annotation.id}`) };
  }

  const parsed: TextAnnotationTarget = {
    creator: parseW3CUser(creator),
    created: created ? new Date(created) : undefined,
    updated: modified ? new Date(modified) : undefined,
    annotation: annotationId,
    selector: [],
    styleClass: w3cTargets[0].styleClass
  };

  for (const w3cTarget of w3cTargets) {
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

    if (isTextSelector(selector)) {
      parsed.selector.push({ id: w3cTarget.id, ...selector });
    } else {
      const missingTypes = [
        !selector.start ? 'TextPositionSelector' : undefined,
        !selector.quote ? 'TextQuoteSelector' : undefined
      ].filter(Boolean);

      return { error: Error(`Missing selector types: ${missingTypes.join(' and ')} for annotation: ${annotation.id}`) };
    }
  }

  return { parsed };
};

export const parseW3CTextAnnotation = (
  annotation: W3CTextAnnotation
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
  const target = parseW3CTextTargets(annotation);

  return 'error' in target
    ? { error: target.error }
    : {
      parsed: {
        ...rest,
        id: annotationId,
        bodies,
        target: target.parsed
      }
    };

};

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

  const w3cTargets = selector.map((s) => {
    const { quote, start, end, range } = s;

    const { prefix, suffix } = getQuoteContext(range, container);

    const w3cSelectors: W3CTextSelector[] = [{
      type: 'TextQuoteSelector',
      exact: quote,
      prefix,
      suffix
    }, {
      type: 'TextPositionSelector',
      start,
      end
    }];

    return {
      ...targetRest,
      id: s.id,
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
  };

};
