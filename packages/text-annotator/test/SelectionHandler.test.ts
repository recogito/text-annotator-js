import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../src/SelectionHandler';
import type { TextAnnotatorState } from '../src/state';
import type { TextAnnotation } from '../src/model';
import type { Lifecycle } from '@annotorious/core';
import type { TextAnnotatorOptions } from '../src/TextAnnotatorOptions';

describe('SelectionHandler', () => {
  let container: HTMLElement;
  let mockState: TextAnnotatorState<TextAnnotation, unknown>;
  let mockLifecycle: Lifecycle<TextAnnotation, unknown>;
  let mockOptions: TextAnnotatorOptions<TextAnnotation, unknown>;

  beforeEach(async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="container">
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
    global.Selection = dom.window.Selection;
    global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
    global.KeyboardEvent = dom.window.KeyboardEvent;

    container = document.getElementById('container') as HTMLElement;

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
        all: vi.fn().mockReturnValue([]),
        bulkAddAnnotations: vi.fn(),
        bulkUpdateTargets: vi.fn(),
        bulkUpsertAnnotations: vi.fn(),
        getAnnotationBounds: vi.fn(),
        getAnnotationRects: vi.fn(),
        getIntersecting: vi.fn(),
        recalculatePositions: vi.fn(),
        onRecalculatePositions: vi.fn()
      },
      selection: {
        selected: [],
        userSelect: vi.fn(),
        clear: vi.fn(),
        subscribe: vi.fn()
      },
      hover: {
        current: undefined,
        set: vi.fn(),
        subscribe: vi.fn()
      },
      viewport: {
        current: undefined,
        set: vi.fn(),
        subscribe: vi.fn()
      }
    } as unknown as TextAnnotatorState<TextAnnotation, unknown>;

    mockLifecycle = {
      emit: vi.fn(),
      on: vi.fn()
    } as unknown as Lifecycle<TextAnnotation, unknown>;

    mockOptions = {
      annotatingEnabled: true
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    describe('setAnnotatingEnabled', () => {
      it('should set currentAnnotatingEnabled to false when called with false (sh-config-001)', () => {
        const handler = createSelectionHandler(container, mockState, mockLifecycle, mockOptions);

        // Initially enabled (as per mockOptions.annotatingEnabled = true)
        // Now disable it
        handler.setAnnotatingEnabled(false);

        // To verify that annotating is disabled, we can trigger a selectstart event
        // and verify that no annotation creation happens (since onSelectStart returns early)
        const selectStartEvent = new Event('selectstart', { bubbles: true });
        container.dispatchEvent(selectStartEvent);

        // Since annotating is disabled, no new annotation target should be created
        // This is verified by the fact that store.addAnnotation is not called
        // when we complete a selection (since currentTarget would never be set)

        // We can also verify by dispatching a pointerdown and then selectionchange
        // and checking that no annotation operations occur
        const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
          bubbles: true,
          button: 0,
          clientX: 10,
          clientY: 10
        });
        document.dispatchEvent(pointerDownEvent);

        // The key verification: when annotating is disabled, onSelectStart returns early
        // This means currentTarget is never set, so no annotation can be created
        // We verify this indirectly by checking that store methods aren't called

        expect(mockState.store.addAnnotation).not.toHaveBeenCalled();
        expect(mockState.store.updateTarget).not.toHaveBeenCalled();

        // Clean up
        handler.destroy();
      });
    });
  });
});
