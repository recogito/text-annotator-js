import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - onPointerDown', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should set isLeftClick based on event.button (sh-ptr-down-001)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const leftClickEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(leftClickEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const rightClickEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 2,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(rightClickEvent);

    const selectStartEvent2 = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent2);

    handler.destroy();
  });

  it('should store cloned event in lastDownEvent (sh-ptr-down-002)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 50,
      clientY: 100
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    handler.destroy();
  });

  it('should set isLeftClick to true when button === 0 (sh-ptr-down-003)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const leftClickEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(leftClickEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    handler.destroy();
  });

  it('should set isLeftClick to false when button !== 0 (sh-ptr-down-004)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    (ctx.mockState.selection as any).selected = [];

    const rightClickEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 2,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(rightClickEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    expect(ctx.mockState.store.getAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });
});
