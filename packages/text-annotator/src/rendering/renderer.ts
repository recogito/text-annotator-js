import type { Filter, ViewportState } from '@annotorious/core';
import type { TextAnnotation } from '@/model';
import type { Highlight, HighlightStyleExpression, ViewportBounds } from '@/rendering';
import type { TextAnnotatorState } from '@/state';

/**
 * The renderer runtime interface.
 */
export interface Renderer {

  destroy(): void;

  redraw(force?: boolean): void;

  setStyle(style?: HighlightStyleExpression, id?: string): void;

  setFilter(filter?: Filter): void;

  setVisible(visible: boolean): void;

}

/**
 * Plugins that provide their own renderer must implement this interface.
 */
export type RendererFactory = (

  container: HTMLElement,

  state: TextAnnotatorState<TextAnnotation, unknown>,

  viewport: ViewportState

) => Renderer;

/**
 * A utility interface. Instead of implementing a Renderer from scratch,
 * implementers can simply implement a painter, and wrap it in the
 * BaseRenderer, which will handle common concerns.
 */
export interface Painter {

  destroy(): void;

  redraw(
    highlights:Highlight[], 
    bounds: ViewportBounds, 
    style?: HighlightStyleExpression,
    styleOverrides?: Map<string, HighlightStyleExpression>,
    force?: boolean
  ): void;

  setVisible(visible: boolean): void;

}