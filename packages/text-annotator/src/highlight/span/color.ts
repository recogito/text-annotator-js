import { colord } from 'colord';
import { DEFAULT_STYLE, type HighlightStyle } from '../HighlightStyle';

export const getBackgroundColor = (style?: HighlightStyle) => {
  if (style?.fillOpacity !== undefined) {
    // User-defined opacity: compute with user-defined fill or default
    return colord(style?.fill || DEFAULT_STYLE.fill)
      .alpha(style.fillOpacity)
      .toHex();
  } else if (!style?.fill) {
    // Neither fill nor opacity - default
    return colord(DEFAULT_STYLE.fill).alpha(DEFAULT_STYLE.fillOpacity).toHex();
  } else {
    // User defined fill, no opacity. Just pass through whatever the user 
    // provided (incl. oklch colors, etc.)
    return style.fill;
  }
}