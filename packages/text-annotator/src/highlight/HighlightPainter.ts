
import type { Highlight } from './Highlight';
import type { HighlightStyle } from './HighlightStyle';
import type { ViewportBounds } from './viewport';

export interface HighlightPainter {

  clear(): void;

  destroy(): void;

  paint(highlight: Highlight, viewportBounds: ViewportBounds): HighlightStyle;

  reset(): void;

}