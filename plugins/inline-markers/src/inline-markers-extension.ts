
import { groupByPosition } from './utils';
import { createInlineMarker, type InlineMarker } from './inline-marker';
import { 
  computeStyle,
  createRenderer,
  getBackgroundColor,
  Renderer,
  TextAnnotationLike,
  type Highlight,
  type HighlightStyleExpression, 
  type TextAnnotatorState, 
  type ViewportBounds, 
  type ViewportState
} from '@recogito/text-annotator';

const createInlineMarkersPainter = (
  container: HTMLElement,
  _state: TextAnnotatorState<TextAnnotationLike, unknown>,
  opts: InlineMarkersExtensionOptions
) => {
  container.classList.add('r6o-annotatable');

  const highlightLayer = document.createElement('div');
  highlightLayer.className = 'r6o-span-highlight-layer';

  container.insertBefore(highlightLayer, container.firstChild);

  let showMarkers = opts.showMarkers;
  let currentMarkers: InlineMarker[] = [];

  const redraw = (
    highlights: Highlight[],
    _: ViewportBounds,
    currentStyle?: HighlightStyleExpression,
    styleOverrides?: Map<string, HighlightStyleExpression>
  ) => {
    // console.debug('[inline-markers] redraw viewport - show markers?', showMarkers);

    highlightLayer.innerHTML = '';

    currentMarkers.forEach(m => m.remove());

    // Group by annotation position, so we only draw one highlight 
    // for perfectly overlapping annotations
    const groups = groupByPosition(highlights);

    // console.debug({ groups });

    currentMarkers = groups.map(group => {
      let marker: InlineMarker | undefined;
      
      if (showMarkers) {
        // Create a marker to indicate the start of the group
        // if multiple annotations start here
        const highlightsInGroup = group.subgroups.flatMap(sg => sg.highlights);

        // console.debug('[inline-markers] marker for group size?', highlightsInGroup.length);
      
        if (highlightsInGroup.length > 1) {
          // console.log('[inline-markers] group', highlightsInGroup);
          marker = createInlineMarker(highlightsInGroup.map(h => h.annotation));
        } /* else {
          console.log('[inline-markers] no markers - annotations', _state.store.all());
        } */
      }

      // Render highlights for each sub-group (as a side effect)
      group.subgroups.map(subgroup => {
        const h = subgroup.highlights[0];

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
      });

      return marker;
    }).filter(Boolean) as InlineMarker[];
  }

  const setShowMarkers = (show: boolean) => {
    showMarkers = show;
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
    setShowMarkers,
    setVisible
  };

}

interface InlineMarkersExtensionOptions {

  showMarkers: boolean;

}

export const InlineMarkersExtension = (options: InlineMarkersExtensionOptions = { showMarkers: true }) => {
  let painterRef: ReturnType<typeof createInlineMarkersPainter> | undefined;
  let rendererRef: Renderer | undefined;

  const factory = (
    container: HTMLElement,
    state: TextAnnotatorState<TextAnnotationLike, unknown>,
    viewport: ViewportState
  ) => {
    const painter = createInlineMarkersPainter(container, state, options);
    painterRef = painter;

    const renderer = createRenderer(painter, container, state, viewport);
    rendererRef = renderer;

    state.store.observe(event => {
      const { created } = event.changes;
      if (created && created.length > 0) {
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

  const setShowMarkers = (show: boolean) => {
    painterRef?.setShowMarkers(show);
    rendererRef?.redraw();
  }

  const destroy = () => {
    rendererRef?.destroy();
    painterRef = undefined;
    rendererRef = undefined;
  }

  return { 
    destroy,
    setShowMarkers,
    Renderer: factory
  }

}