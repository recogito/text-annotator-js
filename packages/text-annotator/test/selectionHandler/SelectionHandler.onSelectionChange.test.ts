import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createSelectionHandler } from '../../src/SelectionHandler';
import { setupSelectionHandlerTest, SelectionHandlerTestContext } from './selectionHandlerTestSetup';

describe('SelectionHandler - onSelectionChange', () => {
  let ctx: SelectionHandlerTestContext;

  beforeEach(() => {
    ctx = setupSelectionHandlerTest();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return early when currentTarget is undefined (sh-sel-change-001)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

    handler.destroy();
  });

  it('should return early when no selection exists (sh-sel-change-002)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(null);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should return early when selection has no anchorNode (sh-sel-change-003)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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
      anchorNode: null,
      rangeCount: 0,
      isCollapsed: true,
      getRangeAt: vi.fn()
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should return early when anchorNode is outside container (sh-sel-change-004)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    const outsideElement = document.createElement('div');
    outsideElement.textContent = 'Outside content';
    document.body.appendChild(outsideElement);

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
      anchorNode: outsideElement,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn()
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;
    outsideElement.remove();

    handler.destroy();
  });

  it('should clear currentTarget when selection outside container on first change (sh-sel-change-005)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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

    const outsideElement = document.createElement('div');
    outsideElement.textContent = 'Outside content';
    document.body.appendChild(outsideElement);

    const mockSelection = {
      anchorNode: outsideElement,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn()
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    document.getSelection = originalGetSelection;
    outsideElement.remove();

    handler.destroy();
  });

  it('should delete annotation when selection is collapsed in CREATE_NEW mode (sh-sel-change-010)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingMode('CREATE_NEW');

    (ctx.mockState.selection as any).selected = [];

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10,
      ctrlKey: false,
      metaKey: false
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const collapsedRange = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      collapsedRange.setStart(textNode, 3);
      collapsedRange.setEnd(textNode, 3);
    }

    const mockAnnotation = {
      id: 'temp-annotation-id',
      target: { selector: [] }
    };
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: true,
      getRangeAt: vi.fn().mockReturnValue(collapsedRange)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.selection.clear).toHaveBeenCalled();
    expect(ctx.mockState.store.deleteAnnotation).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should clear selection before deleting annotation on collapse (sh-sel-change-011)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingMode('CREATE_NEW');

    (ctx.mockState.selection as any).selected = [];

    const callOrder: string[] = [];
    (ctx.mockState.selection.clear as any).mockImplementation(() => {
      callOrder.push('selection.clear');
    });
    (ctx.mockState.store.deleteAnnotation as any).mockImplementation(() => {
      callOrder.push('store.deleteAnnotation');
    });

    const pointerDownEvent = new (global.PointerEvent || MouseEvent)('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: 10,
      clientY: 10
    });
    document.dispatchEvent(pointerDownEvent);

    const selectStartEvent = new Event('selectstart', { bubbles: true });
    ctx.container.dispatchEvent(selectStartEvent);

    const collapsedRange = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      collapsedRange.setStart(textNode, 3);
      collapsedRange.setEnd(textNode, 3);
    }

    const mockAnnotation = {
      id: 'temp-annotation-id',
      target: { selector: [] }
    };
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: true,
      getRangeAt: vi.fn().mockReturnValue(collapsedRange)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(callOrder).toEqual(['selection.clear', 'store.deleteAnnotation']);

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should NOT delete annotation on collapse when ADD_TO_CURRENT mode (sh-sel-change-012)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

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

    const collapsedRange = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      collapsedRange.setStart(textNode, 3);
      collapsedRange.setEnd(textNode, 3);
    }

    const mockAnnotation = {
      id: 'temp-annotation-id',
      target: { selector: [] }
    };
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: true,
      getRangeAt: vi.fn().mockReturnValue(collapsedRange)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.deleteAnnotation).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should NOT delete annotation on collapse when REPLACE_CURRENT mode (sh-sel-change-013)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingMode('REPLACE_CURRENT');

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

    const collapsedRange = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      collapsedRange.setStart(textNode, 3);
      collapsedRange.setEnd(textNode, 3);
    }

    const mockAnnotation = {
      id: 'temp-annotation-id',
      target: { selector: [] }
    };
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: true,
      getRangeAt: vi.fn().mockReturnValue(collapsedRange)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(ctx.mockState.store.deleteAnnotation).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should trim selection ranges to container boundaries (sh-sel-change-014)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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
      range.setEnd(textNode, 10);
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

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should skip whitespace-only selections (sh-sel-change-015)', async () => {
    ctx.container.innerHTML = '<p>   </p>';

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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
      range.setEnd(textNode, 3);
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

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();
    expect(ctx.mockState.store.updateTarget).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    ctx.container.innerHTML = '<p>Some text content for annotation.</p>';

    handler.destroy();
  });

  it('should split ranges around not-annotatable elements (sh-sel-change-016)', async () => {
    ctx.container.innerHTML = '<p>Some <span data-not-annotatable="true">skip</span> text content.</p>';

    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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
    const paragraph = ctx.container.querySelector('p');
    if (paragraph) {
      range.setStart(paragraph, 0);
      range.setEnd(paragraph, paragraph.childNodes.length);
    }

    const mockSelection = {
      anchorNode: paragraph,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn().mockReturnValue(range)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    document.getSelection = originalGetSelection;

    ctx.container.innerHTML = '<p>Some text content for annotation.</p>';

    handler.destroy();
  });

  it('should detect changes by comparing range count and quote text (sh-sel-change-017)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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

    const selectionChangeEvent1 = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent1);

    await new Promise(resolve => setTimeout(resolve, 20));

    const selectionChangeEvent2 = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent2);

    await new Promise(resolve => setTimeout(resolve, 20));

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should merge ranges with existing annotation when ADD_TO_CURRENT (sh-sel-change-018)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

    const existingRange = document.createRange();
    const textNode = ctx.container.querySelector('p')?.firstChild;
    if (textNode) {
      existingRange.setStart(textNode, 0);
      existingRange.setEnd(textNode, 4);
    }

    const mockAnnotation = {
      id: 'existing-annotation-id',
      target: {
        selector: [{
          type: 'TextQuoteSelector',
          exact: 'Some',
          range: existingRange
        }],
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

    const newRange = document.createRange();
    if (textNode) {
      newRange.setStart(textNode, 10);
      newRange.setEnd(textNode, 15);
    }

    const mockSelection = {
      anchorNode: textNode,
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: vi.fn().mockReturnValue(newRange)
    };
    const originalGetSelection = document.getSelection;
    document.getSelection = vi.fn().mockReturnValue(mockSelection);

    const selectionChangeEvent = new Event('selectionchange', { bubbles: true });
    document.dispatchEvent(selectionChangeEvent);

    await new Promise(resolve => setTimeout(resolve, 20));

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should update currentTarget with new selectors (sh-sel-change-019)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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
      range.setEnd(textNode, 8);
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

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should call rangeToSelector for each combined range (sh-sel-change-020)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should return early when ADD_TO_CURRENT or REPLACE_CURRENT mode (sh-sel-change-021)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

    handler.setAnnotatingMode('ADD_TO_CURRENT');

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

    expect(ctx.mockState.store.addAnnotation).not.toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should update existing annotation target via store.updateTarget (sh-sel-change-022)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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

    const mockAnnotation = {
      id: 'existing-id',
      target: { selector: [] }
    };
    (ctx.mockState.store.getAnnotation as any).mockReturnValue(mockAnnotation);

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

    expect(ctx.mockState.store.updateTarget).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });

  it('should clear previous selection when annotation does not exist yet (sh-sel-change-023)', async () => {
    const handler = createSelectionHandler(ctx.container, ctx.mockState, ctx.mockLifecycle, ctx.mockOptions, ctx.mockStoreProxy);

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

    (ctx.mockState.store.getAnnotation as any).mockReturnValue(undefined);

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

    expect(ctx.mockState.selection.clear).toHaveBeenCalled();

    document.getSelection = originalGetSelection;

    handler.destroy();
  });
});
