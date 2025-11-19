import type { AnnotationState, Color, DrawingStyle } from '@annotorious/core';
import type { TextAnnotation } from '@/model';
import type { Highlight } from '@/rendering';

export interface HighlightStyle extends Pick<DrawingStyle, 'fill' | 'fillOpacity'> {

  underlineStyle?: string;

  underlineColor?: Color;

  underlineOffset?: number;

  underlineThickness?: number;
  
}

export type HighlightStyleExpression = HighlightStyle 
  | (<I extends TextAnnotation = TextAnnotation>(annotation: I, state: AnnotationState, zIndex?: number) => HighlightStyle | undefined);

export const DEFAULT_STYLE: HighlightStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.18
};

export const DEFAULT_SELECTED_STYLE: HighlightStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.45 
};

export const computeStyle = (highlight: Highlight, style?: HighlightStyleExpression, z?: number): HighlightStyle =>
  style 
    ? typeof style === 'function'
      ? style(highlight.annotation, highlight.state, z) || (
        highlight.state?.selected ? DEFAULT_SELECTED_STYLE : DEFAULT_STYLE
      )
      : style 
    : highlight.state?.selected 
      ? DEFAULT_SELECTED_STYLE 
      : DEFAULT_STYLE;
