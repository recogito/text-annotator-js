import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { UserSelectAction } from '@annotorious/core';
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

    it('should check evalSelectAction is not NONE before hovering (r-hover-003)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Mock store.getAt to return a hit
      const mockAnnotation = { id: 'test-annotation', target: {} } as TextAnnotation;
      (mockState.store.getAt as any).mockReturnValue(mockAnnotation);

      // Mock evalSelectAction to return NONE
      (mockState.selection.evalSelectAction as any).mockReturnValue(UserSelectAction.NONE);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At line 79: if (hit && state.selection.evalSelectAction(hit) !== UserSelectAction.NONE)
      // When evalSelectAction returns NONE, hover.set should NOT be called
      expect(mockState.selection.evalSelectAction).toHaveBeenCalledWith(mockAnnotation);
      expect(mockState.hover.set).not.toHaveBeenCalled();
      expect(container.classList.contains('hovered')).toBe(false);

      renderer.destroy();
    });

    it('should add hovered class and set hover state when hit found (r-hover-004)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Mock store.getAt to return a hit
      const mockAnnotation = { id: 'test-annotation', target: {} } as TextAnnotation;
      (mockState.store.getAt as any).mockReturnValue(mockAnnotation);

      // Mock evalSelectAction to return something other than NONE
      (mockState.selection.evalSelectAction as any).mockReturnValue(UserSelectAction.SELECT);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At lines 80-83: When hit found and evalSelectAction is not NONE
      // container.classList.add('hovered') and hover.set(hit.id)
      expect(container.classList.contains('hovered')).toBe(true);
      expect(mockState.hover.set).toHaveBeenCalledWith('test-annotation');

      renderer.destroy();
    });

    it('should only update hover when id changes (r-hover-005)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Mock store.getAt to return a hit
      const mockAnnotation = { id: 'test-annotation', target: {} } as TextAnnotation;
      (mockState.store.getAt as any).mockReturnValue(mockAnnotation);
      (mockState.selection.evalSelectAction as any).mockReturnValue(UserSelectAction.SELECT);

      // Set hover.current to the same id as the annotation
      (mockState.hover as any).current = 'test-annotation';

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At line 80: if (hover.current !== hit.id)
      // Since hover.current already equals the hit id, hover.set should NOT be called
      expect(mockState.hover.set).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it('should remove hovered class and clear hover when no hit (r-hover-006)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Set initial hovered state
      container.classList.add('hovered');
      (mockState.hover as any).current = 'some-annotation';

      // Mock store.getAt to return null (no hit)
      (mockState.store.getAt as any).mockReturnValue(null);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At lines 84-88: When no hit and hover.current exists
      // container.classList.remove('hovered') and hover.set(null)
      expect(container.classList.contains('hovered')).toBe(false);
      expect(mockState.hover.set).toHaveBeenCalledWith(null);

      renderer.destroy();
    });

    it('should only clear hover when hover.current exists (r-hover-007)', () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Ensure hover.current is undefined (no current hover)
      (mockState.hover as any).current = undefined;

      // Mock store.getAt to return null (no hit)
      (mockState.store.getAt as any).mockReturnValue(null);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // At line 85: if (hover.current)
      // Since hover.current is undefined, hover.set should NOT be called
      expect(mockState.hover.set).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it('should add pointermove listener to container (r-hover-008)', () => {
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');

      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // At line 92: container.addEventListener('pointermove', onPointerMove)
      expect(addEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));

      addEventListenerSpy.mockRestore();
      renderer.destroy();
    });
  });

  describe('redraw', () => {
    it('should be debounced at 10ms (r-redraw-001)', async () => {
      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Call redraw multiple times rapidly
      renderer.redraw();
      renderer.redraw();
      renderer.redraw();

      // Wait a short time (less than debounce)
      await new Promise(resolve => setTimeout(resolve, 5));

      // rendererImpl.redraw should not have been called yet (still debouncing)
      expect(mockRendererImpl.redraw).not.toHaveBeenCalled();

      // Wait for debounce to complete (10ms debounce + requestAnimationFrame)
      await new Promise(resolve => setTimeout(resolve, 30));

      // Now it should have been called exactly once (debounced to single call)
      expect(mockRendererImpl.redraw).toHaveBeenCalledTimes(1);

      renderer.destroy();
    });

    it('should use requestAnimationFrame (r-redraw-002)', async () => {
      // Mock requestAnimationFrame since JSDOM doesn't have it
      const rafMock = vi.fn((cb: FrameRequestCallback) => {
        setTimeout(() => cb(Date.now()), 0);
        return 1;
      });
      global.requestAnimationFrame = rafMock;

      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Reset any calls from initialization
      vi.clearAllMocks();
      rafMock.mockClear();

      renderer.redraw();

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 15));

      // At line 94: requestAnimationFrame is called after debounce
      expect(rafMock).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should call painter.clear() when painter exists (r-redraw-003)', async () => {
      const mockPainter = {
        clear: vi.fn(),
        reset: vi.fn()
      };

      const renderer = createBaseRenderer(container, mockState, mockViewport, mockRendererImpl);

      // Set the painter
      renderer.setPainter(mockPainter as any);

      // Reset any calls from setPainter
      vi.clearAllMocks();
      mockPainter.clear.mockClear();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // At lines 95-96: if (currentPainter) currentPainter.clear()
      expect(mockPainter.clear).toHaveBeenCalled();

      renderer.destroy();
    });
  });
});
