import type { ViewportState } from '@annotorious/core';
import { colord } from 'colord';
import { dequal } from 'dequal/lite';
import type { Rect, TextAnnotatorState } from '../../state';
import { type HighlightPainter, paint } from '../HighlightPainter';
import type { ViewportBounds } from '../viewport';
import { createBaseRenderer, type RendererImplementation } from '../baseRenderer';
import type { Highlight } from '../Highlight';
import { DEFAULT_STYLE, type HighlightStyleExpression } from '../HighlightStyle';

import './spansRenderer.css';

const computeZIndex = (rect: Rect, all: Rect[]): number => {
  const intersects = (a: Rect, b: Rect): boolean => (
    a.x <= b.x + b.width && a.x + a.width >= b.x &&
    a.y <= b.y + b.height && a.y + a.height >= b.y
  )

  return all.filter(other => (
    rect !== other &&
    intersects(rect, other) &&
    other.width > rect.width
  )).length;
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

    // Rects from all visible annotations, for z-index computation
    const allRects = highlights.reduce<Rect[]>((all, { rects }) => ([...all, ...rects]), []);

    highlights.forEach(highlight => {
      highlight.rects.map(rect => {
        const zIndex = computeZIndex(rect, allRects);
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
  state: TextAnnotatorState,
  viewport: ViewportState
) => createBaseRenderer(container, state, viewport, createRenderer(container))
