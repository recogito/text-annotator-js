import debounce from 'debounce';
import { UserSelectAction, type Filter, type ViewportState } from '@annotorious/core';
import type { TextAnnotatorState } from '../state';
import { type ViewportBounds, getViewportBounds, trackViewport } from './viewport';
import type { HighlightPainter } from './HighlightPainter';
import type { Highlight } from './Highlight';
import type { HighlightStyleExpression } from './HighlightStyle';

export interface RendererImplementation {

  destroy(): void;

  redraw(

    highlights:Highlight[], 

    bounds: ViewportBounds, 
    
    style?: HighlightStyleExpression,

    painter?: HighlightPainter,

    lazy?: boolean
  
  ): void;

  setVisible(visible: boolean): void;

}

export interface Renderer {

  destroy(): void;

  redraw(force?: boolean): void;

  setStyle(style?: HighlightStyleExpression): void;

  setFilter(filter?: Filter): void;

  setPainter(painter?: HighlightPainter): void;

  setVisible(visible: boolean): void;

}

export const createBaseRenderer = <T extends TextAnnotatorState = TextAnnotatorState> (
  container: HTMLElement, 
  state: T,
  viewport: ViewportState,
  renderer: RendererImplementation
): Renderer => {
  const { store, selection, hover } = state;

  let currentStyle: HighlightStyleExpression | undefined;

  let currentFilter: Filter | undefined;

  let currentPainter: HighlightPainter;

  const onDraw = trackViewport(viewport);

  const onPointerMove = (event: PointerEvent) => {
    const {x, y} = container.getBoundingClientRect();

    // TODO this may be a bit of an edge case... but ideally we'd retrieve the whole 
    // stack of annotations, and then evaluate if ANY of them is clickable.
    const hit = store.getAt(event.clientX - x, event.clientY - y, false, currentFilter);
    if (hit && state.selection.evalSelectAction(hit) !== UserSelectAction.NONE) {
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

  const redraw = debounce((lazy: boolean = false) => requestAnimationFrame(() => {
    if (currentPainter)
      currentPainter.clear();

    const bounds = getViewportBounds(container);   

    const { minX, minY, maxX, maxY } = bounds;
    
    const annotationsInView = currentFilter
      ? store.getIntersecting(minX, minY, maxX, maxY).filter(({ annotation }) => currentFilter(annotation))
      : store.getIntersecting(minX, minY, maxX, maxY);

    const selectedIds = selection.selected.map(({ id }) => id);

    const highlights: Highlight[] = annotationsInView.map(({ annotation, rects }) => {
      const selected = selectedIds.includes(annotation.id);
      const hovered = annotation.id === hover.current;

      return {
        annotation,
        rects,
        state: { selected, hovered }
      };
    });

    renderer.redraw(highlights, bounds, currentStyle, currentPainter, lazy);

    setTimeout(() => onDraw(annotationsInView.map(({ annotation }) => annotation)), 1);
  }), 10);

  const setPainter = (painter: HighlightPainter) => { 
    currentPainter = painter;
    redraw();
  }

  const setStyle = (style?: HighlightStyleExpression) => {
    currentStyle = style;
    redraw();
  }

  const setFilter = (filter?: Filter) => {
    currentFilter = filter;
    redraw(false);
  } 

  // Refresh on store change
  const onStoreChange = () => redraw();
  store.observe(onStoreChange);

  // Refresh on selection change
  const unsubscribeSelection = selection.subscribe(() => redraw());

  // Refresh on hover change
  const unsubscribeHover = hover.subscribe(() => redraw());

  // Refresh on scroll
  const onScroll = () => redraw(true);

  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Refresh on resize
  const onResize = debounce(() => {
    store.recalculatePositions();

    currentPainter?.reset();

    redraw();
  }, 10);

  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  // This is an extra precaution. The position of the container
  // might shift (without resizing) due to layout changes higher-up
  // in the DOM. (This happens in Recogito for example)
  const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

  const mutationObserver = new MutationObserver(debounce((records: MutationRecord[]) => {
    const isInternal = records
      .every(record => record.target === container || container.contains(record.target));

    if (!isInternal)
      redraw(true);
  }, 150));

  mutationObserver.observe(document.body, config);

  const destroy = () => {
    container.removeEventListener('pointermove', onPointerMove);
  
    renderer.destroy();
  
    store.unobserve(onStoreChange);

    unsubscribeSelection();
    unsubscribeHover();

    document.removeEventListener('scroll', onScroll);

    onResize.clear();
    window.removeEventListener('resize', onResize);
    resizeObserver.disconnect();

    mutationObserver.disconnect();
  }

  return {
    destroy,
    redraw,
    setStyle,
    setFilter,
    setPainter,
    setVisible: renderer.setVisible
  }

}
