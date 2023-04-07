import type { TextAnnotation } from '../model';

export type Painter = (annotation: TextAnnotation) => PaintStyle;

export interface PaintStyle {

  fill?: string;

  fillOpacity?: number;

  underline?: string;

  underlineOpacity?: number;

  underlineWidth?: number;

}