import { mergeClientRects } from '../utils';
import type { TextAnnotatorState } from '../state';
import type { HighlightPainter } from './HighlightPainter';

import './highlightLayer.css';

const DEFAULT_STYLE = { fill: 'rgba(0, 128, 255, 0.18)' };

const SELECTED_STYLE = { fill: 'rgba(0, 128, 255, 0.4)' };

const debounce = <T extends (...args: any[]) => void>(func: T, delay: number = 10): T => {
  let timeoutId: number;

  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  }) as T;
}

export const createHighlightLayer = (container: HTMLElement, state: TextAnnotatorState) => {

  const { store, selection, hover } = state;

  let currentPainter: HighlightPainter = null;

  container.classList.add('r6o-annotatable');

  const canvas = document.createElement('canvas');
  canvas.width = 2 * window.innerWidth;
  canvas.height = 2 * window.innerHeight;
  canvas.className = 'r6o-highlight-layer';

  const context = canvas.getContext('2d');
  context.scale(2, 2);
  context.translate(0.5, 0.5);

  container.appendChild(canvas);

  container.addEventListener('pointermove', (event: PointerEvent) => {
    const {x, y} = container.getBoundingClientRect();
    const hovered = store.getAt(event.clientX - x, event.clientY - y);
    if (hovered) {
      if (hover.current !== hovered.id) {
        container.classList.add('hovered');
        hover.set(hovered.id);
      }
    } else {
      if (hover.current) {
        container.classList.remove('hovered');
        hover.set(null);
      }
    }
  });

  const getViewport = () => {
    const { top, left } = container.getBoundingClientRect();
     
    const { innerWidth, innerHeight } = window;

    const minX = - left;
    const minY = - top;
    const maxX = innerWidth - left;
    const maxY = innerHeight - top;

    return { minX, minY, maxX, maxY };
  }

  const onScroll = () => redraw();

  document.addEventListener('scroll', onScroll, true);

  const onResize = debounce(() => {
    canvas.width = 2 * window.innerWidth;
    canvas.height = 2 * window.innerHeight;
    
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
    
    store.recalculatePositions();

    redraw();
  });

  // Note that in cases where the element resized due to a 
  // window resize, onResize will be triggered twice. This is
  // probably not a huge issue. But definitely an area for
  // future optimization. In terms of how to do this: there's 
  // probably no ideal solution, but one straightforward way
  // would be to just set a flag in 
  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  const redraw = () => {
    const { minX, minY, maxX, maxY } = getViewport();   
    const annotationsInView = store.getIntersecting(minX, minY, maxX, maxY);

    requestAnimationFrame(() => {
      // New render loop - clear canvas
      context.clearRect(-0.5, -0.5, canvas.width + 1, canvas.height + 1);

      // Get current selection
      const selectedIds = new Set(selection.selected.map(({ id }) => id));

      annotationsInView.forEach(annotation => {
        const isSelected = selectedIds.has(annotation.id);

        const rects = Array.from(annotation.target.selector.range.getClientRects());
        const merged = mergeClientRects(rects);

        const style =
          (currentPainter && currentPainter(annotation, merged, context, isSelected)) || 
          (isSelected ? SELECTED_STYLE : DEFAULT_STYLE);
        
        context.fillStyle = style.fill;

        merged.forEach(({ x, y, width, height }) => context.fillRect(x, y - 2.5, width, height + 5));
      });
    });
  }

  store.observe(() => redraw());

  // Selection should only ever affect visible annotations,
  // need need for extra check
  selection.subscribe(() => redraw());

  return {
    redraw,
    setPainter: (painter: HighlightPainter) => currentPainter = painter
  }

}