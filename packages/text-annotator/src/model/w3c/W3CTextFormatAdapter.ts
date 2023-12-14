import { v4 as uuidv4 } from 'uuid';
import {
  ParseResult,
  parseW3CBodies,
  parseW3CLifecycleInfo,
  parseW3CTarget,
  serializeW3CBodies,
  serializeW3CLifecycleInfo,
  serializeW3CTarget
} from '@annotorious/core';
import {
  isCompleteTextSelector,
  type TextAnnotation,
  type TextAnnotationTarget,
  type TextFormatAdapter,
  type TextSelector
} from '../core';
import type { W3CTextAnnotation, W3CTextAnnotationSelector, W3CTextAnnotationTarget } from './W3CAnnotation';
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

  const w3cTarget = Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;
  const w3cSelectors = Array.isArray(w3cTarget.selector) ? w3cTarget.selector : [w3cTarget.selector];

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

  if (!isCompleteTextSelector(selector)) {
    return { error: getParsingError(selector) };
  }

  const target = parseW3CTarget<TextAnnotationTarget, W3CTextAnnotationTarget>(
    w3cTarget,
    annotationId,
    parseW3CLifecycleInfo(annotation),
    selector
  );

  return {
    parsed: {
      ...rest,
      id: annotationId,
      bodies,
      target
    }
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
  const { bodies, target, ...serializableRest } = annotation;
  const { quote, quotePrefix, quoteSuffix, start, end } = target.selector;

  const selector: W3CTextAnnotationSelector[] = [
    {
      type: 'TextQuoteSelector',
      exact: quote,
      prefix: quotePrefix,
      suffix: quoteSuffix
    },
    {
      type: 'TextPositionSelector',
      start,
      end
    }
  ];

  const w3cTarget = serializeW3CTarget<TextAnnotationTarget, W3CTextAnnotationTarget>(target, source, selector);

  return {
    ...serializableRest,
    ...serializeW3CLifecycleInfo(target),
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'Annotation',
    body: serializeW3CBodies(bodies),
    target: w3cTarget
  };
};
