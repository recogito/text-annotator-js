import type { Annotation, AnnotationTarget } from '@annotorious/core';

export interface TextAnnotation extends Annotation {

  targets: TextAnnotationTarget[];

}

export interface TextAnnotationTarget extends AnnotationTarget {

  selector: TextSelector;

}

export interface TextSelector {

  quote: string;
  
  start: number;

  end: number;

  range: Range;

  offsetReference?: HTMLElement

}
