import type { Color, DrawingStyle } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { Rect } from '../state';

const DEFAULT_STYLE = { fill: 'rgb(0, 128, 255)', fillOpacity: 0.18 } as const;

const DEFAULT_SELECTED_STYLE = { fill: 'rgb(0, 128, 255)', fillOpacity: 0.45 } as const;

/** 
 * A painter implements the actual CANVAS highlight drawing logic.
 */
export type HighlightPainter = { 
  
  paint(  
    annotation: TextAnnotation,
    rects: Rect[], 
    bg: CanvasRenderingContext2D,
    fg: CanvasRenderingContext2D,
    isSelected?: boolean,
    style?: HighlightPainterStyle
  ): void;

}

export type HighlightPainterStyle = HighlightStyle | ((annotation: TextAnnotation, selected?: boolean) => HighlightStyle);

/**
 * The default painter.
 */
export const defaultPainter: HighlightPainter = {

  paint: (annotation, rects, bg, fg, isSelected, drawingStyle) => {
    const style: HighlightStyle = drawingStyle ? 
      typeof drawingStyle === 'function' ? drawingStyle(annotation, isSelected) : drawingStyle :
      isSelected ? DEFAULT_SELECTED_STYLE : 
      DEFAULT_STYLE;

    bg.fillStyle = style.fill;
    bg.globalAlpha = style.fillOpacity || 1;
    
    rects.forEach(({ x, y, width, height }) => bg.fillRect(x, y - 2.5, width, height + 5));
  }

}

export interface HighlightStyle extends Pick<DrawingStyle, 'fill' | 'fillOpacity'>{

  underline?: Color;

  underlineOpacity?: number;

  underlineWidth?: number;

}
