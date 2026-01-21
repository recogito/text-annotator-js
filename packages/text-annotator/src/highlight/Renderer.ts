import type { Filter } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { StoreProxy, SelectionProxy, HoverProxy } from '../state';
import type { ViewportBounds } from './viewport';
import type { HighlightPainter } from './HighlightPainter';
import type { Highlight } from './Highlight';
import type { HighlightStyleExpression } from './HighlightStyle';
import {
  createBaseRenderer as createStandaloneBaseRenderer
} from '../standalone';

export type RendererFactory = (
  container: HTMLElement,
  storeProxy: StoreProxy<TextAnnotation>,
  selectionProxy: SelectionProxy,
  hoverProxy: HoverProxy,
  onHoverChange: (annotationId: string | null) => void,
  onViewportChange: (annotationIds: string[]) => void
) => Renderer;

export interface RendererImplementation {

  destroy(): void;

  redraw(

    highlights:Highlight[],

    bounds: ViewportBounds,

    style?: HighlightStyleExpression,

    painter?: HighlightPainter,

    lazy?: boolean

  ): void;

  setVisible(visible: boolean): void;

}

export interface Renderer {

  destroy(): void;

  redraw(force?: boolean): void;

  setStyle(style?: HighlightStyleExpression): void;

  setFilter(filter?: Filter): void;

  setPainter(painter?: HighlightPainter): void;

  setVisible(visible: boolean): void;

}

/**
 * Creates the base renderer by wrapping the standalone version.
 * This maintains backwards compatibility while reusing the standalone implementation.
 */
export const createBaseRenderer = <I extends TextAnnotation = TextAnnotation>(
  container: HTMLElement,
  storeProxy: StoreProxy<I>,
  selectionProxy: SelectionProxy,
  hoverProxy: HoverProxy,
  renderer: RendererImplementation,
  onHoverChange: (annotationId: string | null) => void,
  onViewportChange: (annotationIds: string[]) => void
): Renderer => {
  // Delegate to the standalone implementation
  return createStandaloneBaseRenderer(
    container,
    storeProxy,
    selectionProxy,
    hoverProxy,
    renderer,
    onHoverChange,
    onViewportChange
  );
}
