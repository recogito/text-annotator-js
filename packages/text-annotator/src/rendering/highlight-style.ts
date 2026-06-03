import { colord, type AnyColor } from 'colord';
import type { AnnotationState } from '@annotorious/core';
import type { TextAnnotationLike } from '../model';
import type { Highlight } from './';

export type CSSColor = string;

export interface HighlightStyle {

  fill?: CSSColor;

  fillOpacity?: number;

  underlineStyle?: string;

  underlineColor?: CSSColor;

  underlineOffset?: number;

  underlineThickness?: number;

}

export type HighlightStyleExpression<I extends TextAnnotationLike = TextAnnotationLike> = HighlightStyle
  | ((annotation: I, state: AnnotationState, zIndex?: number) => HighlightStyle | undefined);

export const DEFAULT_STYLE: HighlightStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.18
};

export const DEFAULT_SELECTED_STYLE: HighlightStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.45 
};

export const getBackgroundColor = (style?: HighlightStyle) => {
  if (style?.fillOpacity !== undefined) {
    // User-defined opacity: compute with user-defined fill or default
    return colord(style?.fill || DEFAULT_STYLE.fill as AnyColor)
      .alpha(style.fillOpacity)
      .toHex();
  } else if (!style?.fill) {
    // Neither fill nor opacity - default
    return colord(DEFAULT_STYLE.fill as AnyColor).alpha(DEFAULT_STYLE.fillOpacity as number).toHex();
  } else {
    // User defined fill, no opacity. Just pass through whatever the user 
    // provided (incl. oklch colors, etc.)
    return style.fill;
  }
}

export const computeStyle = (highlight: Highlight, style?: HighlightStyleExpression, z?: number): HighlightStyle =>
  style 
    ? typeof style === 'function'
      ? style(highlight.annotation, highlight.state, z) || (
        highlight.state?.selected ? DEFAULT_SELECTED_STYLE : DEFAULT_STYLE
      )
      : style 
    : highlight.state?.selected 
      ? DEFAULT_SELECTED_STYLE 
      : DEFAULT_STYLE;
