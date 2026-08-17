import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRenderer, type Painter } from '../../src/rendering/base-renderer';

/**
 * The renderer redraws through a 10ms debounce and a rAF, so give both a
 * chance to run before asserting.
 */
const flushRedraw = () => new Promise(resolve => setTimeout(resolve, 50));

const createPainter = () => ({
  destroy: vi.fn(),
  redraw: vi.fn(),
  setVisible: vi.fn()
}) satisfies Painter;

const createState = () => ({
  store: {
    observe: vi.fn(),
    unobserve: vi.fn(),
    getAt: vi.fn(),
    getIntersecting: vi.fn(() => []),
    recalculatePositions: vi.fn()
  },
  selection: {
    subscribe: vi.fn(() => vi.fn()),
    selected: [],
    evalSelectAction: vi.fn()
  },
  hover: {
    subscribe: vi.fn(() => vi.fn()),
    current: undefined,
    set: vi.fn()
  }
});

const viewport = { set: vi.fn() };

describe('createRenderer', () => {

  let container: HTMLElement;

  beforeEach(() => {
    // jsdom has no ResizeObserver.
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should redraw when the page scrolls', async () => {
    const painter = createPainter();
    const renderer = createRenderer(painter, container, createState() as any, viewport as any);

    container.dispatchEvent(new Event('scroll'));
    await flushRedraw();

    expect(painter.redraw).toHaveBeenCalled();

    renderer.destroy();
  });

  it('should stop redrawing on scroll after destroy', async () => {
    // Regression test: the scroll listener is registered with { capture: true },
    // so destroy() has to remove it with the same flag. Without it the listener
    // stays on the document forever, and every destroyed renderer keeps forcing
    // a full redraw on every scroll event in the page.
    const painter = createPainter();
    const renderer = createRenderer(painter, container, createState() as any, viewport as any);

    renderer.destroy();
    painter.redraw.mockClear();

    container.dispatchEvent(new Event('scroll'));
    await flushRedraw();

    expect(painter.redraw).not.toHaveBeenCalled();
  });

});
