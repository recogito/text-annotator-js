import type { AnnotationRects } from '../state';
import type { HighlightStyle } from './HighlightStyle';
import type { ViewportBounds } from './viewport';

export interface HighlightPainter {

  clear(): void;

  destroy(): void;

  paint(  
    annotation: AnnotationRects,
    viewportBounds: ViewportBounds,
    isSelected?: boolean
  ): HighlightStyle;

  reset(): void;

}