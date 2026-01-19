import { JSDOM } from 'jsdom';
import { vi } from 'vitest';
import type { TextAnnotatorState, StoreProxy, SelectionProxy } from '../../src/state';
import type { TextAnnotation } from '../../src/model';
import type { TextAnnotatorOptions } from '../../src/TextAnnotatorOptions';

export interface SelectionHandlerTestContext {
  container: HTMLElement;
  mockState: TextAnnotatorState<TextAnnotation, unknown>;
  mockOnClickAnnotation: ReturnType<typeof vi.fn>;
  mockOptions: TextAnnotatorOptions<TextAnnotation, unknown>;
  mockStoreProxy: StoreProxy<TextAnnotation>;
  mockSelectionProxy: SelectionProxy;
}

export function setupSelectionHandlerTest(): SelectionHandlerTestContext {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="container">
          <p>Some text content for annotation.</p>
        </div>
      </body>
    </html>
  `, { url: 'http://localhost' });

  global.document = dom.window.document;
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.Range = dom.window.Range;
  global.Selection = dom.window.Selection;
  global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  const container = document.getElementById('container') as HTMLElement;

  const mockState = {
    store: {
      getAnnotation: vi.fn(),
      addAnnotation: vi.fn(),
      updateAnnotation: vi.fn(),
      deleteAnnotation: vi.fn(),
      updateTarget: vi.fn(),
      getAt: vi.fn(),
      observe: vi.fn(),
      all: vi.fn().mockReturnValue([]),
      bulkAddAnnotations: vi.fn(),
      bulkUpdateTargets: vi.fn(),
      bulkUpsertAnnotations: vi.fn(),
      getAnnotationBounds: vi.fn(),
      getAnnotationRects: vi.fn(),
      getIntersecting: vi.fn(),
      recalculatePositions: vi.fn(),
      onRecalculatePositions: vi.fn()
    },
    selection: {
      selected: [],
      userSelect: vi.fn(),
      clear: vi.fn(),
      subscribe: vi.fn()
    },
    hover: {
      current: undefined,
      set: vi.fn(),
      subscribe: vi.fn()
    },
    viewport: {
      current: undefined,
      set: vi.fn(),
      subscribe: vi.fn()
    }
  } as unknown as TextAnnotatorState<TextAnnotation, unknown>;

  const mockOnClickAnnotation = vi.fn();

  const mockOptions: TextAnnotatorOptions<TextAnnotation, unknown> = {
    annotatingEnabled: true
  };

  // Create mock store proxy that delegates to the store
  const mockStoreProxy = {
    // Data Down (reads) - delegate to store
    getAnnotation: vi.fn((id: string) => mockState.store.getAnnotation(id)),
    getAt: vi.fn((x: number, y: number, all?: boolean, filter?: any) => mockState.store.getAt(x, y, all, filter)),

    // Actions Up (writes) - forward to store
    addAnnotation: vi.fn((annotation: any, origin?: any) => {
      mockState.store.addAnnotation(annotation, origin);
    }),
    updateTarget: vi.fn((target: any, origin?: any) => {
      mockState.store.updateTarget(target, origin);
    }),
    deleteAnnotation: vi.fn((id: string) => {
      mockState.store.deleteAnnotation(id);
    }),

    on: vi.fn()
  } as unknown as StoreProxy<TextAnnotation>;

  // Create mock selection proxy that delegates to mockState.selection
  const mockSelectionProxy = {
    // Data Down (reads) - pull-based
    getSelected: vi.fn(() => mockState.selection.selected),

    // Actions Up (writes)
    clear: vi.fn(() => mockState.selection.clear()),
    userSelect: vi.fn((idOrIds: string | string[], event?: any) => {
      mockState.selection.userSelect(idOrIds, event);
    })
  } as unknown as SelectionProxy;

  return { container, mockState, mockOnClickAnnotation, mockOptions, mockStoreProxy, mockSelectionProxy };
}
