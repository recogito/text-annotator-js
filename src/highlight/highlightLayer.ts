import type { TextAnnotationStore } from '../state';

import './highlightLayer.css';

/**
 * Returns true if set a is equal to b, or if a is a subset of b. 
 * @param a set A
 * @param b set B
 * @returns true if a is equal or a subset to b
 */
const equalOrSubset = (a: Set<string>, b: Set<string>) =>
  a.size <= b.size && [...a].every(value => b.has(value));

export const createHighlightLayer = (container: HTMLElement, store: TextAnnotationStore) => {
  container.classList.add('r6o-annotatable');

  const canvas = document.createElement('canvas');
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.className = 'r6o-highlight-layer';

  container.insertBefore(canvas, container.firstChild);

  container.addEventListener('pointermove', (event: PointerEvent) => {
    const {x, y} = container.getBoundingClientRect();
    const hovered = store.getAt(event.clientX - x, event.clientY - y);
    if (hovered) {
      canvas.classList.add('hover');

      if (store.hover.current !== hovered.id)
        store.hover.set(hovered.id);
    } else {
      canvas.classList.remove('hover');
      if (store.hover.current)
        store.hover.set(null);
    }
  });

  const context = canvas.getContext('2d');

  let renderedIds = new Set<string>();

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
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

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
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'rgba(0, 128, 255, 0.2)';

      annotationsInView.forEach(annotation => {
        Array.from(annotation.target.selector.range.getClientRects()).forEach(rect => {
          const { x, y, width, height } = rect;
          context.fillRect(x - offset.x, y - offset.y - 2.5, width, height + 5);
        });
      });
    });

    renderedIds = ids;
  }

  store.observe(({ changes }) => {
    const updatedIds = (changes.updated || []).map(update => update.newValue.id);

    // Check if any rendered annotations are affected by updates
    const affectsRendered = updatedIds.some(id => renderedIds.has(id));
    redraw(!affectsRendered);
  });

}