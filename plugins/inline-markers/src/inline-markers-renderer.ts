
import { groupByPosition } from './utils';
import { createInlineMarker, type InlineMarker } from './inline-marker';
import { 
  computeStyle,
  createRenderer,
  getBackgroundColor,
  Renderer,
  type Highlight,
  type HighlightStyleExpression, 
  type Painter,
  type TextAnnotation, 
  type TextAnnotatorState, 
  type ViewportBounds, 
  type ViewportState
} from '@recogito/text-annotator';

const createInlineMarkersPainter = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>
): Painter => {
  container.classList.add('r6o-annotatable');

  const highlightLayer = document.createElement('div');
  highlightLayer.className = 'r6o-span-highlight-layer';

  container.insertBefore(highlightLayer, container.firstChild);

  let currentMarkers: InlineMarker[] = [];

  const redraw = (
    highlights: Highlight[],
    _: ViewportBounds,
    currentStyle?: HighlightStyleExpression,
    styleOverrides?: Map<string, HighlightStyleExpression>
  ) => {
    highlightLayer.innerHTML = '';

    currentMarkers.forEach(m => m.remove());

    // Group by annotation position, so we only draw one highlight 
    // for perfectly overlapping annotations
    const groups = groupByPosition(highlights);

    currentMarkers = groups.map(group => {
      const highlights = group.subgroups[0].highlights;

      const firstId = highlights[0].annotation.id;
      const { x, y } = highlights[0].rects[0];

      const hasOverlapping = Boolean(state.store.getAt(x, y, true).find(a => a.id !== firstId));
      
      let marker: InlineMarker;
      if (hasOverlapping)
        marker = createInlineMarker(highlights.map(h => h.annotation));

      const h = highlights[0];
      const style = styleOverrides?.get(h.annotation.id) || currentStyle;
      const computedStyle = computeStyle(h, style);

      h.rects.map(rect => {
        const span = document.createElement('span');
        span.className = 'r6o-annotation';
        span.dataset.annotation = highlights.map(h => h.annotation.id).join(' ');

        span.style.left = `${rect.x}px`;
        span.style.top = `${rect.y}px`;
        span.style.width = `${rect.width}px`;
        span.style.height = `${rect.height}px`;

        // Lift hovered SPAN to top
        if (highlights.some(h => h.state.hovered))
          span.style.zIndex = '1';

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
      });

      return marker;
    }).filter(Boolean);
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

export const createInlineMarkersRenderer = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  viewport: ViewportState
): Renderer => {
  const painter = createInlineMarkersPainter(container, state);

  const renderer = createRenderer(painter, container, state, viewport);

  state.store.observe(event => {
    const { created } = event.changes;
    if (created?.length > 0) {
      setTimeout(() => {
        const unsubscribe = state.store.onRecalculatePositions(() => {
          renderer.redraw();
          unsubscribe();
        });

        state.store.recalculatePositions();
      }, 100);
    }
  });

  return renderer;
}
