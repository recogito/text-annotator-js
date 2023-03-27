import type { Annotation, AnnotationTarget } from '@annotorious/core';

export interface TextAnnotation extends Annotation {

  target: TextAnnotationTarget;

}

export interface TextAnnotationTarget extends AnnotationTarget {

  selector: Array<TextQuoteSelector | TextPositionSelector>

}

export interface TextQuoteSelector {

  type: TextSelectorType.TextQuoteSelector;

  exact: string;

}

export interface TextPositionSelector {

  type: TextSelectorType.TextPositionSelector;

  start: number;

  end: number;

}

export enum TextSelectorType {

  TextQuoteSelector = 'TextQuoteSelector',

  TextPositionSelector = 'TextPositionSelector'

}