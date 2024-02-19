import type { AnnotationRects } from '../state';
import type { HighlightDrawingStyle } from './HighlightStyle';
import type { ViewportBounds } from './viewport';

export interface HighlightPainter {

  clear(): void;

  destroy(): void;

  paint(  
    annotation: AnnotationRects,
    viewportBounds: ViewportBounds,
    state?: HighlightState
  ): HighlightDrawingStyle;

  reset(): void;

}

export interface HighlightState {
  selected: boolean;
}
