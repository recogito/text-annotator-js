import type { TextAnnotationLike, TextAnnotationTargetLike, TextSelectorLike } from '@recogito/text-annotator';

export interface TEIAnnotation extends TextAnnotationLike {

  target: TEIAnnotationTarget;

}

export interface TEIAnnotationTarget extends TextAnnotationTargetLike {

  selector: TEIRangeSelector[];

}

export interface TEIRangeSelector extends TextSelectorLike {

  position: string;

  startSelector: {

    type: 'XPathSelector';

    value: string;

  }

  endSelector: {

    type: 'XPathSelector';

    value: string;

  }

}