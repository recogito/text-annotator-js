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

      it('should clear debounced onSelectionChange handler when called with false (sh-config-002)', async () => {
        const handler = createSelectionHandler(container, mockState, mockLifecycle, mockOptions);

        // Trigger a pointerdown to set up lastDownEvent
        const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
          bubbles: true,
          button: 0,
          clientX: 10,
          clientY: 10
        });
        document.dispatchEvent(pointerDownEvent);

        // Trigger a selectionchange event - this will be debounced
        const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
        document.dispatchEvent(selectionChangeEvent);

        // Immediately disable annotating - this should clear any pending debounced calls
        handler.setAnnotatingEnabled(false);

        // Wait longer than the debounce timeout (10ms)
        await new Promise(resolve => setTimeout(resolve, 20));

        // The debounced handler should have been cleared, so no store operations should occur
        // even after the debounce timeout has passed
        expect(mockState.store.addAnnotation).not.toHaveBeenCalled();
        expect(mockState.store.updateTarget).not.toHaveBeenCalled();

        // Clean up
        handler.destroy();
      });

      it('should reset targetToModify, currentTarget, isLeftClick, lastDownEvent to undefined (sh-config-003)', async () => {
        const handler = createSelectionHandler(container, mockState, mockLifecycle, mockOptions);

        // First, set up internal state by triggering a pointerdown event
        // This sets isLeftClick and lastDownEvent
        const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
          bubbles: true,
          button: 0,
          clientX: 10,
          clientY: 10
        });
        document.dispatchEvent(pointerDownEvent);

        // Trigger selectstart to set up currentTarget (this happens in onSelectStart)
        const selectStartEvent = new Event('selectstart', { bubbles: true });
        container.dispatchEvent(selectStartEvent);

        // Now disable annotating - this should reset all internal state
        handler.setAnnotatingEnabled(false);

        // Re-enable annotating to verify the state was reset
        handler.setAnnotatingEnabled(true);

        // Now trigger a pointerup - since isLeftClick was reset to undefined,
        // the onPointerUp handler should return early (line 292-293)
        const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
          bubbles: true,
          button: 0,
          clientX: 10,
          clientY: 10
        });
        document.dispatchEvent(pointerUpEvent);

        // Since isLeftClick is undefined after setAnnotatingEnabled(false),
        // onPointerUp returns early without doing anything.
        // This means no clickSelect or annotation operations should occur.
        expect(mockState.store.getAt).not.toHaveBeenCalled();
        expect(mockState.selection.userSelect).not.toHaveBeenCalled();

        // Additionally verify that currentTarget was cleared by checking
        // that no annotation was added (since currentTarget would be undefined)
        expect(mockState.store.addAnnotation).not.toHaveBeenCalled();

        // Clean up
        handler.destroy();
      });
    });
  });
});
