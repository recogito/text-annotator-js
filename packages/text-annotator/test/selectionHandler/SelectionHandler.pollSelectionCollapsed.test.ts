import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - pollSelectionCollapsed', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should poll isCollapsed with 1ms interval (sh-poll-001)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    let callCount = 0;
    const mockSelection = {
      isCollapsed: false,
      anchorNode: ctx.container,
      rangeCount: 0,
      getRangeAt: vi.fn()
    };

    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount > 30) {
        mockSelection.isCollapsed = true;
      }
      return mockSelection;
    });

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

    await new Promise(resolve => setTimeout(resolve, 60));

    expect(callCount).toBeGreaterThan(1);

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should stop after 50ms timeout (sh-poll-002)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    let pollCount = 0;
    const startTime = Date.now();
    let endTime: number | undefined;

    const mockSelection = {
      get isCollapsed() {
        pollCount++;
        endTime = Date.now();
        return false;
      },
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

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(pollCount).toBeGreaterThan(1);

    if (endTime) {
      const pollingDuration = endTime - startTime;
      expect(pollingDuration).toBeLessThan(150);
    }

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should stop immediately when isCollapsed becomes true (sh-poll-003)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    let pollCount = 0;
    const startTime = Date.now();
    let endTime: number | undefined;

    const mockSelection = {
      get isCollapsed() {
        pollCount++;
        endTime = Date.now();
        return pollCount > 5;
      },
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

    await new Promise(resolve => setTimeout(resolve, 60));

    expect(pollCount).toBeGreaterThan(1);
    expect(pollCount).toBeLessThan(50);

    if (endTime) {
      const pollingDuration = endTime - startTime;
      expect(pollingDuration).toBeLessThan(45);
    }

    document.getSelection = originalGetSelection;

    handler.destroy();
  });
});
