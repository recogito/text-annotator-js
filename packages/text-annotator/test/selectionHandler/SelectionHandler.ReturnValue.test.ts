import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - ReturnValue', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return object with destroy method (sh-return-001)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(handler.destroy).toBeDefined();
    expect(typeof handler.destroy).toBe('function');

    handler.destroy();
  });

  it('should return object with setFilter method (sh-return-002)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(handler.setFilter).toBeDefined();
    expect(typeof handler.setFilter).toBe('function');

    handler.destroy();
  });

  it('should return object with setUser method (sh-return-003)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(handler.setUser).toBeDefined();
    expect(typeof handler.setUser).toBe('function');

    handler.destroy();
  });

  it('should return object with setAnnotatingEnabled method (sh-return-004)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(handler.setAnnotatingEnabled).toBeDefined();
    expect(typeof handler.setAnnotatingEnabled).toBe('function');

    handler.destroy();
  });

  it('should return object with setAnnotatingMode method (sh-return-005)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    expect(handler.setAnnotatingMode).toBeDefined();
    expect(typeof handler.setAnnotatingMode).toBe('function');

    handler.destroy();
  });
});
