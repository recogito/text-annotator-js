import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { UserSelectAction } from '@annotorious/core';
import { createBaseRenderer } from '../src/highlight/Renderer';
import type { StoreProxy, SelectionProxy, HoverProxy } from '../src/state';
import type { TextAnnotation } from '../src/model';
import type { RendererImplementation } from '../src/highlight/Renderer';

describe('Renderer', () => {
  let container: HTMLElement;
  let mockStoreProxy: StoreProxy<TextAnnotation>;
  let mockSelectionProxy: SelectionProxy;
  let mockHoverProxy: HoverProxy;
  let mockRendererImpl: RendererImplementation;
  let mockOnHoverChange: ReturnType<typeof vi.fn>;
  let mockOnViewportChange: ReturnType<typeof vi.fn>;

  // Track unsubscribe functions for proxies
  let storeUnsubscribe: ReturnType<typeof vi.fn>;
  let selectionUnsubscribe: ReturnType<typeof vi.fn>;
  let hoverUnsubscribe: ReturnType<typeof vi.fn>;

  // Track current hover state (simulating HoverProxy internal state)
  let currentHoverId: string | null;

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

    // Initialize hover state
    currentHoverId = null;

    // Create unsubscribe functions
    storeUnsubscribe = vi.fn();
    selectionUnsubscribe = vi.fn();
    hoverUnsubscribe = vi.fn();

    // Create mock store proxy
    mockStoreProxy = {
      getAnnotation: vi.fn(),
      getAt: vi.fn(),
      getIntersecting: vi.fn().mockReturnValue([]),
      recalculatePositions: vi.fn(),
      addAnnotation: vi.fn(),
      updateTarget: vi.fn(),
      deleteAnnotation: vi.fn(),
      observeStore: vi.fn().mockReturnValue(storeUnsubscribe),
      on: vi.fn()
    } as unknown as StoreProxy<TextAnnotation>;

    // Create mock selection proxy
    mockSelectionProxy = {
      getSelected: vi.fn().mockReturnValue([]),
      evalSelectAction: vi.fn(),
      clear: vi.fn(),
      userSelect: vi.fn(),
      subscribe: vi.fn().mockReturnValue(selectionUnsubscribe)
    } as unknown as SelectionProxy;

    // Create mock hover proxy
    mockHoverProxy = {
      getCurrent: vi.fn(() => currentHoverId),
      set: vi.fn((id: string | null) => { currentHoverId = id; }),
      subscribe: vi.fn().mockReturnValue(hoverUnsubscribe)
    } as unknown as HoverProxy;

    mockRendererImpl = {
      destroy: vi.fn(),
      redraw: vi.fn(),
      setVisible: vi.fn()
    };

    mockOnHoverChange = vi.fn();
    mockOnViewportChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('onPointerMove', () => {
    it('should call storeProxy.getAt with relative coordinates (r-hover-001)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Create a pointermove event at clientX=150, clientY=100
      // Container is at x=100, y=50
      // So relative coords should be 150-100=50, 100-50=50
      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      expect(mockStoreProxy.getAt).toHaveBeenCalledWith(50, 50, false, undefined);

      renderer.destroy();
    });

    it('should pass currentFilter to storeProxy.getAt (r-hover-002)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Set a filter
      const testFilter = (annotation: TextAnnotation) => annotation.id === 'test';
      renderer.setFilter(testFilter);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      expect(mockStoreProxy.getAt).toHaveBeenCalledWith(50, 50, false, testFilter);

      renderer.destroy();
    });

    it('should check evalSelectAction is not NONE before hovering (r-hover-003)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Mock storeProxy.getAt to return a hit
      const mockAnnotation = { id: 'test-annotation', target: {} } as TextAnnotation;
      (mockStoreProxy.getAt as any).mockReturnValue(mockAnnotation);

      // Mock evalSelectAction to return NONE
      (mockSelectionProxy.evalSelectAction as any).mockReturnValue(UserSelectAction.NONE);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // When evalSelectAction returns NONE, hoverProxy.set should NOT be called
      expect(mockSelectionProxy.evalSelectAction).toHaveBeenCalledWith(mockAnnotation);
      expect(mockHoverProxy.set).not.toHaveBeenCalled();
      expect(mockOnHoverChange).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it('should set hover state and call onHoverChange when hit found (r-hover-004)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Mock storeProxy.getAt to return a hit
      const mockAnnotation = { id: 'test-annotation', target: {} } as TextAnnotation;
      (mockStoreProxy.getAt as any).mockReturnValue(mockAnnotation);

      // Mock evalSelectAction to return something other than NONE
      (mockSelectionProxy.evalSelectAction as any).mockReturnValue(UserSelectAction.SELECT);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // When hit found and evalSelectAction is not NONE
      expect(mockHoverProxy.set).toHaveBeenCalledWith('test-annotation');
      expect(mockOnHoverChange).toHaveBeenCalledWith('test-annotation');

      renderer.destroy();
    });

    it('should only update hover when id changes (r-hover-005)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Mock storeProxy.getAt to return a hit
      const mockAnnotation = { id: 'test-annotation', target: {} } as TextAnnotation;
      (mockStoreProxy.getAt as any).mockReturnValue(mockAnnotation);
      (mockSelectionProxy.evalSelectAction as any).mockReturnValue(UserSelectAction.SELECT);

      // Set hover.getCurrent to return the same id as the annotation
      currentHoverId = 'test-annotation';

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // Since hoverProxy.getCurrent() already equals the hit id, set should NOT be called
      expect(mockHoverProxy.set).not.toHaveBeenCalled();
      expect(mockOnHoverChange).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it('should clear hover and call onHoverChange(null) when no hit (r-hover-006)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Set initial hovered state
      currentHoverId = 'some-annotation';

      // Mock storeProxy.getAt to return null (no hit)
      (mockStoreProxy.getAt as any).mockReturnValue(null);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // When no hit and hover.getCurrent() exists
      expect(mockHoverProxy.set).toHaveBeenCalledWith(null);
      expect(mockOnHoverChange).toHaveBeenCalledWith(null);

      renderer.destroy();
    });

    it('should only clear hover when hoverProxy.getCurrent() exists (r-hover-007)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Ensure hover.getCurrent() returns null (no current hover)
      currentHoverId = null;

      // Mock storeProxy.getAt to return null (no hit)
      (mockStoreProxy.getAt as any).mockReturnValue(null);

      const pointerMoveEvent = new (global.PointerEvent || MouseEvent)('pointermove', {
        bubbles: true,
        clientX: 150,
        clientY: 100
      });
      container.dispatchEvent(pointerMoveEvent);

      // Since hoverProxy.getCurrent() is null, set should NOT be called
      expect(mockHoverProxy.set).not.toHaveBeenCalled();
      expect(mockOnHoverChange).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it('should add pointermove listener to container (r-hover-008)', () => {
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));

      addEventListenerSpy.mockRestore();
      renderer.destroy();
    });
  });

  describe('redraw', () => {
    it('should be debounced at 10ms (r-redraw-001)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

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

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();
      rafMock.mockClear();

      renderer.redraw();

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 15));

      expect(rafMock).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should call painter.clear() when painter exists (r-redraw-003)', async () => {
      const mockPainter = {
        clear: vi.fn(),
        reset: vi.fn()
      };

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Set the painter
      renderer.setPainter(mockPainter as any);

      // Reset any calls from setPainter
      vi.clearAllMocks();
      mockPainter.clear.mockClear();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockPainter.clear).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should call getViewportBounds with container (r-redraw-004)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // getViewportBounds uses: minX = -left, minY = -top
      // Container is at left: 100, top: 50
      expect(mockStoreProxy.getIntersecting).toHaveBeenCalled();
      const call = (mockStoreProxy.getIntersecting as any).mock.calls[0];
      expect(call[0]).toBe(-100); // minX = -left
      expect(call[1]).toBe(-50);  // minY = -top

      renderer.destroy();
    });

    it('should call storeProxy.getIntersecting with viewport bounds (r-redraw-005)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockStoreProxy.getIntersecting).toHaveBeenCalled();
      const call = (mockStoreProxy.getIntersecting as any).mock.calls[0];
      // Should have 4 arguments: minX, minY, maxX, maxY
      expect(call.length).toBe(4);
      expect(typeof call[0]).toBe('number'); // minX
      expect(typeof call[1]).toBe('number'); // minY
      expect(typeof call[2]).toBe('number'); // maxX
      expect(typeof call[3]).toBe('number'); // maxY

      renderer.destroy();
    });

    it('should apply currentFilter to intersecting annotations (r-redraw-006)', async () => {
      const mockAnnotation1 = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      const mockAnnotation2 = { annotation: { id: 'ann-2', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation1, mockAnnotation2]);

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Set a filter that only allows ann-1
      const testFilter = vi.fn((annotation: TextAnnotation) => annotation.id === 'ann-1');
      renderer.setFilter(testFilter);

      // Reset any calls from setFilter
      vi.clearAllMocks();
      testFilter.mockClear();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(testFilter).toHaveBeenCalled();

      // renderer.redraw should receive filtered results (only ann-1)
      const redrawCall = (mockRendererImpl.redraw as any).mock.calls[0];
      const highlights = redrawCall[0];
      expect(highlights.length).toBe(1);
      expect(highlights[0].annotation.id).toBe('ann-1');

      renderer.destroy();
    });

    it('should get selectedIds from selectionProxy.getSelected (r-redraw-007)', async () => {
      const mockAnnotation = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation]);
      (mockSelectionProxy.getSelected as any).mockReturnValue([{ id: 'ann-1' }]);

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // The highlight should have selected: true since its id is in selectedIds
      const redrawCall = (mockRendererImpl.redraw as any).mock.calls[0];
      const highlights = redrawCall[0];
      expect(highlights[0].state.selected).toBe(true);

      renderer.destroy();
    });

    it('should create Highlight objects with annotation, rects, and state (r-redraw-008)', async () => {
      const mockRects = [{ x: 0, y: 0, width: 100, height: 20 }];
      const mockAnnotation = { annotation: { id: 'ann-1', target: {} }, rects: mockRects };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation]);

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      const redrawCall = (mockRendererImpl.redraw as any).mock.calls[0];
      const highlights = redrawCall[0];

      expect(highlights.length).toBe(1);
      expect(highlights[0].annotation).toBeDefined();
      expect(highlights[0].annotation.id).toBe('ann-1');
      expect(highlights[0].rects).toEqual(mockRects);
      expect(highlights[0].state).toBeDefined();
      expect(highlights[0].state.selected).toBeDefined();
      expect(highlights[0].state.hovered).toBeDefined();

      renderer.destroy();
    });

    it('should set selected state based on selectedIds (r-redraw-009)', async () => {
      const mockAnnotation1 = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      const mockAnnotation2 = { annotation: { id: 'ann-2', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation1, mockAnnotation2]);
      // Only ann-1 is selected
      (mockSelectionProxy.getSelected as any).mockReturnValue([{ id: 'ann-1' }]);

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      const redrawCall = (mockRendererImpl.redraw as any).mock.calls[0];
      const highlights = redrawCall[0];

      const highlight1 = highlights.find((h: any) => h.annotation.id === 'ann-1');
      const highlight2 = highlights.find((h: any) => h.annotation.id === 'ann-2');

      expect(highlight1.state.selected).toBe(true);
      expect(highlight2.state.selected).toBe(false);

      renderer.destroy();
    });

    it('should set hovered state based on hoverProxy.getCurrent (r-redraw-010)', async () => {
      const mockAnnotation1 = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      const mockAnnotation2 = { annotation: { id: 'ann-2', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation1, mockAnnotation2]);
      // Only ann-1 is hovered
      currentHoverId = 'ann-1';

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      const redrawCall = (mockRendererImpl.redraw as any).mock.calls[0];
      const highlights = redrawCall[0];

      const highlight1 = highlights.find((h: any) => h.annotation.id === 'ann-1');
      const highlight2 = highlights.find((h: any) => h.annotation.id === 'ann-2');

      expect(highlight1.state.hovered).toBe(true);
      expect(highlight2.state.hovered).toBe(false);

      renderer.destroy();
    });

    it('should call renderer.redraw with highlights, bounds, style, painter, lazy (r-redraw-011)', async () => {
      const mockAnnotation = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation]);

      const mockPainter = { clear: vi.fn(), reset: vi.fn() };

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );
      renderer.setPainter(mockPainter as any);
      renderer.setStyle({ fill: 'blue' } as any);

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockRendererImpl.redraw).toHaveBeenCalled();
      const call = (mockRendererImpl.redraw as any).mock.calls[0];

      // First arg: highlights array
      expect(Array.isArray(call[0])).toBe(true);
      // Second arg: bounds object
      expect(call[1]).toBeDefined();
      expect(call[1].minX).toBeDefined();
      expect(call[1].maxX).toBeDefined();
      // Third arg: style
      expect(call[2]).toEqual({ fill: 'blue' });
      // Fourth arg: painter
      expect(call[3]).toBe(mockPainter);
      // Fifth arg: lazy flag (default false)
      expect(typeof call[4]).toBe('boolean');

      renderer.destroy();
    });

    it('should call onViewportChange with annotation ids after 1ms delay (r-redraw-012)', async () => {
      const mockAnnotation1 = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      const mockAnnotation2 = { annotation: { id: 'ann-2', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation1, mockAnnotation2]);

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      renderer.redraw();

      // Wait for debounce + requestAnimationFrame + 1ms setTimeout
      await new Promise(resolve => setTimeout(resolve, 35));

      // onViewportChange should be called with annotation ids
      expect(mockOnViewportChange).toHaveBeenCalledWith(['ann-1', 'ann-2']);

      renderer.destroy();
    });
  });

  describe('setPainter', () => {
    it('should update currentPainter (r-set-painter-001)', async () => {
      const mockPainter = { clear: vi.fn(), reset: vi.fn() };

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.setPainter(mockPainter as any);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // The painter should be passed to renderer.redraw
      const call = (mockRendererImpl.redraw as any).mock.calls.pop();
      expect(call[3]).toBe(mockPainter);

      renderer.destroy();
    });

    it('should trigger redraw (r-set-painter-002)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      const mockPainter = { clear: vi.fn(), reset: vi.fn() };
      renderer.setPainter(mockPainter as any);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockRendererImpl.redraw).toHaveBeenCalled();

      renderer.destroy();
    });
  });

  describe('setStyle', () => {
    it('should update currentStyle (r-set-style-001)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      const testStyle = { fill: 'red', opacity: 0.5 };
      renderer.setStyle(testStyle as any);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // The style should be passed to renderer.redraw
      const call = (mockRendererImpl.redraw as any).mock.calls.pop();
      expect(call[2]).toEqual(testStyle);

      renderer.destroy();
    });

    it('should trigger redraw (r-set-style-002)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      const testStyle = { fill: 'green', opacity: 0.8 };
      renderer.setStyle(testStyle as any);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockRendererImpl.redraw).toHaveBeenCalled();

      renderer.destroy();
    });
  });

  describe('setFilter', () => {
    it('should update currentFilter (r-set-filter-001)', async () => {
      const mockAnnotation1 = { annotation: { id: 'ann-1', target: {} }, rects: [] };
      const mockAnnotation2 = { annotation: { id: 'ann-2', target: {} }, rects: [] };
      (mockStoreProxy.getIntersecting as any).mockReturnValue([mockAnnotation1, mockAnnotation2]);

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Set a filter that only allows ann-2
      const testFilter = (annotation: TextAnnotation) => annotation.id === 'ann-2';
      renderer.setFilter(testFilter);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // The filter should be applied during redraw, filtering out ann-1
      const call = (mockRendererImpl.redraw as any).mock.calls.pop();
      const highlights = call[0];
      expect(highlights.length).toBe(1);
      expect(highlights[0].annotation.id).toBe('ann-2');

      renderer.destroy();
    });

    it('should trigger non-lazy redraw (false) (r-set-filter-002)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      const testFilter = (annotation: TextAnnotation) => annotation.id === 'test';
      renderer.setFilter(testFilter);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockRendererImpl.redraw).toHaveBeenCalled();
      // Check that the lazy flag (5th argument) is false
      const call = (mockRendererImpl.redraw as any).mock.calls.pop();
      expect(call[4]).toBe(false);

      renderer.destroy();
    });
  });

  describe('Observers', () => {
    it('should observe store changes and trigger redraw (r-observe-001)', async () => {
      // Capture the callback passed to storeProxy.observeStore
      let storeObserveCallback: (() => void) | undefined;
      (mockStoreProxy.observeStore as any).mockImplementation((cb: () => void) => {
        storeObserveCallback = cb;
        return storeUnsubscribe;
      });

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(mockStoreProxy.observeStore).toHaveBeenCalled();
      expect(storeObserveCallback).toBeDefined();

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Trigger the store change callback
      storeObserveCallback!();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // redraw should have been called
      expect(mockRendererImpl.redraw).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should subscribe to selection changes and trigger redraw (r-observe-002)', async () => {
      // Capture the callback passed to selectionProxy.subscribe
      let selectionCallback: (() => void) | undefined;
      (mockSelectionProxy.subscribe as any).mockImplementation((cb: () => void) => {
        selectionCallback = cb;
        return selectionUnsubscribe;
      });

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(mockSelectionProxy.subscribe).toHaveBeenCalled();
      expect(selectionCallback).toBeDefined();

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Trigger the selection change callback
      selectionCallback!();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // redraw should have been called
      expect(mockRendererImpl.redraw).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should subscribe to hover changes and trigger redraw (r-observe-003)', async () => {
      // Capture the callback passed to hoverProxy.subscribe
      let hoverCallback: (() => void) | undefined;
      (mockHoverProxy.subscribe as any).mockImplementation((cb: () => void) => {
        hoverCallback = cb;
        return hoverUnsubscribe;
      });

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(mockHoverProxy.subscribe).toHaveBeenCalled();
      expect(hoverCallback).toBeDefined();

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Trigger the hover change callback
      hoverCallback!();

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      // redraw should have been called
      expect(mockRendererImpl.redraw).toHaveBeenCalled();

      renderer.destroy();
    });
  });

  describe('Scroll', () => {
    it('should trigger lazy redraw (true) on scroll (r-scroll-001)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Dispatch a scroll event on document
      const scrollEvent = new Event('scroll', { bubbles: true });
      document.dispatchEvent(scrollEvent);

      // Wait for debounce + requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockRendererImpl.redraw).toHaveBeenCalled();
      // Check that the lazy flag (5th argument) is true
      const call = (mockRendererImpl.redraw as any).mock.calls.pop();
      expect(call[4]).toBe(true);

      renderer.destroy();
    });

    it('should add scroll listener to document with capture and passive (r-scroll-002)', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { capture: true, passive: true }
      );

      addEventListenerSpy.mockRestore();
      renderer.destroy();
    });
  });

  describe('Resize', () => {
    it('should be debounced at 10ms (r-resize-001)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Dispatch multiple resize events in rapid succession
      const resizeEvent1 = new Event('resize');
      const resizeEvent2 = new Event('resize');
      const resizeEvent3 = new Event('resize');
      window.dispatchEvent(resizeEvent1);
      window.dispatchEvent(resizeEvent2);
      window.dispatchEvent(resizeEvent3);

      // Wait a short time (less than debounce)
      await new Promise(resolve => setTimeout(resolve, 5));

      // storeProxy.recalculatePositions should not have been called yet (still debouncing)
      expect(mockStoreProxy.recalculatePositions).not.toHaveBeenCalled();

      // Wait for debounce to complete (10ms debounce + requestAnimationFrame)
      await new Promise(resolve => setTimeout(resolve, 30));

      // Now it should have been called exactly once (debounced to single call)
      expect(mockStoreProxy.recalculatePositions).toHaveBeenCalledTimes(1);

      renderer.destroy();
    });

    it('should call storeProxy.recalculatePositions (r-resize-002)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockStoreProxy.recalculatePositions).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should call painter.reset when painter exists (r-resize-003)', async () => {
      const mockPainter = {
        clear: vi.fn(),
        reset: vi.fn()
      };

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Set the painter
      renderer.setPainter(mockPainter as any);

      // Reset any calls from setPainter
      vi.clearAllMocks();
      mockPainter.reset.mockClear();

      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockPainter.reset).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should trigger redraw (r-resize-004)', async () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(mockRendererImpl.redraw).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should add resize listener to window (r-resize-005)', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      addEventListenerSpy.mockRestore();
      renderer.destroy();
    });

    it('should create ResizeObserver for container (r-resize-006)', () => {
      // Track ResizeObserver constructor calls
      const mockObserve = vi.fn();
      class MockResizeObserver {
        observe = mockObserve;
        disconnect = vi.fn();
        unobserve = vi.fn();
      }
      global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(mockObserve).toHaveBeenCalledWith(container);

      renderer.destroy();
    });
  });

  describe('MutationObserver', () => {
    it('should be debounced at 150ms (r-mutation-001)', async () => {
      // Capture the MutationObserver callback
      let mutationCallback: MutationCallback | undefined;
      class MockMutationObserver {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: MutationCallback) {
          mutationCallback = callback;
        }
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Create a mock mutation record (external mutation - not from container)
      const mockRecord = {
        target: document.body
      } as unknown as MutationRecord;

      // Trigger the callback multiple times
      mutationCallback!([ mockRecord ], {} as MutationObserver);
      mutationCallback!([ mockRecord ], {} as MutationObserver);
      mutationCallback!([ mockRecord ], {} as MutationObserver);

      // Wait a short time (less than 150ms debounce)
      await new Promise(resolve => setTimeout(resolve, 50));

      // rendererImpl.redraw should not have been called yet (still debouncing)
      expect(mockRendererImpl.redraw).not.toHaveBeenCalled();

      // Wait for debounce to complete (150ms debounce + requestAnimationFrame)
      await new Promise(resolve => setTimeout(resolve, 130));

      // Now it should have been called exactly once (debounced to single call)
      expect(mockRendererImpl.redraw).toHaveBeenCalledTimes(1);

      renderer.destroy();
    });

    it('should detect internal mutations (target is container or descendant) (r-mutation-002)', async () => {
      // Capture the MutationObserver callback
      let mutationCallback: MutationCallback | undefined;
      class MockMutationObserver {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: MutationCallback) {
          mutationCallback = callback;
        }
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Create a mock mutation record where the target IS the container (internal mutation)
      const mockInternalRecord = {
        target: container
      } as unknown as MutationRecord;

      // Trigger the callback with internal mutation
      mutationCallback!([ mockInternalRecord ], {} as MutationObserver);

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 180));

      // redraw should NOT be called for internal mutations (isInternal is true)
      expect(mockRendererImpl.redraw).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it('should trigger lazy redraw only for external mutations (r-mutation-003)', async () => {
      // Capture the MutationObserver callback
      let mutationCallback: MutationCallback | undefined;
      class MockMutationObserver {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: MutationCallback) {
          mutationCallback = callback;
        }
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      // Reset any calls from initialization
      vi.clearAllMocks();

      // Create a mock mutation record where the target is NOT the container (external mutation)
      const mockExternalRecord = {
        target: document.body
      } as unknown as MutationRecord;

      // Trigger the callback with external mutation
      mutationCallback!([ mockExternalRecord ], {} as MutationObserver);

      // Wait for debounce to complete (150ms debounce + requestAnimationFrame)
      await new Promise(resolve => setTimeout(resolve, 180));

      // redraw should be called with lazy=true for external mutations
      expect(mockRendererImpl.redraw).toHaveBeenCalled();
      const call = (mockRendererImpl.redraw as any).mock.calls.pop();
      expect(call[4]).toBe(true); // lazy flag should be true

      renderer.destroy();
    });

    it('should observe document.body (r-mutation-004)', () => {
      // Track MutationObserver observe calls
      const mockObserve = vi.fn();
      class MockMutationObserver {
        observe = mockObserve;
        disconnect = vi.fn();
        constructor(callback: MutationCallback) {}
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(mockObserve).toHaveBeenCalledWith(document.body, expect.any(Object));

      renderer.destroy();
    });

    it('should use attributes, childList, subtree config (r-mutation-005)', () => {
      // Track MutationObserver observe calls
      const mockObserve = vi.fn();
      class MockMutationObserver {
        observe = mockObserve;
        disconnect = vi.fn();
        constructor(callback: MutationCallback) {}
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(mockObserve).toHaveBeenCalledWith(
        expect.any(Object),
        { attributes: true, childList: true, subtree: true }
      );

      renderer.destroy();
    });
  });

  describe('destroy', () => {
    it('should remove pointermove listener from container (r-destroy-001)', () => {
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should call renderer.destroy() (r-destroy-002)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(mockRendererImpl.destroy).toHaveBeenCalled();
    });

    it('should unsubscribe from store changes (r-destroy-003)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(storeUnsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from selection (r-destroy-004)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(selectionUnsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from hover (r-destroy-005)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(hoverUnsubscribe).toHaveBeenCalled();
    });

    it('should remove scroll listener from document (r-destroy-006)', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should remove resize listener from window (r-destroy-007)', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should disconnect ResizeObserver (r-destroy-008)', () => {
      // Track ResizeObserver disconnect
      const mockDisconnect = vi.fn();
      class MockResizeObserver {
        observe = vi.fn();
        disconnect = mockDisconnect;
        unobserve = vi.fn();
      }
      global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should disconnect MutationObserver (r-destroy-009)', () => {
      // Track MutationObserver disconnect
      const mockDisconnect = vi.fn();
      class MockMutationObserver {
        observe = vi.fn();
        disconnect = mockDisconnect;
        constructor(callback: MutationCallback) {}
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      renderer.destroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('ReturnValue', () => {
    it('should return object with destroy method (r-return-001)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(renderer).toHaveProperty('destroy');
      expect(typeof renderer.destroy).toBe('function');
    });

    it('should return object with redraw method (r-return-002)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(renderer).toHaveProperty('redraw');
      expect(typeof renderer.redraw).toBe('function');
    });

    it('should return object with setStyle method (r-return-003)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(renderer).toHaveProperty('setStyle');
      expect(typeof renderer.setStyle).toBe('function');
    });

    it('should return object with setFilter method (r-return-004)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(renderer).toHaveProperty('setFilter');
      expect(typeof renderer.setFilter).toBe('function');
    });

    it('should return object with setPainter method (r-return-005)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(renderer).toHaveProperty('setPainter');
      expect(typeof renderer.setPainter).toBe('function');
    });

    it('should delegate setVisible to renderer.setVisible (r-return-006)', () => {
      const renderer = createBaseRenderer(
        container, mockStoreProxy, mockSelectionProxy, mockHoverProxy,
        mockRendererImpl, mockOnHoverChange, mockOnViewportChange
      );

      expect(renderer).toHaveProperty('setVisible');
      expect(renderer.setVisible).toBe(mockRendererImpl.setVisible);
    });
  });
});
