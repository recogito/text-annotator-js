import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - onSelectStart', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return early when annotating is disabled (sh-select-start-001)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingEnabled(false);

    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: {
        selector: [{ type: 'TextQuoteSelector', exact: 'test' }]
      }
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    expect(ctx.mockState.store.getAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });

  it('should return early when isLeftClick is false (right-click) (sh-select-start-002)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: {
        selector: [{ type: 'TextQuoteSelector', exact: 'test' }]
      }
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 2,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    expect(ctx.mockState.store.getAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });

  it('should detect modify-existing mode when ADD_TO_CURRENT and single editable selection (sh-select-start-003)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: {
        selector: [{ type: 'TextQuoteSelector', exact: 'test' }],
        created: new Date('2024-01-01'),
        creator: { id: 'original-creator' }
      }
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
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

    expect(ctx.mockState.store.getAnnotation).toHaveBeenCalledWith('existing-annotation-id');

    handler.destroy();
  });

  it('should detect modify-existing mode when REPLACE_CURRENT and single editable selection (sh-select-start-004)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('REPLACE_CURRENT');

    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: {
        selector: [{ type: 'TextQuoteSelector', exact: 'test' }],
        created: new Date('2024-01-01'),
        creator: { id: 'original-creator' }
      }
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
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

    expect(ctx.mockState.store.getAnnotation).toHaveBeenCalledWith('existing-annotation-id');

    handler.destroy();
  });

  it('should set targetToModify to existing annotation target when modifying (sh-select-start-005)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const existingTarget = {
      selector: [{ type: 'TextQuoteSelector', exact: 'existing text' }],
      created: new Date('2024-01-01'),
      creator: { id: 'original-creator' }
    };
    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: existingTarget
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
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

    expect(ctx.mockState.store.getAnnotation).toHaveBeenCalledWith('existing-annotation-id');

    handler.destroy();
  });

  it('should preserve created/creator from existing target when modifying (sh-select-start-006)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const originalCreated = new Date('2024-01-01T10:00:00Z');
    const originalCreator = { id: 'original-creator-id', name: 'Original Creator' };
    const existingTarget = {
      selector: [{ type: 'TextQuoteSelector', exact: 'existing text' }],
      created: originalCreated,
      creator: originalCreator
    };
    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: existingTarget
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
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

    expect(ctx.mockState.store.getAnnotation).toHaveBeenCalledWith('existing-annotation-id');

    handler.destroy();
  });

  it('should set updated date and updatedBy when modifying (sh-select-start-007)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const currentUser = { id: 'current-user-id', name: 'Current User' };
    handler.setUser(currentUser);

    const existingTarget = {
      selector: [{ type: 'TextQuoteSelector', exact: 'existing text' }],
      created: new Date('2024-01-01T10:00:00Z'),
      creator: { id: 'original-creator-id' }
    };
    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: existingTarget
    };
    (ctx.mockState.selection as any).selected = [{ id: 'existing-annotation-id', editable: true }];
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

    expect(ctx.mockState.store.getAnnotation).toHaveBeenCalledWith('existing-annotation-id');

    handler.destroy();
  });

  it('should create new target with new UUID when not modifying (sh-select-start-008)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('CREATE_NEW');

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

    expect(ctx.mockState.store.getAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });

  it('should set created date and creator on new target (sh-select-start-009)', () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions);

    handler.setAnnotatingMode('CREATE_NEW');

    const currentUser = { id: 'test-user-id', name: 'Test User' };
    handler.setUser(currentUser);

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

    expect(ctx.mockState.store.getAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });
});
