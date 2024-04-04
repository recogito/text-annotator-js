
import type { Highlight } from './Highlight';
import { DEFAULT_SELECTED_STYLE, DEFAULT_STYLE } from './HighlightStyle';
import type { HighlightStyle, HighlightStyleExpression } from './HighlightStyle';
import type { ViewportBounds } from './viewport';

export interface HighlightPainter {

  clear(): void;

  destroy(): void;

  paint(highlight: Highlight, viewportBounds: ViewportBounds): HighlightStyle;

  reset(): void;

}

/** Helper **/
export const paint = (
  highlight: Highlight,
  viewportBounds: ViewportBounds,
  style?: HighlightStyleExpression, 
  painter?: HighlightPainter,
  zIndex?: number
) => {
  const base: HighlightStyle = style 
    ? typeof style === 'function' 
      ? style(highlight.annotation, highlight.state, zIndex) 
      : style 
    : highlight.state?.selected 
      ? DEFAULT_SELECTED_STYLE 
      : DEFAULT_STYLE;

  // Trigger the custom painter (if any) as a side-effect
  return painter ? painter.paint(highlight, viewportBounds) || base : base;
}