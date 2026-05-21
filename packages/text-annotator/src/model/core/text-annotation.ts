import type { Annotation, AnnotationTarget } from '@annotorious/core';

export interface TextAnnotation extends Annotation {

  target: TextAnnotationTarget;

}

export interface TextAnnotationTarget extends AnnotationTarget {

  selector: TextSelector[];

}

export interface TextSelector {

  id?: string;

  quote: string;
  
  start: number;

  end: number;

  range: Range;

  offsetReference?: HTMLElement;

}

export interface TextAnnotationLike extends Annotation {

  target: TextAnnotationTargetLike;

}

export interface TextAnnotationTargetLike extends AnnotationTarget {

  selector: TextSelectorLike[];

}

export interface TextSelectorLike {

  id?: string;

  quote: string;

  range: Range;

  offsetReference?: HTMLElement;

}
