import type { ViewportState } from '@annotorious/core';
import type { Rect, TextAnnotatorState } from '../../state';
import type { HighlightPainter } from '../HighlightPainter';
import type { ViewportBounds } from '../viewport';
import { createBaseRenderer, type RendererImplementation } from '../baseRenderer';
import type { Highlight } from '../Highlight';
import type { HighlightStyleExpression } from '../HighlightStyle';

import './spansRenderer.css';

const computeZIndex = (rect: Rect, all: Rect[]): number => {
  const intersects = (a: Rect, b: Rect): boolean => (
    a.x <= b.x + b.width && a.x + a.width >= b.x &&
    a.y <= b.y + b.height && a.y + a.height >= b.y
  );

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

  let customPainter: HighlightPainter;

  // Currently rendered SPANs for each annotation ID
  let currentRendered = new Map<string, HTMLSpanElement[]>();

  const redraw = (
    highlights: Highlight[], 
    viewportBounds: ViewportBounds,
    style?: HighlightStyleExpression,
    painter?: HighlightPainter
  ) => {
    if (customPainter)
      customPainter.clear();

    // Currently rendered IDs
    const currentRenderedIds = Array.from(currentRendered.keys())

    // Next rendered IDs
    const nextRendered = highlights.map(h => h.annotation.id);

    // Remove annotations that are no longer visible
    const toRemove = currentRenderedIds.filter(id => !nextRendered.includes(id));
    toRemove.forEach(id => { 
      (currentRendered.get(id) || []).forEach(span => span.remove());
      currentRendered.delete(id);
    });

    // Rects from all visible annotations, for z-index computation
    const allRects = highlights.reduce<Rect[]>((all, { rects }) => ([...all, ...rects]), []);

    // Add annotations that are visible but not yet rendered
    const rendered = highlights
      .filter(({ annotation }) => !currentRenderedIds.includes(annotation.id))
      .map(({ rects, annotation }) => {
        const spans = rects.map(rect => {
          const span = document.createElement('span');
          span.className = 'r6o-annotation';
          span.dataset.annotation = annotation.id;
  
          span.style.left = `${rect.x}px`;
          span.style.top = `${rect.y}px`;
          span.style.width = `${rect.width}px`;
          span.style.height = `${rect.height}px`;
  
          const zIndex = computeZIndex(rect, allRects);
  
          span.style.paddingBottom = `${zIndex * 3.5}px`;
  
          // TODO style by annotation!

          highlightLayer.appendChild(span);

          return span;
        });

        return { id: annotation.id, spans };
      });

    rendered.forEach(({ id, spans }) => currentRendered.set(id, spans));
  }

  const destroy = () => {
    highlightLayer.remove();
  }

  return {
    destroy,
    redraw
  }

}

export const createSpansRenderer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => createBaseRenderer(container, state, viewport, createRenderer(container));