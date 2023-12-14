import type { W3CAnnotation, W3CAnnotationTarget } from '@annotorious/core';

export interface W3CTextAnnotation extends W3CAnnotation<W3CTextAnnotationSelector> {

  target: W3CTextAnnotationTarget | W3CTextAnnotationTarget[];

}

export type W3CTextAnnotationTarget = W3CAnnotationTarget<W3CTextAnnotationSelector>;

export interface W3CTextQuoteSelector {

  type: 'TextQuoteSelector';

  exact: string;

  prefix?: string;

  suffix?: string;

}

export interface W3CTextPositionSelector {

  type: 'TextPositionSelector';

  start: number;

  end: number;

}

export type W3CTextAnnotationSelector = W3CTextQuoteSelector | W3CTextPositionSelector;
