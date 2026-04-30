import type { W3CAnnotation, W3CAnnotationTarget } from '@annotorious/core';

export interface W3CTextAnnotation extends W3CAnnotation {

  target: W3CTextAnnotationTarget | W3CTextAnnotationTarget[];

  stylesheet?: W3CAnnotationStylesheet;

}

export interface W3CTextAnnotationTarget extends W3CAnnotationTarget {

  selector: W3CTextSelector | W3CTextSelector[];

  styleClass?: string;

  scope?: string;

}

/**
 * Matches the `Text Quote Selector` spec
 * @see https://www.w3.org/TR/annotation-model/#text-quote-selector
 */
export interface W3CTextQuoteSelector {

  type: 'TextQuoteSelector';

  exact: string;

  prefix?: string;

  suffix?: string;

}

/**
 * Matches the `Text Position Selector` spec
 * @see https://www.w3.org/TR/annotation-model/#text-position-selector
 */
export interface W3CTextPositionSelector {

  type: 'TextPositionSelector';

  start: number;

  end: number;

}

export type W3CTextSelector = W3CTextQuoteSelector | W3CTextPositionSelector;

export type W3CAnnotationStylesheet = string | {
  type: 'CssStylesheet',
  value: string
}
