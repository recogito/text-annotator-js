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
    _: ViewportBounds, 
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
      const style = styleOverrides.get(highlight.annotation.id) || currentStyle;

      highlight.rects.map(rect => {
        const zIndex = computeZIndex(rect, highlights);
        const computedStyle = computeStyle(highlight, style, zIndex);

        if (shouldRedraw) {
          const span = document.createElement('span');
          span.className = 'r6o-annotation';
          span.dataset.annotation = highlight.annotation.id;

          span.style.left = `${rect.x}px`;
          span.style.top = `${rect.y}px`;
          span.style.width = `${rect.width}px`;
          span.style.height = `${rect.height}px`;

          span.style.backgroundColor = getBackgroundColor(computedStyle);

          if (computedStyle.underlineStyle)
            span.style.borderStyle = computedStyle.underlineStyle;

          if (computedStyle.underlineColor)
            span.style.borderColor = computedStyle.underlineColor;

          if (computedStyle.underlineThickness)
            span.style.borderBottomWidth = `${computedStyle.underlineThickness}px`;

          if (computedStyle.underlineOffset)
            span.style.paddingBottom = `${computedStyle.underlineOffset}px`;

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
