import type { TextAnnotationStore } from '../state';
import type { HighlightPainter } from './HighlightPainter';

import './highlightLayer.css';

const DEFAULT_STYLE = { fill: 'rgba(0, 128, 255, 0.18)' };

const SELECTED_STYLE = { fill: 'rgba(0, 128, 255, 0.4)' };

/**
 * Returns true if set a is equal to b, or if a is a subset of b. 
 * @param a set A
 * @param b set B
 * @returns true if a is equal or a subset to b
 */
const equalOrSubset = (a: Set<string>, b: Set<string>) =>
  a.size <= b.size && [...a].every(value => b.has(value));

export const createHighlightLayer = (container: HTMLElement, store: TextAnnotationStore) => {

  let renderedIds = new Set<string>();

  let currentPainter: HighlightPainter = null;

  container.classList.add('r6o-annotatable');

  const canvas = document.createElement('canvas');
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.className = 'r6o-highlight-layer';

  const context = canvas.getContext('2d');
  context.scale(2, 2);
  context.translate(0.5, 0.5);

  container.appendChild(canvas);

  container.addEventListener('pointermove', (event: PointerEvent) => {
    const {x, y} = container.getBoundingClientRect();
    const hovered = store.getAt(event.clientX - x, event.clientY - y);
    if (hovered) {
      if (store.hover.current !== hovered.id) {
        container.classList.add('hovered');
        store.hover.set(hovered.id);
      }
    } else {
      if (store.hover.current) {
        container.classList.remove('hovered');
        store.hover.set(null);
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

  const onScroll = () => redraw(true);

  document.addEventListener('scroll', onScroll, true);

  const onResize = new ResizeObserver(() => {
    canvas.width = 2 * container.offsetWidth;
    canvas.height = 2 * container.offsetHeight;
    
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
    
    store.recalculatePositions();

    redraw(false);
  });

  onResize.observe(container);

  const redraw = (lazy: boolean = true) => {
    const offset = container.getBoundingClientRect();

    const { minX, minY, maxX, maxY } = getViewport();      
    const annotationsInView = store.getIntersecting(minX, minY, maxX, maxY);

    const ids = new Set(annotationsInView.map(a => a.id));
    if (lazy && equalOrSubset(ids, renderedIds))
      // Don't re-render if there are no new annotations
      return;

    requestAnimationFrame(() => {
      // New render loop - clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Get current selection
      const selected = new Set(store.selection.selected);

      annotationsInView.forEach(annotation => {
        const isSelected = selected.has(annotation.id);

        const rects = Array.from(annotation.target.selector.range.getClientRects());

        const style = 
          (currentPainter && currentPainter(annotation, rects, context, offset, isSelected)) || 
          (isSelected ? SELECTED_STYLE : DEFAULT_STYLE);
        
        context.fillStyle = style.fill;

        rects.forEach(({ x, y, width, height }) =>
          context.fillRect(x - offset.x, y - offset.y - 2.5, width, height + 5));
      });
    });

    renderedIds = ids;
  }

  store.observe(({ changes }) => {
    const { created, deleted, updated } = changes;

    if (created?.length > 0) {
      redraw();
    } else {
      const affectedIds = [
        ...(deleted || []).map(a => a.id),
        ...(updated || []).map(u => u.newValue.id)
      ];

      const affectsRendered = affectedIds.some(id => renderedIds.has(id));
      redraw(!affectsRendered);
    }
  });

  // Selection should only ever affect visible annotations,
  // need need for extra check
  store.selection.subscribe(() => redraw(false));

  return {
    redraw,
    setPainter: (painter: HighlightPainter) => currentPainter = painter
  }

}