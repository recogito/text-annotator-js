import type { TextAnnotation } from '../model';

export type Painter = (
  
  annotation: TextAnnotation, 
  
  rects: DOMRect[],
  
  context: CanvasRenderingContext2D,

  offset: DOMRect
  
) => PaintStyle | void;

export interface PaintStyle {

  fill?: string;

  fillOpacity?: number;

  underline?: string;

  underlineOpacity?: number;

  underlineWidth?: number;

}