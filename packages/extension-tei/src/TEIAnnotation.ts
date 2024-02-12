import type { Annotation, AnnotationTarget } from '@annotorious/core';
import type { TextSelector } from '@recogito/text-annotator';

export interface TEIAnnotation extends Annotation {

  target: TEIAnnotationTarget;

}

export interface TEIAnnotationTarget extends AnnotationTarget {

  selector: TEIRangeSelector[];

}

export interface TEIRangeSelector extends TextSelector {

  startSelector: {

    type: 'XPathSelector';

    value: string;

  }

  endSelector: {

    type: 'XPathSelector';

    value: string;

  }

}
