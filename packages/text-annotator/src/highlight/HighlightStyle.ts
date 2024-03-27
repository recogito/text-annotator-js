import type { AnnotationState, Color, DrawingStyle } from '@annotorious/core';
import type { TextAnnotation } from 'src/model';

export const DEFAULT_STYLE: DrawingStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.18 
};

export const DEFAULT_SELECTED_STYLE: DrawingStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.45 
};

export interface HighlightStyle extends Pick<DrawingStyle, 'fill' | 'fillOpacity'> {

  underlineStyle?: string;

  underlineColor?: Color;

  underlineOffset?: number;

  underlineThickness?: number;
  
}

export type HighlightStyleExpression = HighlightStyle 
  | ((annotation: TextAnnotation, state: AnnotationState, zIndex: number) => HighlightStyle)


