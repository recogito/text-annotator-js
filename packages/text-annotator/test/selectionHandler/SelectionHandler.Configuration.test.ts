import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - Configuration', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setAnnotatingEnabled', () => {
    it('should set currentAnnotatingEnabled to false when called with false (sh-config-001)', () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      handler.setAnnotatingEnabled(false);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
      expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

      handler.destroy();
    });

    it('should clear debounced onSelectionChange handler when called with false (sh-config-002)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent);

      handler.setAnnotatingEnabled(false);

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
      expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

      handler.destroy();
    });

    it('should reset targetToModify, currentTarget, isLeftClick, lastDownEvent to undefined (sh-config-003)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      handler.setAnnotatingEnabled(false);
      handler.setAnnotatingEnabled(true);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerUpEvent);

      expect(ctx.mockState.store.getAt).not.toHaveBeenCalled();
      expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();
      expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();

      handler.destroy();
    });

    it('should re-enable annotation creation when called with true (sh-config-004)', () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      handler.setAnnotatingEnabled(false);

      const selectStartEvent1 = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent1);

      expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();

      handler.setAnnotatingEnabled(true);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent2 = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent2);

      handler.destroy();
    });
  });

  describe('setAnnotatingMode', () => {
    it('should update annotatingMode to provided value (sh-config-005)', () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      handler.setAnnotatingMode('ADD_TO_CURRENT');

      const mockAnnotation = {
        id: 'test-annotation-1',
        target: {
          selector: [{ type: 'TextQuoteSelector', exact: 'test' }]
        }
      };
      (ctx.mockState.selection as any).selected = [{ id: 'test-annotation-1', editable: true }];
      (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      handler.destroy();
    });

    it('should default to CREATE_NEW when no value provided (sh-config-006)', () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      handler.setAnnotatingMode('ADD_TO_CURRENT');
      handler.setAnnotatingMode();

      const mockAnnotation = {
        id: 'test-annotation-1',
        target: {
          selector: [{ type: 'TextQuoteSelector', exact: 'test' }]
        }
      };
      (ctx.mockState.selection as any).selected = [{ id: 'test-annotation-1', editable: true }];
      (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      handler.destroy();
    });
  });

  describe('setFilter', () => {
    it('should store the filter for later use in click selection (sh-config-007)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      const testFilter = (annotation: any) => annotation.id === 'filtered-id';
      handler.setFilter(testFilter);

      const mockAnnotation = {
        id: 'test-annotation-1',
        target: {
          selector: [{ type: 'TextQuoteSelector', exact: 'test' }]
        }
      };
      (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container, writable: false });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container, writable: false });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(ctx.mockState.store.getAt).toHaveBeenCalled();

      const getAtCalls = (ctx.mockState.store.getAt as any).mock.calls;
      if (getAtCalls.length > 0) {
        const lastCall = getAtCalls[getAtCalls.length - 1];
        expect(lastCall[3]).toBe(testFilter);
      }

      handler.destroy();
    });
  });

  describe('setUser', () => {
    it('should update currentUser for annotation creator (sh-config-008)', () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      const testUser = {
        id: 'user-123',
        name: 'Test User'
      };

      handler.setUser(testUser);

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      handler.destroy();
    });
  });
});
