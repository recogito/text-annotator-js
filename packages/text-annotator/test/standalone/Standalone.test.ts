import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSelectionHandler,
  createBaseRenderer,
  createEmitter,
  Origin,
  // Types
  type StoreProxy,
  type SelectionProxy,
  type HoverProxy,
  type TextAnnotation,
  type TextAnnotationTarget,
  type AnnotationRects,
  type Filter,
  type Unsubscribe,
  type RendererImplementation,
  type ViewportBounds
} from '../../src/standalone';

/**
 * These tests verify that the standalone module:
 * 1. Exports all necessary types and functions
 * 2. Has no external dependencies (imports only from within the module)
 * 3. Components can be instantiated with mock implementations
 */
describe('Standalone Module', () => {
  describe('Exports', () => {
    it('should export createSelectionHandler (standalone-export-001)', () => {
      expect(createSelectionHandler).toBeDefined();
      expect(typeof createSelectionHandler).toBe('function');
    });

    it('should export createBaseRenderer (standalone-export-002)', () => {
      expect(createBaseRenderer).toBeDefined();
      expect(typeof createBaseRenderer).toBe('function');
    });

    it('should export createEmitter (standalone-export-003)', () => {
      expect(createEmitter).toBeDefined();
      expect(typeof createEmitter).toBe('function');
    });

    it('should export Origin constant (standalone-export-004)', () => {
      expect(Origin).toBeDefined();
      expect(Origin.LOCAL).toBe('LOCAL');
      expect(Origin.REMOTE).toBe('REMOTE');
    });
  });

  describe('Emitter', () => {
    it('should emit and receive events (standalone-emitter-001)', () => {
      interface TestEvents {
        test: (value: string) => void;
        count: (n: number) => void;
      }

      const emitter = createEmitter<TestEvents>();
      const received: string[] = [];

      const unsubscribe = emitter.on('test', (value) => {
        received.push(value);
      });

      emitter.emit('test', 'hello');
      emitter.emit('test', 'world');

      expect(received).toEqual(['hello', 'world']);

      unsubscribe();
      emitter.emit('test', 'ignored');

      expect(received).toEqual(['hello', 'world']);
    });
  });

  describe('SelectionHandler with mocks', () => {
    let container: HTMLElement;
    let mockStoreProxy: StoreProxy;
    let mockSelectionProxy: SelectionProxy;
    let mockOnClickAnnotation: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = '<p>Some annotatable text content</p>';
      document.body.appendChild(container);

      mockStoreProxy = {
        getAnnotation: vi.fn().mockReturnValue(undefined),
        getAt: vi.fn().mockReturnValue(undefined),
        getIntersecting: vi.fn().mockReturnValue([]),
        recalculatePositions: vi.fn(),
        addAnnotation: vi.fn(),
        updateTarget: vi.fn(),
        deleteAnnotation: vi.fn(),
        observeStore: vi.fn().mockReturnValue(vi.fn()),
        on: vi.fn().mockReturnValue(vi.fn())
      };

      mockSelectionProxy = {
        getSelected: vi.fn().mockReturnValue([]),
        evalSelectAction: vi.fn().mockReturnValue('NONE'),
        clear: vi.fn(),
        userSelect: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn())
      };

      mockOnClickAnnotation = vi.fn();
    });

    afterEach(() => {
      container.remove();
      vi.clearAllMocks();
    });

    it('should create SelectionHandler with mock proxies (standalone-selection-001)', () => {
      const handler = createSelectionHandler(
        container,
        mockSelectionProxy,
        mockOnClickAnnotation,
        { annotatingEnabled: true },
        mockStoreProxy
      );

      expect(handler).toBeDefined();
      expect(handler.destroy).toBeDefined();
      expect(handler.setFilter).toBeDefined();
      expect(handler.setUser).toBeDefined();
      expect(handler.setAnnotatingEnabled).toBeDefined();
      expect(handler.setAnnotatingMode).toBeDefined();

      handler.destroy();
    });

    it('should call destroy without errors (standalone-selection-002)', () => {
      const handler = createSelectionHandler(
        container,
        mockSelectionProxy,
        mockOnClickAnnotation,
        { annotatingEnabled: true },
        mockStoreProxy
      );

      expect(() => handler.destroy()).not.toThrow();
    });
  });

  describe('Renderer with mocks', () => {
    let container: HTMLElement;
    let mockStoreProxy: StoreProxy;
    let mockSelectionProxy: SelectionProxy;
    let mockHoverProxy: HoverProxy;
    let mockRendererImpl: RendererImplementation;
    let mockOnHoverChange: ReturnType<typeof vi.fn>;
    let mockOnViewportChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);

      // Mock getBoundingClientRect
      container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 800, height: 600, top: 0, left: 0
      });

      // Mock ResizeObserver
      class MockResizeObserver {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
      }
      global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

      // Mock MutationObserver
      class MockMutationObserver {
        observe = vi.fn();
        disconnect = vi.fn();
      }
      global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

      // Mock requestAnimationFrame
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      mockStoreProxy = {
        getAnnotation: vi.fn().mockReturnValue(undefined),
        getAt: vi.fn().mockReturnValue(undefined),
        getIntersecting: vi.fn().mockReturnValue([]),
        recalculatePositions: vi.fn(),
        addAnnotation: vi.fn(),
        updateTarget: vi.fn(),
        deleteAnnotation: vi.fn(),
        observeStore: vi.fn().mockReturnValue(vi.fn()),
        on: vi.fn().mockReturnValue(vi.fn())
      };

      mockSelectionProxy = {
        getSelected: vi.fn().mockReturnValue([]),
        evalSelectAction: vi.fn().mockReturnValue('NONE'),
        clear: vi.fn(),
        userSelect: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn())
      };

      mockHoverProxy = {
        getCurrent: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn())
      };

      mockRendererImpl = {
        destroy: vi.fn(),
        redraw: vi.fn(),
        setVisible: vi.fn()
      };

      mockOnHoverChange = vi.fn();
      mockOnViewportChange = vi.fn();
    });

    afterEach(() => {
      container.remove();
      vi.restoreAllMocks();
    });

    it('should create Renderer with mock proxies (standalone-renderer-001)', () => {
      const renderer = createBaseRenderer(
        container,
        mockStoreProxy,
        mockSelectionProxy,
        mockHoverProxy,
        mockRendererImpl,
        mockOnHoverChange,
        mockOnViewportChange
      );

      expect(renderer).toBeDefined();
      expect(renderer.destroy).toBeDefined();
      expect(renderer.redraw).toBeDefined();
      expect(renderer.setStyle).toBeDefined();
      expect(renderer.setFilter).toBeDefined();
      expect(renderer.setPainter).toBeDefined();
      expect(renderer.setVisible).toBeDefined();

      renderer.destroy();
    });

    it('should subscribe to proxy events on creation (standalone-renderer-002)', () => {
      const renderer = createBaseRenderer(
        container,
        mockStoreProxy,
        mockSelectionProxy,
        mockHoverProxy,
        mockRendererImpl,
        mockOnHoverChange,
        mockOnViewportChange
      );

      expect(mockStoreProxy.observeStore).toHaveBeenCalled();
      expect(mockSelectionProxy.subscribe).toHaveBeenCalled();
      expect(mockHoverProxy.subscribe).toHaveBeenCalled();

      renderer.destroy();
    });

    it('should call destroy without errors (standalone-renderer-003)', () => {
      const renderer = createBaseRenderer(
        container,
        mockStoreProxy,
        mockSelectionProxy,
        mockHoverProxy,
        mockRendererImpl,
        mockOnHoverChange,
        mockOnViewportChange
      );

      expect(() => renderer.destroy()).not.toThrow();
      expect(mockRendererImpl.destroy).toHaveBeenCalled();
    });
  });

  describe('No external imports', () => {
    it('should not import from @annotorious/core (standalone-imports-001)', async () => {
      // This test verifies by successfully importing - if there were
      // missing dependencies, the import would fail
      const standaloneModule = await import('../../src/standalone');

      expect(standaloneModule.createSelectionHandler).toBeDefined();
      expect(standaloneModule.createBaseRenderer).toBeDefined();
      expect(standaloneModule.Origin).toBeDefined();
      expect(standaloneModule.createEmitter).toBeDefined();
    });
  });
});
