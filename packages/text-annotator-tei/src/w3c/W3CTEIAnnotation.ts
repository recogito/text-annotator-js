import type { W3CAnnotation, W3CAnnotationTarget } from '@annotorious/core';
import type { W3CTextQuoteSelector } from '@recogito/text-annotator';
import type { TEIRangeSelector } from 'src/TEIAnnotation';

export interface W3CTEIAnnotation extends W3CAnnotation {

  target: W3CTEIAnnotationTarget;

}

export interface W3CTEIAnnotationTarget extends W3CAnnotationTarget {

  selector: (W3CTEIRangeSelector | W3CTextQuoteSelector)[];

}

export interface W3CTEIRangeSelector {

  type: 'RangeSelector',

  startSelector: {
    
    type: 'XPathSelector',
    
    value: string
  
  }

  endSelector: {
    
    type: 'XPathSelector',
    
    value: string
  
  }

}
