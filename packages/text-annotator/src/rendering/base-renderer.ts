import { createNanoEvents, type Unsubscribe } from 'nanoevents';
import { UserSelectAction, type Filter, type ViewportState } from '@annotorious/core';
import type { TextAnnotation } from '@/model';
import type { TextAnnotatorState } from '@/state';
import { 
  type Highlight,
  type HighlightStyleExpression,
  type ViewportBounds,
  getViewportBounds, 
  trackViewport 
} from '@/rendering';
// Note that the debounce npm package has the same issue as below under
// some circumstances:
// https://github.com/agentcooper/react-pdf-highlighter/issues/276
import { debounce } from '@/utils/events';

/**
 * The renderer runtime interface.
 */
export interface Renderer {

  destroy(): void;

  on: <E extends keyof RendererEvents>(event: E, callback: RendererEvents[E]) => Unsubscribe;

  redraw(force?: boolean): void;

  setStyle(style?: HighlightStyleExpression, id?: string): void;

  setFilter(filter?: Filter): void;

  setVisible(visible: boolean): void;

}

export interface RendererEvents {

  onRedraw(): void;

}

export type RendererFactory = (

  container: HTMLElement,

  state: TextAnnotatorState<TextAnnotation, unknown>,

  viewport: ViewportState

) => Renderer;

/**
 * A utility interface. Instead of implementing a Renderer from scratch,
 * implementers can simply implement a painter, and wrap it in the
 * BaseRenderer, which will handle common concerns.
 */
export interface Painter {

  destroy(): void;

  redraw(
    highlights:Highlight[], 
    bounds: ViewportBounds, 
    style?: HighlightStyleExpression,
    styleOverrides?: Map<string, HighlightStyleExpression>,
    force?: boolean
  ): void;

  setVisible(visible: boolean): void;

}

export const createRenderer = <T extends TextAnnotatorState = TextAnnotatorState> (
  painter: Painter,
  container: HTMLElement, 
  state: T,
  viewport: ViewportState,
): Renderer => {
  const { store, selection, hover } = state;

  const emitter = createNanoEvents<RendererEvents>();

  let currentStyle: HighlightStyleExpression | undefined;

  const styleOverrides = new Map<string, HighlightStyleExpression>();

  let currentFilter: Filter | undefined;

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

  const redraw = debounce((force: boolean = false) => requestAnimationFrame(() => {
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

    painter.redraw(highlights, bounds, currentStyle, styleOverrides, force);

    setTimeout(() => {
      onDraw(annotationsInView.map(({ annotation }) => annotation));
      emitter.emit('onRedraw')
    }, 1);
  }), 10);

  const setStyle = (style?: HighlightStyleExpression, id?: string) => {
    if (id) {
      if (style)
        styleOverrides.set(id, style);
      else
        styleOverrides.delete(id);
    } else {
      currentStyle = style;
    }

    // console.log('[base-renderer] redrawing style change');
    redraw(true);
  }

  const setFilter = (filter?: Filter) => {
    currentFilter = filter;
    // console.log('[base-renderer] redrawing filter change');
    redraw(false);
  } 

  const on = <E extends keyof RendererEvents>(event: E, callback: RendererEvents[E]): Unsubscribe => 
    emitter.on(event, callback);

  // Refresh on store change
  const onStoreChange = () => {
    // console.log('[base-renderer] redrawing store change');
    redraw();
  }

  store.observe(onStoreChange);

  // Refresh on selection change
  const unsubscribeSelection = selection.subscribe(() => {
    // console.log('[base-renderer] redrawing selection change');
    redraw();
  });

  // Refresh on hover change
  const unsubscribeHover = hover.subscribe(() => {
    // console.log('[base-renderer] redrawing hover change');
    redraw()
  });

  // Refresh on scroll
  const onScroll = () => {
    // console.log('[base-renderer] redrawing scroll');
    redraw(true);
  }

  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Refresh on resize
  const onResize = debounce(() => {
    store.recalculatePositions();
    // console.log('[base-renderer] redrawing resize');
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

    if (!isInternal) {
      // console.log('[base-renderer] redrawing mutation');
      redraw(true);
    }
  }, 150));

  mutationObserver.observe(document.body, config);

  const destroy = () => {
    container.removeEventListener('pointermove', onPointerMove);
  
    painter.destroy();
  
    store.unobserve(onStoreChange);

    unsubscribeSelection();
    unsubscribeHover();

    document.removeEventListener('scroll', onScroll);

    // onResize.clear();
    window.removeEventListener('resize', onResize);
    resizeObserver.disconnect();

    mutationObserver.disconnect();
  }

  return {
    destroy,
    on,
    redraw,
    setStyle,
    setFilter,
    setVisible: painter.setVisible.bind(painter)
  }

}
