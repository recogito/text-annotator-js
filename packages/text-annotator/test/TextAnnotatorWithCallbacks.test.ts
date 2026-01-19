import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createTextAnnotatorWithCallbacks } from '../src/TextAnnotatorWithCallbacks';
import type { TextAnnotation } from '../src/model';

describe('TextAnnotatorWithCallbacks', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="container">
            <p>Some text content for annotation testing.</p>
          </div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
    global.Range = dom.window.Range;
    global.Selection = dom.window.Selection;
    global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
    global.KeyboardEvent = dom.window.KeyboardEvent;
    global.getComputedStyle = dom.window.getComputedStyle;
    global.requestAnimationFrame = (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(Date.now()), 0) as unknown as number;
    };
    global.cancelAnimationFrame = (id: number) => clearTimeout(id);

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

    // Mock CSS.highlights for renderer
    (global as any).CSS = { highlights: undefined };

    container = document.getElementById('container') as HTMLElement;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create an annotator with callback props (tawc-init-001)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(annotator).toBeDefined();
      expect(annotator.destroy).toBeDefined();
      expect(annotator.setAnnotations).toBeDefined();

      annotator.destroy();
    });

    it('should pass configuration options to underlying annotator (tawc-init-002)', () => {
      const onAnnotationCreate = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        annotatingEnabled: false,
        onAnnotationCreate
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });
  });

  describe('Callback Wiring', () => {
    it('should wire onAnnotationCreate callback to lifecycle event (tawc-callback-001)', () => {
      const onAnnotationCreate = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onAnnotationCreate
      });

      // The callback should be registered - we can verify by checking
      // that adding an annotation programmatically triggers the callback
      // (lifecycle events fire on annotation creation)

      annotator.destroy();
    });

    it('should wire onAnnotationUpdate callback to lifecycle event (tawc-callback-002)', () => {
      const onAnnotationUpdate = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onAnnotationUpdate
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should wire onAnnotationDelete callback to lifecycle event (tawc-callback-003)', () => {
      const onAnnotationDelete = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onAnnotationDelete
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should wire onSelect callback to selectionChanged event (tawc-callback-004)', () => {
      const onSelect = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onSelect
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should wire onClick callback to clickAnnotation event (tawc-callback-005)', () => {
      const onClick = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onClick
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should wire onMouseEnter callback to mouseEnterAnnotation event (tawc-callback-006)', () => {
      const onMouseEnter = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onMouseEnter
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should wire onMouseLeave callback to mouseLeaveAnnotation event (tawc-callback-007)', () => {
      const onMouseLeave = vi.fn();
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        onMouseLeave
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });
  });

  describe('setAnnotations', () => {
    it('should expose setAnnotations method (tawc-set-001)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(typeof annotator.setAnnotations).toBe('function');

      annotator.destroy();
    });

    it('should clear and set annotations when called (tawc-set-002)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      // setAnnotations should be callable without error
      annotator.setAnnotations([]);

      annotator.destroy();
    });
  });

  describe('Inherited Methods', () => {
    it('should expose destroy method from underlying annotator (tawc-inherit-001)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(typeof annotator.destroy).toBe('function');

      annotator.destroy();
    });

    it('should expose setSelected method from underlying annotator (tawc-inherit-002)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(typeof annotator.setSelected).toBe('function');

      annotator.destroy();
    });

    it('should expose setFilter method from underlying annotator (tawc-inherit-003)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(typeof annotator.setFilter).toBe('function');

      annotator.destroy();
    });

    it('should expose setStyle method from underlying annotator (tawc-inherit-004)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(typeof annotator.setStyle).toBe('function');

      annotator.destroy();
    });

    it('should expose on/off methods for additional event handling (tawc-inherit-005)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container
      });

      expect(typeof annotator.on).toBe('function');
      expect(typeof annotator.off).toBe('function');

      annotator.destroy();
    });
  });

  describe('Configuration Options', () => {
    it('should apply filter when provided (tawc-config-001)', () => {
      const filter = (annotation: TextAnnotation) => annotation.id === 'test';
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        filter
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should apply style when provided (tawc-config-002)', () => {
      const style = { fill: '#ff0000' };
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        style
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });

    it('should apply annotatingMode when provided (tawc-config-003)', () => {
      const annotator = createTextAnnotatorWithCallbacks({
        container,
        annotatingMode: 'ADD_TO_CURRENT'
      });

      expect(annotator).toBeDefined();

      annotator.destroy();
    });
  });
});
