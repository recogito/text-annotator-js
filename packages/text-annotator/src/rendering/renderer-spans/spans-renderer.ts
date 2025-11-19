import { dequal } from 'dequal/lite';
import type { ViewportState } from '@annotorious/core';
import type { TextAnnotation } from '@/model';
import type { TextAnnotatorState } from '@/state';
import { computeZIndex } from '@/utils/highlight/';
import { 
  computeStyle,
  createRenderer,
  getBackgroundColor,
  type Highlight, 
  type HighlightStyleExpression,
  type Painter, 
  type RendererFactory, 
  type ViewportBounds 
} from '@/rendering';

import './spans-renderer.css';

const createSpansPainter = (container: HTMLElement): Painter => {
  container.classList.add('r6o-annotatable');

  const highlightLayer = document.createElement('div');
  highlightLayer.className = 'r6o-span-highlight-layer';

  container.insertBefore(highlightLayer, container.firstChild);

  // Currently rendered highlights
  let currentRendered: Highlight[] = [];

  const redraw = (
    highlights:Highlight[], 
    viewportBounds: ViewportBounds, 
    currentStyle?: HighlightStyleExpression,
    styleOverrides?: Map<string, HighlightStyleExpression>,
    force?: boolean
  ) => {
    const noChanges = dequal(currentRendered, highlights);

    // If there are no changes and rendering is set to lazy
    // Don't redraw the SPANs - but redraw the painter, if any!
    const shouldRedraw = !noChanges || force;
    if (!shouldRedraw) return;

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
        const style = computeStyle(highlight, currentStyle, zIndex);

        if (shouldRedraw) {
          const span = document.createElement('span');
          span.className = 'r6o-annotation';
          span.dataset.annotation = highlight.annotation.id;

          span.style.left = `${rect.x}px`;
          span.style.top = `${rect.y}px`;
          span.style.width = `${rect.width}px`;
          span.style.height = `${rect.height}px`;

          span.style.backgroundColor = getBackgroundColor(style);

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

export const createSpansRenderer: RendererFactory = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  viewport: ViewportState
) => createRenderer(createSpansPainter(container), container, state, viewport);
