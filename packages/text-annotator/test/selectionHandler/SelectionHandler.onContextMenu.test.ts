import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - onContextMenu', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return early when selection is collapsed (sh-ctx-menu-001)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockSelection = {
      isCollapsed: true,
      anchorNode: ctx.container,
      rangeCount: 0,
      getRangeAt: vi.fn()
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const contextMenuEvent = new (global.PointerEvent || MouseEvent)('contextmenu', {
      bubbles: true,
      button: 2,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(contextMenuEvent, 'target', { value: ctx.container });
    document.dispatchEvent(contextMenuEvent);

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should emulate selectstart when currentTarget has no selectors (sh-ctx-menu-002)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const range = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 4);
    }

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn().mockReturnValue(range)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const contextMenuEvent = new (global.PointerEvent || MouseEvent)('contextmenu', {
      bubbles: true,
      button: 2,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(contextMenuEvent, 'target', { value: ctx.container });
    document.dispatchEvent(contextMenuEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should return early when selection couldn\'t be initiated (sh-ctx-menu-003)', async () => {
    const notAnnotatable = document.createElement('div');
    notAnnotatable.className = 'not-annotatable';
    notAnnotatable.textContent = 'Not annotatable text';
    ctx.container.appendChild(notAnnotatable);

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const range = document.createRange();
    const textNode = notAnnotatable.firstChild;
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 5);
    }

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn().mockReturnValue(range)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const contextMenuEvent = new (global.PointerEvent || MouseEvent)('contextmenu', {
      bubbles: true,
      button: 2,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(contextMenuEvent, 'target', { value: notAnnotatable });
    document.dispatchEvent(contextMenuEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
    notAnnotatable.remove();
  });

  it('should call upsertCurrentTarget (sh-ctx-menu-004)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const range = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 4);
    }

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn().mockReturnValue(range)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const contextMenuEvent = new (global.PointerEvent || MouseEvent)('contextmenu', {
      bubbles: true,
      button: 2,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(contextMenuEvent, 'target', { value: ctx.container });
    document.dispatchEvent(contextMenuEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should call selection.userSelect with cloned event (sh-ctx-menu-005)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const range = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 4);
    }

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn().mockReturnValue(range)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const contextMenuEvent = new (global.PointerEvent || MouseEvent)('contextmenu', {
      bubbles: true,
      button: 2,
      clientX: 150,
      clientY: 200
    });
    Object.defineProperty(contextMenuEvent, 'target', { value: ctx.container });
    document.dispatchEvent(contextMenuEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.selection.userSelect).toHaveBeenCalled();
    const userSelectCall = (ctx.mockState.selection.userSelect as any).mock.calls[0];
    expect(typeof userSelectCall[0]).toBe('string');
    const clonedEvent = userSelectCall[1];
    expect(clonedEvent.clientX).toBe(150);
    expect(clonedEvent.clientY).toBe(200);
    expect(clonedEvent.button).toBe(2);

    document.getSelection = originalGetSelection;

    handler.destroy();
  });
});
