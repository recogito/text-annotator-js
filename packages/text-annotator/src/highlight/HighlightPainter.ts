import type { Formatter } from '@annotorious/core';
import type { TextAnnotation } from '../model';

const DEFAULT_STYLE = { fill: 'rgba(0, 128, 255, 0.18)' };

const DEFAULT_SELECTED_STYLE = { fill: 'rgba(0, 128, 255, 0.4)' };

/** 
 * A painter implements the actual CANVAS highlight drawing logic.
 */
export type HighlightPainter = { 
  
  paint(  
    annotation: TextAnnotation, 
    rects: DOMRect[],
    context: CanvasRenderingContext2D,
    isSelected?: boolean,
    formatter?: Formatter
  ): void;

}

/**
 * The default painter.
 */
export const defaultPainter: HighlightPainter = {

  paint: (annotation, rects, context, isSelected, formatter) => {
    const style: HighlightStyle = formatter ? 
      formatter(annotation, isSelected) :
      isSelected ? DEFAULT_SELECTED_STYLE : 
      DEFAULT_STYLE;

    context.fillStyle = style.fill;
    context.globalAlpha = style.fillOpacity || 1;
    
    rects.forEach(({ x, y, width, height }) => context.fillRect(x, y - 2.5, width, height + 5));
  }

}

export interface HighlightStyle {

  fill?: string;

  fillOpacity?: number;

  underline?: string;

  underlineOpacity?: number;

  underlineWidth?: number;

}