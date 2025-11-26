import type { W3CAnnotation, W3CAnnotationTarget } from '@annotorious/core';
import type { W3CTextPositionSelector, W3CTextQuoteSelector } from '@recogito/text-annotator';

export interface W3CPDFAnnotation extends W3CAnnotation {

  target: W3CPDFAnnotationTarget;

}

/**
 * See PDF example at: https://www.w3.org/TR/annotation-model/#fragment-selector
 */
export interface W3CPDFAnnotationTarget extends W3CAnnotationTarget {

  selector: (W3CTextQuoteSelector | W3CTextPositionSelector | FragmentSelector)[];

}

export interface FragmentSelector {

  type: 'FragmentSelector';

  conformsTo: 'http://www.w3.org/TR/media-frags/',

  value: string;

}
