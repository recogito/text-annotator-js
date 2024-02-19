import type { DrawingStyle } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export const DEFAULT_STYLE: HighlightDrawingStyle = {
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.18 
};

export const DEFAULT_SELECTED_STYLE: HighlightDrawingStyle = {
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.45 
};

export interface HighlightDrawingStyle extends Pick<DrawingStyle, 'fill' | 'fillOpacity'> {

  underlineStyle?: string;

  underlineColor?: number;

  underlineOffset?: number;

  underlineThickness?: number;
  
}

export type HighlightStyle =
  | HighlightDrawingStyle
  | ((annotation: TextAnnotation, isSelected?: boolean) => HighlightDrawingStyle)
  | undefined;
