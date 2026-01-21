import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

/**
 * These tests verify that SelectionHandler works as a standalone component
 * by testing its contract with the proxy interfaces (StoreProxy, SelectionProxy)
 * and the onClickAnnotation callback.
 *
 * The tests focus on:
 * 1. StoreProxy reads (getAnnotation, getAt)
 * 2. StoreProxy writes (addAnnotation, updateTarget, deleteAnnotation)
 * 3. SelectionProxy reads (getSelected)
 * 4. SelectionProxy writes (clear, userSelect)
 * 5. onClickAnnotation callback invocation
 * 6. Call ordering between proxies
 */
describe('SelectionHandler - Standalone Proxy Contract', () => {
  let ctx: SelectionHandlerTestContext;
  let callOrder: string[];

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
    callOrder = [];

    // Wrap proxy methods to track call order
    const originalGetAnnotation = ctx.mockStoreProxy.getAnnotation;
    ctx.mockStoreProxy.getAnnotation = vi.fn((...args) => {
      callOrder.push('storeProxy.getAnnotation');
      return originalGetAnnotation(...args);
    });

    const originalAddAnnotation = ctx.mockStoreProxy.addAnnotation;
    ctx.mockStoreProxy.addAnnotation = vi.fn((...args) => {
      callOrder.push('storeProxy.addAnnotation');
      return originalAddAnnotation(...args);
    });

    const originalUpdateTarget = ctx.mockStoreProxy.updateTarget;
    ctx.mockStoreProxy.updateTarget = vi.fn((...args) => {
      callOrder.push('storeProxy.updateTarget');
      return originalUpdateTarget(...args);
    });

    const originalDeleteAnnotation = ctx.mockStoreProxy.deleteAnnotation;
    ctx.mockStoreProxy.deleteAnnotation = vi.fn((...args) => {
      callOrder.push('storeProxy.deleteAnnotation');
      return originalDeleteAnnotation(...args);
    });

    const originalGetAt = ctx.mockStoreProxy.getAt;
    ctx.mockStoreProxy.getAt = vi.fn((...args) => {
      callOrder.push('storeProxy.getAt');
      return originalGetAt(...args);
    });

    const originalGetSelected = ctx.mockSelectionProxy.getSelected;
    ctx.mockSelectionProxy.getSelected = vi.fn((...args) => {
      callOrder.push('selectionProxy.getSelected');
      return originalGetSelected(...args);
    });

    const originalClear = ctx.mockSelectionProxy.clear;
    ctx.mockSelectionProxy.clear = vi.fn((...args) => {
      callOrder.push('selectionProxy.clear');
      return originalClear(...args);
    });

    const originalUserSelect = ctx.mockSelectionProxy.userSelect;
    ctx.mockSelectionProxy.userSelect = vi.fn((...args) => {
      callOrder.push('selectionProxy.userSelect');
      return originalUserSelect(...args);
    });

    const originalOnClick = ctx.mockOnClickAnnotation;
    ctx.mockOnClickAnnotation = vi.fn((...args) => {
      callOrder.push('onClickAnnotation');
      return originalOnClick(...args);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('StoreProxy Reads', () => {
    it('should call storeProxy.getAnnotation in onSelectStart when checking for existing (sh-standalone-001)', async () => {
      // Setup: user has an editable annotation selected
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'existing-annotation', editable: true }
      ]);
      ctx.mockStoreProxy.getAnnotation = vi.fn().mockReturnValue({
        id: 'existing-annotation',
        target: { selector: [] }
      });

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      // Set mode to REPLACE_CURRENT so getAnnotation is called to check for existing
      handler.setAnnotatingMode('REPLACE_CURRENT');

      // Trigger pointerdown to set lastDownEvent
      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      // Trigger selectstart
      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      expect(ctx.mockStoreProxy.getAnnotation).toHaveBeenCalledWith('existing-annotation');

      handler.destroy();
    });

    it('should call storeProxy.getAt with click coordinates in clickSelect (sh-standalone-002)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      // Mock container bounding rect
      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockStoreProxy.getAt).toHaveBeenCalledWith(50, 60, false, undefined);

      handler.destroy();
    });

    it('should pass selectionMode=all to storeProxy.getAt (sh-standalone-003)', async () => {
      const optionsWithSelectionMode = {
        ...ctx.mockOptions,
        selectionMode: 'all' as const
      };
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, optionsWithSelectionMode, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockStoreProxy.getAt).toHaveBeenCalledWith(50, 60, true, undefined);

      handler.destroy();
    });
  });

  describe('StoreProxy Writes', () => {
    it('should call storeProxy.addAnnotation when annotation does not exist (sh-standalone-004)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      // Setup: annotation doesn't exist
      ctx.mockStoreProxy.getAnnotation = vi.fn().mockReturnValue(undefined);

      // Setup DOM selection
      const textNode = ctx.container.querySelector('p')?.firstChild;
      const range = document.createRange();
      range.setStart(textNode!, 0);
      range.setEnd(textNode!, 5);

      const mockSelection = {
        anchorNode: textNode,
        rangeCount: 1,
        isCollapsed: false,
        getRangeAt: vi.fn().mockReturnValue(range)
      };
      const originalGetSelection = document.getSelection;
      document.getSelection = vi.fn().mockReturnValue(mockSelection);

      // Trigger selection flow
      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent);

      await new Promise(resolve => setTimeout(resolve, 20));

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockStoreProxy.addAnnotation).toHaveBeenCalled();
      const addCall = (ctx.mockStoreProxy.addAnnotation as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(addCall).toHaveProperty('id');
      expect(addCall).toHaveProperty('bodies', []);
      expect(addCall).toHaveProperty('target');

      document.getSelection = originalGetSelection;
      handler.destroy();
    });

    it('should call storeProxy.deleteAnnotation when selection collapses in CREATE_NEW mode (sh-standalone-005)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      // Setup: annotation exists (was just created)
      const mockAnnotation = {
        id: 'test-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAnnotation = vi.fn().mockReturnValue(mockAnnotation);

      // Setup DOM selection - first non-collapsed
      const textNode = ctx.container.querySelector('p')?.firstChild;
      const range = document.createRange();
      range.setStart(textNode!, 0);
      range.setEnd(textNode!, 5);

      let isCollapsed = false;
      const mockSelection = {
        anchorNode: textNode,
        rangeCount: 1,
        get isCollapsed() { return isCollapsed; },
        getRangeAt: vi.fn().mockReturnValue(range)
      };
      const originalGetSelection = document.getSelection;
      document.getSelection = vi.fn().mockReturnValue(mockSelection);

      // Trigger selection start
      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      const selectionChangeEvent1 = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent1);

      await new Promise(resolve => setTimeout(resolve, 20));

      // Now collapse the selection
      isCollapsed = true;
      const selectionChangeEvent2 = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent2);

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(ctx.mockStoreProxy.deleteAnnotation).toHaveBeenCalled();

      document.getSelection = originalGetSelection;
      handler.destroy();
    });

    it('should NOT call storeProxy.deleteAnnotation in ADD_TO_CURRENT mode (sh-standalone-006)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);
      handler.setAnnotatingMode('ADD_TO_CURRENT');

      // Setup: annotation exists and user is modifying it
      const mockAnnotation = {
        id: 'test-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAnnotation = vi.fn().mockReturnValue(mockAnnotation);
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'test-annotation', editable: true }
      ]);

      // Setup DOM selection
      const textNode = ctx.container.querySelector('p')?.firstChild;
      const range = document.createRange();
      range.setStart(textNode!, 0);
      range.setEnd(textNode!, 5);

      let isCollapsed = false;
      const mockSelection = {
        anchorNode: textNode,
        rangeCount: 1,
        get isCollapsed() { return isCollapsed; },
        getRangeAt: vi.fn().mockReturnValue(range)
      };
      const originalGetSelection = document.getSelection;
      document.getSelection = vi.fn().mockReturnValue(mockSelection);

      // Trigger selection start
      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      const selectionChangeEvent1 = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent1);

      await new Promise(resolve => setTimeout(resolve, 20));

      // Collapse
      isCollapsed = true;
      const selectionChangeEvent2 = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent2);

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(ctx.mockStoreProxy.deleteAnnotation).not.toHaveBeenCalled();

      document.getSelection = originalGetSelection;
      handler.destroy();
    });
  });

  describe('SelectionProxy Reads', () => {
    it('should call selectionProxy.getSelected in onSelectStart (sh-standalone-007)', async () => {
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

      expect(ctx.mockSelectionProxy.getSelected).toHaveBeenCalled();

      handler.destroy();
    });

    it('should call selectionProxy.getSelected in clickSelect to detect changes (sh-standalone-008)', async () => {
      const mockAnnotation = {
        id: 'clicked-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAt = vi.fn().mockReturnValue(mockAnnotation);
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      // getSelected should be called in clickSelect
      expect(ctx.mockSelectionProxy.getSelected).toHaveBeenCalled();

      handler.destroy();
    });
  });

  describe('SelectionProxy Writes', () => {
    it('should call selectionProxy.clear when clicking empty area (sh-standalone-009)', async () => {
      ctx.mockStoreProxy.getAt = vi.fn().mockReturnValue(undefined); // No annotation at click

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockSelectionProxy.clear).toHaveBeenCalled();

      handler.destroy();
    });

    it('should call selectionProxy.userSelect after clicking annotation (sh-standalone-010)', async () => {
      const mockAnnotation = {
        id: 'clicked-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAt = vi.fn().mockReturnValue(mockAnnotation);
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockSelectionProxy.userSelect).toHaveBeenCalledWith(['clicked-annotation'], expect.anything());

      handler.destroy();
    });
  });

  describe('onClickAnnotation Callback', () => {
    it('should invoke onClickAnnotation when clicking existing annotation (sh-standalone-011)', async () => {
      const mockAnnotation = {
        id: 'clicked-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAt = vi.fn().mockReturnValue(mockAnnotation);
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockOnClickAnnotation).toHaveBeenCalledWith(mockAnnotation);

      handler.destroy();
    });

    it('should NOT invoke onClickAnnotation when selection unchanged (sh-standalone-012)', async () => {
      const mockAnnotation = {
        id: 'already-selected',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAt = vi.fn().mockReturnValue(mockAnnotation);
      // Already selected
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'already-selected', editable: true }
      ]);

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      expect(ctx.mockOnClickAnnotation).not.toHaveBeenCalled();

      handler.destroy();
    });
  });

  describe('Proxy Call Order', () => {
    it('should call selectionProxy.clear before storeProxy.deleteAnnotation (sh-standalone-013)', async () => {
      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      // Setup: annotation exists
      const mockAnnotation = {
        id: 'test-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAnnotation = vi.fn((id) => {
        callOrder.push('storeProxy.getAnnotation');
        return mockAnnotation;
      });

      // Setup DOM selection
      const textNode = ctx.container.querySelector('p')?.firstChild;
      const range = document.createRange();
      range.setStart(textNode!, 0);
      range.setEnd(textNode!, 5);

      let isCollapsed = false;
      const mockSelection = {
        anchorNode: textNode,
        rangeCount: 1,
        get isCollapsed() { return isCollapsed; },
        getRangeAt: vi.fn().mockReturnValue(range)
      };
      const originalGetSelection = document.getSelection;
      document.getSelection = vi.fn().mockReturnValue(mockSelection);

      // Trigger selection start
      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10
      });
      document.dispatchEvent(pointerDownEvent);

      const selectStartEvent = new Event('selectstart', { bubbles: true });
      ctx.container.dispatchEvent(selectStartEvent);

      const selectionChangeEvent1 = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent1);

      await new Promise(resolve => setTimeout(resolve, 20));

      // Clear call order before collapse
      callOrder.length = 0;

      // Collapse
      isCollapsed = true;
      const selectionChangeEvent2 = new Event('selectionchange', { bubbles: true });
      document.dispatchEvent(selectionChangeEvent2);

      await new Promise(resolve => setTimeout(resolve, 20));

      const clearIndex = callOrder.indexOf('selectionProxy.clear');
      const deleteIndex = callOrder.indexOf('storeProxy.deleteAnnotation');

      expect(clearIndex).toBeGreaterThanOrEqual(0);
      expect(deleteIndex).toBeGreaterThanOrEqual(0);
      expect(clearIndex).toBeLessThan(deleteIndex);

      document.getSelection = originalGetSelection;
      handler.destroy();
    });

    it('should call onClickAnnotation before selectionProxy.userSelect (sh-standalone-014)', async () => {
      const mockAnnotation = {
        id: 'clicked-annotation',
        bodies: [],
        target: { selector: [] }
      };
      ctx.mockStoreProxy.getAt = vi.fn((x, y, all, filter) => {
        callOrder.push('storeProxy.getAt');
        return mockAnnotation;
      });
      (ctx.mockSelectionProxy.getSelected as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

      ctx.container.getBoundingClientRect = vi.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100
      });

      // Clear call order
      callOrder.length = 0;

      const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      document.dispatchEvent(pointerDownEvent);

      const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
        bubbles: true,
        button: 0,
        clientX: 50,
        clientY: 60
      });
      Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
      document.dispatchEvent(pointerUpEvent);

      await new Promise(resolve => setTimeout(resolve, 80));

      const clickIndex = callOrder.indexOf('onClickAnnotation');
      const userSelectIndex = callOrder.indexOf('selectionProxy.userSelect');

      expect(clickIndex).toBeGreaterThanOrEqual(0);
      expect(userSelectIndex).toBeGreaterThanOrEqual(0);
      expect(clickIndex).toBeLessThan(userSelectIndex);

      handler.destroy();
    });
  });
});
