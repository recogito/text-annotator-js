import type { DrawingStyle, Filter, ViewportState } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { TextAnnotatorState } from '../state';
import { defaultPainter, type HighlightPainter, type HighlightPainterStyle } from './HighlightPainter';
import { trackViewport } from './trackViewport';
import { debounce } from '../utils';

const createCanvas = (className: string, highres?: boolean) => {
  const canvas = document.createElement('canvas');
  canvas.width = highres ? 2 * window.innerWidth : window.innerWidth;
  canvas.height = highres ? 2 * window.innerHeight : window.innerHeight;
  canvas.className = className;

  if (highres) {
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }

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

export const createHighlightLayer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => {
  const { store, selection, hover } = state;
  
  let currentStyle: HighlightPainterStyle | undefined;

  let currentFilter: Filter | undefined;

  let currentPainter: HighlightPainter = defaultPainter;

  const onDraw = trackViewport(viewport);

  container.classList.add('r6o-annotatable');

  const bgCanvas = createCanvas('r6o-highlight-layer bg');
  const fgCanvas = createCanvas('r6o-highlight-layer fg', true);

  const bgContext = bgCanvas.getContext('2d');
  const fgContext = fgCanvas.getContext('2d');

  container.insertBefore(bgCanvas, container.firstChild);
  container.appendChild(fgCanvas);

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

  const redraw = () => requestAnimationFrame(() => {
    const { top, left, minX, minY, maxX, maxY } = getViewport();   
    
    const annotationsInView = currentFilter
      ? store.getIntersectingRects(minX, minY, maxX, maxY).filter(({ annotation }) => currentFilter(annotation))
      : store.getIntersectingRects(minX, minY, maxX, maxY);

    const { width, height } = fgCanvas;

    // Get current selection
    const selectedIds = new Set(selection.selected.map(({ id }) => id));

    // New render loop - clear canvases
    fgContext.clearRect(-0.5, -0.5, width + 1, height + 1);
    bgContext.clearRect(-0.5, -0.5, width + 1, height + 1);
    
    annotationsInView.forEach(({ annotation, rects }) => {
      // Offset annotation rects by current scroll position
      const offsetRects = rects.map(({ x, y, width, height }) => ({ 
        x: x + left, 
        y: y + top, 
        width, 
        height 
      }));

      const isSelected = selectedIds.has(annotation.id);
      currentPainter.paint(annotation, offsetRects, bgContext, fgContext, isSelected, currentStyle);
    });
    
    setTimeout(() => onDraw(annotationsInView.map(({ annotation }) => annotation)), 1);
  });  

  const setDrawingStyle = (style: HighlightPainterStyle) => {
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

  // Redraw on scroll
  const onScroll = () => redraw();
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Redraw on resize. Note that in cases where the element resized 
  // due to a window resize, onResize will be triggered twice. This 
  // is probably not a huge issue. But definitely an area for
  // future optimization. In terms of how to do this: there's 
  // probably no ideal solution, but one straightforward way
  // would be to just set a flag in 
  const onResize = debounce(() => {
    resetCanvas(bgCanvas);
    resetCanvas(fgCanvas, true);

    store.recalculatePositions();

    redraw();
  });

  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

  // This is an extra precaution. The position of the container
  // might shift (without resizing) due to layout changes higher-up
  // in the DOM. (This happens in Recogito+ for example)
  const mutationObserver = new MutationObserver(redraw);
  mutationObserver.observe(document.body, config);

  const destroy = () => {
    container.removeEventListener('pointermove', onPointerMove);

    container.removeChild(fgCanvas);
    container.appendChild(bgCanvas);

    store.unobserve(onStoreChange);

    unsubscribeSelection();

    document.removeEventListener('scroll', onScroll);

    window.removeEventListener('resize', onResize);
    resizeObserver.disconnect();

    mutationObserver.disconnect();
  }

  return {
    destroy,
    redraw,
    setDrawingStyle,
    setFilter,
    setPainter: (painter: HighlightPainter) => currentPainter = painter
  }

}
