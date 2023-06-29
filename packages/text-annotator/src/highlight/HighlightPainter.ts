import type { TextAnnotation } from '../model';

export type HighlightPainter = (
  
  annotation: TextAnnotation, 
  
  rects: DOMRect[],
  
  context: CanvasRenderingContext2D,

  offset: DOMRect,

  isSelected?: boolean
  
) => HighlightStyle | void;


export interface HighlightStyle {

  fill?: string;

  fillOpacity?: number;

  underline?: string;

  underlineOpacity?: number;

  underlineWidth?: number;

}