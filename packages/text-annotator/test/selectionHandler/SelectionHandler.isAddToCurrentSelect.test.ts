import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - isAddToCurrentSelect', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when annotatingMode is ADD_TO_CURRENT (sh-add-to-current-001)', () => {
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

  it('should return true on ctrlKey when allowModifierSelect and not Mac (sh-add-to-current-002)', () => {
    const optionsWithModifier = {
      ...ctx.mockOptions,
      allowModifierSelect: true
    };

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, optionsWithModifier);

    handler.setAnnotatingMode('CREATE_NEW');

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
      clientY: 10,
      ctrlKey: true
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    expect(ctx.mockState.store.getAnnotation).toHaveBeenCalledWith('existing-annotation-id');

    handler.destroy();
  });

  it('should return false when allowModifierSelect is false (sh-add-to-current-004)', () => {
    const optionsWithoutModifier = {
      ...ctx.mockOptions,
      allowModifierSelect: false
    };

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, optionsWithoutModifier);

    handler.setAnnotatingMode('CREATE_NEW');

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
      clientY: 10,
      ctrlKey: true
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    expect(ctx.mockState.store.getAnnotation).not.toHaveBeenCalled();

    handler.destroy();
  });
});
