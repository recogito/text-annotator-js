import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - onPointerUp', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return early when isLeftClick is false (sh-ptr-up-001)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const rightClickDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 2,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(rightClickDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 2,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerUpEvent);

    expect(ctx.mockState.store.getAt).not.toHaveBeenCalled();
    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });

  it('should clone the pointer event (sh-ptr-up-002)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
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

    await new Promise(resolve => setTimeout(resolve, 60));

    handler.destroy();
  });

  it('should handle dismissOnNotAnnotatable=ALWAYS by clearing selection (sh-ptr-up-003)', async () => {
    const optionsWithDismiss = {
      ...ctx.mockOptions,
      dismissOnNotAnnotatable: 'ALWAYS' as const
    };
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, optionsWithDismiss, ctx.mockStoreProxy);

    const notAnnotatableElement = document.createElement('span');
    notAnnotatableElement.setAttribute('data-not-annotatable', 'true');
    notAnnotatableElement.textContent = 'Not annotatable';
    ctx.container.appendChild(notAnnotatableElement);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: notAnnotatableElement });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 60));

    expect(ctx.mockState.selection.clear).toHaveBeenCalled();

    notAnnotatableElement.remove();

    handler.destroy();
  });

  it('should call store.getAt with correct coordinates and filter (sh-ptr-up-005)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockFilter = vi.fn().mockReturnValue(true);
    handler.setFilter(mockFilter);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 150,
      clientY: 200
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 150,
      clientY: 200
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.store.getAt).toHaveBeenCalled();

    handler.destroy();
  });

  it('should pass selectionMode=all flag to store.getAt (sh-ptr-up-006)', async () => {
    const optionsWithAllMode = {
      ...ctx.mockOptions,
      selectionMode: 'all' as const
    };
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, optionsWithAllMode, ctx.mockStoreProxy);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.store.getAt).toHaveBeenCalled();
    const callArgs = (ctx.mockState.store.getAt as any).mock.calls[0];
    expect(callArgs[2]).toBe(true);

    handler.destroy();
  });

  it('should emit clickAnnotation event when annotation is clicked (sh-ptr-up-007)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockAnnotation = {
      id: 'test-annotation-id',
      target: {
        annotation: 'test-annotation-id',
        selector: []
      },
      bodies: []
    };

    (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockLifecycle.emit).toHaveBeenCalledWith('clickAnnotation', mockAnnotation);

    handler.destroy();
  });

  it('should call selection.userSelect with annotation ids (sh-ptr-up-008)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockAnnotation = {
      id: 'clicked-annotation-id',
      target: {
        annotation: 'clicked-annotation-id',
        selector: []
      },
      bodies: []
    };

    (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.selection.userSelect).toHaveBeenCalled();
    const callArgs = (ctx.mockState.selection.userSelect as any).mock.calls[0];
    expect(callArgs[0]).toEqual(['clicked-annotation-id']);

    handler.destroy();
  });

  it('should detect selection change by comparing current and next ids (sh-ptr-up-009)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockAnnotation = {
      id: 'annotation-1',
      target: {
        annotation: 'annotation-1',
        selector: []
      },
      bodies: []
    };

    (ctx.mockState.selection as any).selected = [{ id: 'annotation-1' }];

    (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.selection.userSelect).not.toHaveBeenCalled();
    expect(ctx.mockLifecycle.emit).not.toHaveBeenCalledWith('clickAnnotation', expect.anything());

    handler.destroy();
  });

  it('should clear selection when clicking empty area (sh-ptr-up-010)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.store.getAt as any).mockReturnValue(undefined);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.selection.clear).toHaveBeenCalled();

    handler.destroy();
  });

  it('should check timeDifference < CLICK_TIMEOUT (300ms) for click detection (sh-ptr-up-011)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockAnnotation = {
      id: 'test-annotation',
      target: { annotation: 'test-annotation', selector: [] },
      bodies: []
    };
    (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'timeStamp', { value: 1000 });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'timeStamp', { value: 1400 });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.store.getAt).not.toHaveBeenCalled();

    handler.destroy();
  });

  it('should call pollSelectionCollapsed before processing click (sh-ptr-up-012)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockAnnotation = {
      id: 'test-annotation',
      target: { annotation: 'test-annotation', selector: [] },
      bodies: []
    };
    (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    expect(ctx.mockState.store.getAt).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.store.getAt).toHaveBeenCalled();

    handler.destroy();
  });

  it('should route to clickSelect when selection is collapsed (sh-ptr-up-013)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const mockAnnotation = {
      id: 'test-annotation',
      target: { annotation: 'test-annotation', selector: [] },
      bodies: []
    };
    (ctx.mockState.store.getAt as any).mockReturnValue(mockAnnotation);

    const mockSelection = {
      isCollapsed: true,
      anchorNode: ctx.container,
      rangeCount: 0,
      getRangeAt: vi.fn()
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerDownEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerDownEvent);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.store.getAt).toHaveBeenCalled();
    expect(ctx.mockLifecycle.emit).toHaveBeenCalledWith('clickAnnotation', mockAnnotation);
    expect(ctx.mockState.selection.userSelect).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should clear currentTarget before calling clickSelect (sh-ptr-up-015)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const mockSelection = {
      isCollapsed: true,
      anchorNode: ctx.container,
      rangeCount: 0,
      getRangeAt: vi.fn()
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    (ctx.mockState.store.getAt as any).mockReturnValue(undefined);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    await new Promise(resolve => setTimeout(resolve, 80));

    expect(ctx.mockState.selection.clear).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should call upsertCurrentTarget when valid selection exists (sh-ptr-up-016)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

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

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    Object.defineProperty(pointerUpEvent, 'timeStamp', { value: Date.now() + 400 });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    expect(ctx.mockState.store.addAnnotation).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should call selection.userSelect after upserting target (sh-ptr-up-017)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

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

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

    const pointerUpEvent = new (global.PointerEvent || MouseEvent)('pointerup', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    Object.defineProperty(pointerUpEvent, 'timeStamp', { value: Date.now() + 400 });
    Object.defineProperty(pointerUpEvent, 'target', { value: ctx.container });
    document.dispatchEvent(pointerUpEvent);

    expect(ctx.mockState.selection.userSelect).toHaveBeenCalled();
    const callArgs = (ctx.mockState.selection.userSelect as any).mock.calls[0];
    expect(typeof callArgs[0]).toBe('string');

    document.getSelection = originalGetSelection;

    handler.destroy();
  });
});
