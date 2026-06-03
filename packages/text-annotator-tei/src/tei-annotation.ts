import type { 
  RevivedTextSelectorLike, 
  TextAnnotationLike, 
  TextAnnotationTargetLike, 
  TextSelectorLike 
} from '@recogito/text-annotator';

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

export interface RevivedTEIAnnotationTarget extends TEIAnnotationTarget {

  selector: RevivedTEIRangeSelector[];

}

export interface RevivedTEIAnnotation extends TEIAnnotation {

  target: RevivedTEIAnnotationTarget;

}

export type RevivedTEIRangeSelector = TEIRangeSelector & RevivedTextSelectorLike;