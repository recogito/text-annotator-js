import type { Annotation, AnnotationTarget } from '@annotorious/core';

export interface TextAnnotation extends Annotation {

  target: TextAnnotationTarget;

}

export interface TextAnnotationTarget extends AnnotationTarget {

  selector: TextSelector;

}

/**
 * Matches the `Text Quote Selector` spec
 * @see https://www.w3.org/TR/annotation-model/#text-quote-selector
 */
export interface TextQuoteSelector {

  quote: string;

  quotePrefix?: string;

  quoteSuffix?: string;

}

/**
 * Matches the `Text Position Selector` spec
 * @see https://www.w3.org/TR/annotation-model/#text-position-selector
 */
export interface TextPositionSelector {

  start: number;

  end: number;

  range: Range;

  offsetReference?: HTMLElement;

}

export type TextSelector = TextQuoteSelector & TextPositionSelector;

export const isCompleteTextSelector = (partialTextSelector: Partial<TextSelector>): partialTextSelector is TextSelector =>
  partialTextSelector.range !== undefined && partialTextSelector.quote !== undefined;
