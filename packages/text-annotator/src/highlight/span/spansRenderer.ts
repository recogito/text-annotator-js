import type { ViewportState } from '@annotorious/core';
import { colord } from 'colord';
import { dequal } from 'dequal/lite';
import type { Rect, TextAnnotatorState } from '../../state';
import { type HighlightPainter, paint } from '../HighlightPainter';
import type { ViewportBounds } from '../viewport';
import { createBaseRenderer, type RendererImplementation } from '../baseRenderer';
import type { Highlight } from '../Highlight';
import { DEFAULT_STYLE, type HighlightStyleExpression } from '../HighlightStyle';
import type { TextAnnotation } from 'src/model';

import './spansRenderer.css';

const computeZIndex = (rect: Rect, all: Highlight[]): number => {
  const intersects = (a: Rect, b: Rect): boolean => (
    a.x <= b.x + b.width && a.x + a.width >= b.x &&
    a.y <= b.y + b.height && a.y + a.height >= b.y
  )

  const getLength = (h: Highlight) => 
    h.rects.reduce((total, rect) => total + rect.width, 0);

  // Any highlights that intersect this rect, sorted by total length
  const intersecting = all.filter(({ rects }) => rects.some(r => intersects(rect, r)));
  intersecting.sort((a, b) => getLength(b) - getLength(a));

  return intersecting.findIndex(h => h.rects.includes(rect));
}

const createRenderer = (container: HTMLElement): RendererImplementation => {

  container.classList.add('r6o-annotatable');

  const highlightLayer = document.createElement('div');
  highlightLayer.className = 'r6o-span-highlight-layer';

  container.insertBefore(highlightLayer, container.firstChild);

  // Currently rendered highlights
  let currentRendered: Highlight[] = [];

  const redraw = (
    highlights: Highlight[],
    viewportBounds: ViewportBounds,
    currentStyle?: HighlightStyleExpression,
    painter?: HighlightPainter,
    lazy?: boolean
  ) => {
    const noChanges = dequal(currentRendered, highlights);

    // If there are no changes and rendering is set to lazy
    // Don't redraw the SPANs - but redraw the painter, if any!
    const shouldRedraw = !(noChanges && lazy);

    if (!painter && !shouldRedraw) return;

    if (shouldRedraw)
      highlightLayer.innerHTML = '';

    /**
     * Highlights rendering in the span highlight layer is an order-sensitive operation.
     * The later the highlight is rendered, the higher it will be in the visual stack.
     *
     * By default, we should expect that the newer highlight
     * will be rendered over the older one
     */
    const sorted = [...highlights].sort((highlightA, highlightB) => {
      const { annotation: { target: { created: createdA } } } = highlightA;
      const { annotation: { target: { created: createdB } } } = highlightB;
      return createdA && createdB ? createdA.getTime() - createdB.getTime() : 0;
    });

    sorted.forEach(highlight => {
      highlight.rects.map(rect => {
        const zIndex = computeZIndex(rect, highlights);
        const style = paint(highlight, viewportBounds, currentStyle, painter, zIndex);

        if (shouldRedraw) {
          const span = document.createElement('span');
          span.className = 'r6o-annotation';
          span.dataset.annotation = highlight.annotation.id;

          span.style.left = `${rect.x}px`;
          span.style.top = `${rect.y}px`;
          span.style.width = `${rect.width}px`;
          span.style.height = `${rect.height}px`;

          span.style.backgroundColor = colord(style?.fill || DEFAULT_STYLE.fill)
            .alpha(style?.fillOpacity === undefined ? DEFAULT_STYLE.fillOpacity : style.fillOpacity)
            .toHex();

          if (style.underlineStyle)
            span.style.borderStyle = style.underlineStyle;

          if (style.underlineColor)
            span.style.borderColor = style.underlineColor;

          if (style.underlineThickness)
            span.style.borderBottomWidth = `${style.underlineThickness}px`;

          if (style.underlineOffset)
            span.style.paddingBottom = `${style.underlineOffset}px`;

          highlightLayer.appendChild(span);
        }
      });
    });

    currentRendered = highlights;
  }

  const setVisible = (visible: boolean) => {
    if (visible)
      highlightLayer.classList.remove('hidden');
    else
      highlightLayer.classList.add('hidden');
  }

  const destroy = () => {
    highlightLayer.remove();
  }

  return {
    destroy,
    redraw,
    setVisible
  };

}

export const createSpansRenderer = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  viewport: ViewportState
) => createBaseRenderer(container, state, viewport, createRenderer(container))
