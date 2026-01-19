import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - EventListeners', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add pointerdown listener to document (sh-events-001)', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));

    addEventListenerSpy.mockRestore();
    handler.destroy();
  });

  it('should add pointerup listener to document (sh-events-002)', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

    addEventListenerSpy.mockRestore();
    handler.destroy();
  });

  it('should add contextmenu listener to document (sh-events-003)', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));

    addEventListenerSpy.mockRestore();
    handler.destroy();
  });

  it('should add keyup listener to container (sh-events-004)', () => {
    const addEventListenerSpy = vi.spyOn(ctx.container, 'addEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

    addEventListenerSpy.mockRestore();
    handler.destroy();
  });

  it('should add selectstart listener to container (sh-events-005)', () => {
    const addEventListenerSpy = vi.spyOn(ctx.container, 'addEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('selectstart', expect.any(Function));

    addEventListenerSpy.mockRestore();
    handler.destroy();
  });

  it('should add selectionchange listener to document (sh-events-006)', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(addEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));

    addEventListenerSpy.mockRestore();
    handler.destroy();
  });
});
