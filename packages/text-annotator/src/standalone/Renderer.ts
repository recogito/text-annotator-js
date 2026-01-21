import type { Filter } from './types';
import type { TextAnnotation } from './model';
import type { StoreProxy } from './proxies/storeProxy';
import type { SelectionProxy } from './proxies/selectionProxy';
import type { HoverProxy } from './proxies/hoverProxy';
import { type ViewportBounds, getViewportBounds } from './highlight/viewport';
import type { HighlightPainter } from './highlight/HighlightPainter';
import type { Highlight } from './highlight/Highlight';
import type { HighlightStyleExpression } from './highlight/HighlightStyle';
import { debounce } from './utils/debounce';

// UserSelectAction constant (from @annotorious/core)
const UserSelectAction = {
  EDIT: 'EDIT' as const,
  SELECT: 'SELECT' as const,
  NONE: 'NONE' as const
};

export type RendererFactory = (
  container: HTMLElement,
  storeProxy: StoreProxy<TextAnnotation>,
  selectionProxy: SelectionProxy,
  hoverProxy: HoverProxy,
  onHoverChange: (annotationId: string | null) => void,
  onViewportChange: (annotationIds: string[]) => void
) => Renderer;

export interface RendererImplementation {

  destroy(): void;

  redraw(

    highlights: Highlight[],

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

export const createBaseRenderer = <I extends TextAnnotation = TextAnnotation>(
  container: HTMLElement,
  storeProxy: StoreProxy<I>,
  selectionProxy: SelectionProxy,
  hoverProxy: HoverProxy,
  renderer: RendererImplementation,
  onHoverChange: (annotationId: string | null) => void,
  onViewportChange: (annotationIds: string[]) => void
): Renderer => {

  let currentStyle: HighlightStyleExpression | undefined;

  let currentFilter: Filter | undefined;

  let currentPainter: HighlightPainter;

  const onPointerMove = (event: PointerEvent) => {
    const { x, y } = container.getBoundingClientRect();

    // TODO this may be a bit of an edge case... but ideally we'd retrieve the whole
    // stack of annotations, and then evaluate if ANY of them is clickable.
    const hit = storeProxy.getAt(event.clientX - x, event.clientY - y, false, currentFilter) as I | undefined;
    if (hit && selectionProxy.evalSelectAction(hit) !== UserSelectAction.NONE) {
      if (hoverProxy.getCurrent() !== hit.id) {
        hoverProxy.set(hit.id);
        onHoverChange(hit.id);
      }
    } else {
      if (hoverProxy.getCurrent()) {
        hoverProxy.set(null);
        onHoverChange(null);
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
      ? storeProxy.getIntersecting(minX, minY, maxX, maxY).filter(({ annotation }) => currentFilter(annotation))
      : storeProxy.getIntersecting(minX, minY, maxX, maxY);

    const selectedIds = selectionProxy.getSelected().map(({ id }) => id);
    const hoveredId = hoverProxy.getCurrent();

    const highlights: Highlight[] = annotationsInView.map(({ annotation, rects }) => {
      const selected = selectedIds.includes(annotation.id);
      const hovered = annotation.id === hoveredId;

      return {
        annotation,
        rects,
        state: { selected, hovered }
      };
    });

    renderer.redraw(highlights, bounds, currentStyle, currentPainter, lazy);

    setTimeout(() => onViewportChange(annotationsInView.map(({ annotation }) => annotation.id)), 1);
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
  const unsubscribeStore = storeProxy.observeStore(() => redraw());

  // Refresh on selection change
  const unsubscribeSelection = selectionProxy.subscribe(() => redraw());

  // Refresh on hover change
  const unsubscribeHover = hoverProxy.subscribe(() => redraw());

  // Refresh on scroll
  const onScroll = () => redraw(true);

  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Refresh on resize
  const onResize = debounce(() => {
    storeProxy.recalculatePositions();

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

    unsubscribeStore();
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
    redraw,
    setStyle,
    setFilter,
    setPainter,
    setVisible: renderer.setVisible
  }

}
