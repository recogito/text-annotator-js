import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createBaseRenderer } from '../src/highlight/Renderer';
import type { TextAnnotatorState } from '../src/state';
import type { TextAnnotation } from '../src/model';
import type { ViewportState } from '@annotorious/core';
import type { RendererImplementation } from '../src/highlight/Renderer';

describe('Renderer', () => {
  let container: HTMLElement;
  let mockState: TextAnnotatorState<TextAnnotation, unknown>;
  let mockViewport: ViewportState;
  let mockRendererImpl: RendererImplementation;

  beforeEach(async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="container" style="position: absolute; left: 100px; top: 50px; width: 500px; height: 300px;">
            <p>Some text content for annotation.</p>
          </div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
    global.Range = dom.window.Range;
    global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;

    // Create proper class mocks for ResizeObserver and MutationObserver
    class MockResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    class MockMutationObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

    container = document.getElementById('container') as HTMLElement;
    // Mock getBoundingClientRect for the container
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      x: 100,
      y: 50,
      width: 500,
      height: 300,
      top: 50,
      left: 100,
      right: 600,
      bottom: 350
    });

    // Create mock state
    mockState = {
      store: {
        getAnnotation: vi.fn(),
        addAnnotation: vi.fn(),
        updateAnnotation: vi.fn(),
        deleteAnnotation: vi.fn(),
        updateTarget: vi.fn(),
        getAt: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
        all: vi.fn().mockReturnValue([]),
        bulkAddAnnotations: vi.fn(),
        bulkUpdateTargets: vi.fn(),
        bulkUpsertAnnotations: vi.fn(),
        getAnnotationBounds: vi.fn(),
        getAnnotationRects: vi.fn(),
        getIntersecting: vi.fn().mockReturnValue([]),
        recalculatePositions: vi.fn(),
        onRecalculatePositions: vi.fn()
      },
      selection: {
        selected: [],
        userSelect: vi.fn(),
        clear: vi.fn(),
        subscribe: vi.fn().mockReturnValue(() => {}),
        evalSelectAction: vi.fn()
      },
      hover: {
        current: undefined,
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(() => {})
      },
      viewport: {
        current: undefined,
        set: vi.fn(),
        subscribe: vi.fn()
      }
    } as unknown as TextAnnotatorState<TextAnnotation, unknown>;

    mockViewport = {
      current: undefined,
      set: vi.fn(),
      subscribe: vi.fn()
    } as unknown as ViewportState;

    mockRendererImpl = {
      destroy: vi.fn(),
      redraw: vi.fn(),
      setVisible: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('onPointerMove', () => {
    it('should call store.getAt with relative coordinates (r-hover-001)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Create a pointermove event at clientX=150, clientY=100
      // Container is at x=100, y=50
      // So relative coords should be 150-100=50, 100-50=50
      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At line 78: store.getAt(event.clientX - x, event.clientY - y, false, currentFilter)
      expect(mockState.store.getAt).toHaveBeenCalledWith(50, 50, false, undefined);

      renderer.destroy();
    });

    it('should pass currentFilter to store.getAt (r-hover-002)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Set a filter
      const testFilter = (annotation: TextAnnotation) => annotation.id === 'test';
      renderer.setFilter(testFilter);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At line 78: store.getAt passes currentFilter as the 4th parameter
      expect(mockState.store.getAt).toHaveBeenCalledWith(50, 50, false, testFilter);

      renderer.destroy();
    });
  });
});
