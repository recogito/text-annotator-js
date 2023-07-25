import type { Annotation, AnnotationTarget } from '@annotorious/core';

export interface TEIAnnotation extends Annotation {

  target: TEIAnnotationTarget;

}

export interface TEIAnnotationTarget extends AnnotationTarget {

  selector: TEIRangeSelector;

}

export interface TEIRangeSelector {

  type: 'RangeSelector'

  startSelector: {

    type: 'XPathSelector'

    value: string

  }

  endSelector: {

    type: 'XPathSelector'

    value: string

  }

  quote: string;

  range: Range;

}