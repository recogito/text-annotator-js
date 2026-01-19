import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - upsertCurrentTarget', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add annotation when it doesn\'t exist (sh-upsert-001)', async () => {
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
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should add annotation with id, bodies, and target (sh-upsert-002)', async () => {
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
    const addAnnotationCall = (ctx.mockState.store.addAnnotation as any).mock.calls[0][0];
    expect(addAnnotationCall).toHaveProperty('id');
    expect(addAnnotationCall).toHaveProperty('bodies');
    expect(addAnnotationCall.bodies).toEqual([]);
    expect(addAnnotationCall).toHaveProperty('target');
    expect(addAnnotationCall.target).toHaveProperty('annotation');
    expect(addAnnotationCall.target).toHaveProperty('selector');

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should update target when currentTarget is newer (sh-upsert-003)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

    const existingAnnotationId = 'existing-annotation-123';
    const existingTarget = {
      annotation: existingAnnotationId,
      selector: [{
        type: 'TextQuoteSelector',
        exact: 'Some',
        quote: 'Some',
        range: document.createRange()
      }],
      created: new Date(Date.now() - 10000),
      updated: new Date(Date.now() - 5000)
    };

    (ctx.mockState.selection as any).selected = [{ id: existingAnnotationId, editable: true }];

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

    (ctx.mockState.store.getAnnotation as any).mockReturnValue({
      id: existingAnnotationId,
      bodies: [],
      target: existingTarget
    });

    handler.setAnnotatingMode('REPLACE_CURRENT');

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

    expect(ctx.mockState.store.updateTarget).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should update target when existing has no updated timestamp (sh-upsert-004)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

    const existingAnnotationId = 'existing-annotation-no-updated';
    const existingTarget = {
      annotation: existingAnnotationId,
      selector: [{
        type: 'TextQuoteSelector',
        exact: 'Some',
        quote: 'Some',
        range: document.createRange()
      }],
      created: new Date(Date.now() - 10000)
    };

    (ctx.mockState.selection as any).selected = [{ id: existingAnnotationId, editable: true }];

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

    (ctx.mockState.store.getAnnotation as any).mockReturnValue({
      id: existingAnnotationId,
      bodies: [],
      target: existingTarget
    });

    handler.setAnnotatingMode('REPLACE_CURRENT');

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

    expect(ctx.mockState.store.updateTarget).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should NOT update target when existing is newer (sh-upsert-005)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockSelectionProxy, ctx.mockOnClickAnnotation, ctx.mockOptions, ctx.mockStoreProxy);

    const existingAnnotationId = 'existing-annotation-newer';
    const futureDate = new Date(Date.now() + 10000);
    const existingTarget = {
      annotation: existingAnnotationId,
      selector: [{
        type: 'TextQuoteSelector',
        exact: 'Some',
        quote: 'Some',
        range: document.createRange()
      }],
      created: new Date(Date.now() - 10000),
      updated: futureDate
    };

    (ctx.mockState.selection as any).selected = [{ id: existingAnnotationId, editable: true }];

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

    (ctx.mockState.store.getAnnotation as any).mockReturnValue({
      id: existingAnnotationId,
      bodies: [],
      target: existingTarget
    });

    handler.setAnnotatingMode('REPLACE_CURRENT');

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

    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();
    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });
});
