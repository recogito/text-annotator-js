import type { DrawingStyle, Filter, ViewportState } from '@annotorious/core';
import type { TextAnnotatorState } from '../../state';
import type { TextAnnotation } from '../../model';
import { debounce } from '../../utils';
import type { HighlightPainter } from '../canvas/HighlightPainter';
import { getViewport, trackViewport } from '../viewport';
import { createHighlights } from './highlights';

export const createHighlightRenderer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => {
  const { store, selection, hover } = state;

  let currentStyle: DrawingStyle | ((annotation: TextAnnotation, selected?: boolean) => DrawingStyle) | undefined;

  let currentFilter: Filter | undefined;

  const highlights = createHighlights();

  const onDraw = trackViewport(viewport);

  const onPointerMove = (event: PointerEvent) => {
    const {x, y} = container.getBoundingClientRect();

    const hit = store.getAt(event.clientX - x, event.clientY - y);
    const isVisibleHit = hit && (!currentFilter || currentFilter(hit));

    if (isVisibleHit) {
      if (hover.current !== hit.id) {
        container.classList.add('hovered');
        hover.set(hit.id);
      }
    } else {
      if (hover.current) {
        container.classList.remove('hovered');
        hover.set(null);
      }
    }
  }

  container.addEventListener('pointermove', onPointerMove);

  const refresh = () => {
    const { minX, minY, maxX, maxY } = getViewport(container);   
    
    const annotationsInView = currentFilter
      ? store.getIntersectingRects(minX, minY, maxX, maxY).filter(({ annotation }) => currentFilter(annotation))
      : store.getIntersectingRects(minX, minY, maxX, maxY);

    // Get current selection
    const selectedIds = selection.selected.map(({ id }) => id);

    highlights.refresh(annotationsInView.map(r => r.annotation), selectedIds, currentStyle);

    setTimeout(() => onDraw(annotationsInView.map(({ annotation }) => annotation)), 1);
  }

  // Refresh when style changes
  const setDrawingStyle = (style: DrawingStyle | ((a: TextAnnotation, selected?: boolean) => DrawingStyle)) => {
    currentStyle = style;
    refresh();
  }

  // Refresh when filter changes
  const setFilter = (filter?: Filter) => {
    currentFilter = filter;
    refresh();
  } 

  // Refresh on store change
  const onStoreChange = () => refresh();
  store.observe(onStoreChange);

  // Refresh on selection change
  const unsubscribeSelection = selection.subscribe(() => refresh());

  // Refresh on scroll
  const onScroll = () => refresh();
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Refresh on resize
  const onResize = debounce(() => {
    store.recalculatePositions();
    refresh();
  });

  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  // This is an extra precaution. The position of the container
  // might shift (without resizing) due to layout changes higher-up
  // in the DOM. (This happens in Recogito+ for example)
  const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

  const mutationObserver = new MutationObserver(refresh);
  mutationObserver.observe(document.body, config);

  const destroy = () => {
    container.removeEventListener('pointermove', onPointerMove);
  
    highlights.destroy();
  
    store.unobserve(onStoreChange);

    unsubscribeSelection();

    document.removeEventListener('scroll', onScroll);

    window.removeEventListener('resize', onResize);
    resizeObserver.disconnect();

    mutationObserver.disconnect();
  }

  return {
    destroy,
    refresh,
    setDrawingStyle,
    setFilter,
    setPainter: (painter: HighlightPainter) => console.log(painter)
  }
}