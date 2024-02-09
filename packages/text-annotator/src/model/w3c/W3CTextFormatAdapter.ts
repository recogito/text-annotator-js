import { v4 as uuidv4 } from 'uuid';
import {
  type FormatAdapter, hashCode,
  ParseResult,
  parseW3CBodies,
  parseW3CUser,
  serializeW3CBodies
} from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget, TextSelector } from '../core';
import type { W3CTextAnnotation, W3CTextSelector } from '../w3c';
import { reviveTarget } from '../../state';
import { getQuoteContext } from '../../utils';

export type W3CTextFormatAdapter = FormatAdapter<TextAnnotation, W3CTextAnnotation>;

/**
 * @param source - the IRI of the annotated content
 * @param container - the HTML container of the annotated content,
 *                    Required to locate the content's `range` within the DOM
 */
export const W3CTextFormat = (source: string, container: HTMLElement): W3CTextFormatAdapter => ({
  parse: (serialized) => parseW3CTextAnnotation(serialized, container),
  serialize: (annotation) => serializeW3CTextAnnotation(annotation, source, container)
});

const isTextSelector = (selector: Partial<TextSelector>): selector is TextSelector =>
  selector.quote !== undefined && selector.start !== undefined && selector.end !== undefined;

const parseW3CTextTargets = (annotation: W3CTextAnnotation, container: HTMLElement) => {
  const {
    id: annotationId,
    creator,
    created,
    modified,
    target
  } = annotation;

  const w3cTargets = Array.isArray(target) ? target : [target];

  const parsed = [];

  for (const w3cTarget of w3cTargets) {
    const w3cSelectors = Array.isArray(w3cTarget.selector)
      ? w3cTarget.selector : [w3cTarget.selector];

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
      parsed.push(
        reviveTarget({
          ...w3cTarget,
          id: w3cTarget.id || `temp-${hashCode(w3cTarget)}`,
          creator: parseW3CUser(creator),
          created: created ? new Date(created) : undefined,
          updated: modified ? new Date(modified) : undefined,
          annotation: annotationId,
          selector
        }, container)
      );
    } else {
      const missingTypes = [
        !selector.start ? 'TextPositionSelector' : undefined,
        !selector.quote ? 'TextQuoteSelector' : undefined
      ].filter(Boolean);

      return {
        error: Error(`Missing selector types: ${missingTypes.join(' and ')}`)
      };
    }
  }

  return { parsed };
};

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
  const targets = parseW3CTextTargets(annotation, container);

  return 'error' in targets ? { error: targets.error } : {
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      targets: targets.parsed
    }
  };
};

export const serializeW3CTextAnnotation = (
  annotation: TextAnnotation,
  source: string,
  container: HTMLElement
): W3CTextAnnotation => {
  const { bodies, targets, ...rest } = annotation;

  const w3cTargets = targets.map(target => {
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
    }, {
      type: 'TextPositionSelector',
      start,
      end
    }];

    return {
      ...targetRest,
      source,
      selector: w3cSelector
    };
  });

  return {
    ...rest,
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: annotation.id,
    type: 'Annotation',
    body: serializeW3CBodies(annotation.bodies),
    creator: targets[0].creator,
    created: targets[0].created?.toISOString(),
    modified: targets[0].updated?.toISOString(),
    target: w3cTargets
  };

};
