import type { DrawingStyle, Filter, StoreChangeEvent, ViewportState } from '@annotorious/core';
import type { TextAnnotatorState } from '../state';
import type { TextAnnotation } from 'src/model';
import type { HighlightPainter } from './HighlightPainter';
import { createStylesheet } from './nativeHighlightStylesheet';

export const createHighlightLayer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => {
  const { store, selection, hover } = state;

  let currentStyle: DrawingStyle | ((annotation: TextAnnotation, selected?: boolean) => DrawingStyle) | undefined;

  let currentFilter: Filter | undefined;

  const stylesheet = createStylesheet();

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

  const getViewport = () => {
    const { top, left } = container.getBoundingClientRect();

    const { innerWidth, innerHeight } = window;

    const minX = - left;
    const minY = - top;
    const maxX = innerWidth - left;
    const maxY = innerHeight - top;

    return { top, left, minX, minY, maxX, maxY };
  }

  const redraw = () => {
    const { top, left, minX, minY, maxX, maxY } = getViewport();   
    
    const annotationsInView = currentFilter
      ? store.getIntersectingRects(minX, minY, maxX, maxY).filter(({ annotation }) => currentFilter(annotation))
      : store.getIntersectingRects(minX, minY, maxX, maxY);

    // Get current selection
    const selectedIds = selection.selected.map(({ id }) => id);

    stylesheet.refresh(annotationsInView.map(r => r.annotation), selectedIds, currentStyle);

    // setTimeout(() => onDraw(annotationsInView.map(({ annotation }) => annotation)), 1);
  }

  const setDrawingStyle = (style: DrawingStyle | ((a: TextAnnotation, selected?: boolean) => DrawingStyle)) => {
    currentStyle = style;
    redraw();
  }

  const setFilter = (filter?: Filter) => {
    currentFilter = filter;
    redraw();
  } 

  // Redraw on store change
  const onStoreChange = () => redraw();
  store.observe(onStoreChange);

  // Redraw on selection change
  const unsubscribeSelection = selection.subscribe(() => redraw());

  store.observe(onStoreChange);

  // Redraw on scroll
  const onScroll = () => redraw();
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  const destroy = () => {
    // TODO
  }

  return {
    destroy,
    redraw,
    setDrawingStyle,
    setFilter,
    setPainter: (painter: HighlightPainter) => console.log(painter)
  }
}