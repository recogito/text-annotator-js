import type { Annotation, AnnotationTarget } from '@annotorious/core';

export interface TextAnnotation extends Annotation {

  target: TextAnnotationTarget;

}

export interface TextAnnotationTarget extends AnnotationTarget {

  selector: TextSelector;

}

export interface TextSelector {

  quote: TextSelectorQuote
  
  start: number;

  end: number;

  range: Range;

  offsetReference?: HTMLElement

}

/**
 * Matches the `Text Quote Selector` spec from the W3C Annotation Data Model
 * @see https://www.w3.org/TR/annotation-model/#text-quote-selector
 */
export interface TextSelectorQuote {

  exact: string;

  prefix: string;

  suffix: string;

}
