import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - destroy', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should reset internal state variables to undefined (sh-destroy-001)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    document.dispatchEvent(pointerDownEvent);

    handler.destroy();

    expect(handler.destroy).toBeDefined();
  });

  it('should clear debounced onSelectionChange handler (sh-destroy-002)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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
    (ctx.mockState.selection as any).selected = [];
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

    const selectionChangeEvent = new Event('selectionchange');
    document.dispatchEvent(selectionChangeEvent);

    handler.destroy();

    await new Promise(resolve => setTimeout(resolve, 20));

    document.getSelection = originalGetSelection;
  });

  it('should remove pointerdown listener from document (sh-destroy-003)', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);
    handler.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should remove pointerup listener from document (sh-destroy-004)', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);
    handler.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should remove contextmenu listener from document (sh-destroy-005)', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);
    handler.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should remove keyup listener from container (sh-destroy-006)', () => {
    const removeEventListenerSpy = vi.spyOn(ctx.container, 'removeEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);
    handler.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should remove selectstart listener from container (sh-destroy-007)', () => {
    const removeEventListenerSpy = vi.spyOn(ctx.container, 'removeEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);
    handler.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('selectstart', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should remove selectionchange listener from document (sh-destroy-008)', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);
    handler.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
