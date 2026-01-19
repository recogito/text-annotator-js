import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - onKeyup', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return early when annotating is disabled (sh-keyup-001)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingEnabled(false);

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

    const keyupEvent = new KeyboardEvent('keyup', {
      bubbles: true,
      key: 'Shift'
    });
    ctx.container.dispatchEvent(keyupEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should only process Shift key release (sh-keyup-002)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

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

    await new Promise(resolve => setTimeout(resolve, 20));

    const keyupEventA = new KeyboardEvent('keyup', {
      bubbles: true,
      key: 'a'
    });
    ctx.container.dispatchEvent(keyupEventA);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should only process when currentTarget exists (sh-keyup-003)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

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

    const keyupEvent = new KeyboardEvent('keyup', {
      bubbles: true,
      key: 'Shift'
    });
    ctx.container.dispatchEvent(keyupEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should only process when selection is not collapsed (sh-keyup-004)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const mockSelection = {
      anchorNode: ctx.container,
      rangeCount: 0,
      isCollapsed: true,
      getRangeAt: vi.fn()
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

    await new Promise(resolve => setTimeout(resolve, 20));

    const keyupEvent = new KeyboardEvent('keyup', {
      bubbles: true,
      key: 'Shift'
    });
    ctx.container.dispatchEvent(keyupEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should call upsertCurrentTarget and selection.userSelect on Shift release (sh-keyup-005)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

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

    await new Promise(resolve => setTimeout(resolve, 20));

    const keyupEvent = new KeyboardEvent('keyup', {
      bubbles: true,
      key: 'Shift'
    });
    ctx.container.dispatchEvent(keyupEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).toHaveBeenCalled();
    expect(ctx.mockState.selection.userSelect).toHaveBeenCalled();

    const userSelectCall = (ctx.mockState.selection.userSelect as any).mock.calls[0];
    const clonedEvent = userSelectCall[1];
    expect(clonedEvent.key).toBe('Shift');

    document.getSelection = originalGetSelection;

    handler.destroy();
  });
});
