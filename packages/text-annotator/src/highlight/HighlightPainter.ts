import type { AnnotationRects } from '../state';
import type { HighlightDrawingStyle } from './HighlightStyle';
import type { ViewportBounds } from './viewport';

export interface HighlightPainter {

  clear(): void;

  destroy(): void;

  paint(  
    annotation: AnnotationRects,
    viewportBounds: ViewportBounds,
    isSelected?: boolean
  ): HighlightDrawingStyle;

  reset(): void;

}
