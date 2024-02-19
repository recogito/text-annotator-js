import type { Filter, ViewportState } from '@annotorious/core';
import type { TextAnnotatorState } from '../../state';
import { getViewportBounds, trackViewport } from '../viewport';
import { debounce } from '../../utils';
import {
  DEFAULT_SELECTED_STYLE,
  DEFAULT_STYLE,
  type HighlightDrawingStyle,
  type HighlightStyle
} from '../HighlightStyle';
import type { HighlightPainter } from '../HighlightPainter';

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.className = 'r6o-highlight-layer bg';
  return canvas;
}

const resetCanvas = (canvas: HTMLCanvasElement, highres?: boolean) => {
  canvas.width = highres ? 2 * window.innerWidth : window.innerWidth;
  canvas.height = highres ? 2 * window.innerHeight : window.innerHeight;

  if (highres) {
    // Note that resizing the canvas resets the context
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }
}

export const createCanvasHighlightRenderer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => {
  const { store, selection, hover } = state;
  
  let currentStyle: HighlightStyle;

  let currentFilter: Filter | undefined;

  let customPainter: HighlightPainter;

  const onDraw = trackViewport(viewport);

  container.classList.add('r6o-annotatable');

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  container.insertBefore(canvas, container.firstChild);

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

  const refresh = () => requestAnimationFrame(() => {
    const bounds = getViewportBounds(container);   

    const { top, left, minX, minY, maxX, maxY } = bounds;
    
    const annotationsInView = currentFilter
      ? store.getIntersectingRects(minX, minY, maxX, maxY).filter(({ annotation }) => currentFilter(annotation))
      : store.getIntersectingRects(minX, minY, maxX, maxY);

    const { width, height } = canvas;

    // Get current selection
    const selectedIds = new Set(selection.selected.map(({ id }) => id));

    // New render loop - clear canvases
    ctx.clearRect(-0.5, -0.5, width + 1, height + 1);

    if (customPainter)
      customPainter.clear();
    
    annotationsInView.forEach(h => {
      const isSelected = selectedIds.has(h.annotation.id);

      const base: HighlightDrawingStyle = currentStyle
        ? typeof currentStyle === 'function' 
          ? currentStyle(h.annotation, { selected: isSelected })
          : currentStyle 
        : isSelected 
          ? DEFAULT_SELECTED_STYLE 
          : DEFAULT_STYLE;

      // Trigger the custom painter (if any) as a side-effect
      const style = customPainter ? customPainter.paint(h, bounds, { selected: isSelected }) || base : base;

      // Offset annotation rects by current scroll position
      const offsetRects = h.rects.map(({ x, y, width, height }) => ({ 
        x: x + left, 
        y: y + top, 
        width, 
        height 
      }));

      ctx.fillStyle = style.fill;
      ctx.globalAlpha = style.fillOpacity || 1;
      
      offsetRects.forEach(({ x, y, width, height }) => ctx.fillRect(x, y - 2.5, width, height + 5));
    });
    
    setTimeout(() => onDraw(annotationsInView.map(({ annotation }) => annotation)), 1);
  });  

  const setHighlightStyle = (style: HighlightStyle) => {
    currentStyle = style;
    refresh();
  }

  const setFilter = (filter?: Filter) => {
    currentFilter = filter;
    refresh();
  } 

  // Redraw on store change
  const onStoreChange = () => refresh();
  store.observe(onStoreChange);

  // Redraw on selection change
  const unsubscribeSelection = selection.subscribe(() => refresh());

  // Redraw on scroll
  const onScroll = () => refresh();
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Redraw on resize. Note that in cases where the element resized 
  // due to a window resize, onResize will be triggered twice. This 
  // is probably not a huge issue. But definitely an area for
  // future optimization. In terms of how to do this: there's 
  // probably no ideal solution, but one straightforward way
  // would be to just set a flag in 
  const onResize = debounce(() => {
    resetCanvas(canvas);

    store.recalculatePositions();

    if (customPainter)
      customPainter.reset();

    refresh();
  });

  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

  // This is an extra precaution. The position of the container
  // might shift (without resizing) due to layout changes higher-up
  // in the DOM. (This happens in Recogito+ for example)
  const mutationObserver = new MutationObserver(refresh);
  mutationObserver.observe(document.body, config);

  const destroy = () => {
    container.removeEventListener('pointermove', onPointerMove);

    container.removeChild(canvas);

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
    setHighlightStyle,
    setFilter,
    setPainter: (painter: HighlightPainter) => customPainter = painter
  }

}
