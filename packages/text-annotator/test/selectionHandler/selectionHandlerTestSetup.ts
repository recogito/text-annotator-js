import { JSDOM } from 'jsdom';
import { vi } from 'vitest';
import type { TextAnnotatorState } from '../../src/state';
import type { TextAnnotation } from '../../src/model';
import type { Lifecycle } from '@annotorious/core';
import type { TextAnnotatorOptions } from '../../src/TextAnnotatorOptions';

export interface SelectionHandlerTestContext {
  container: HTMLElement;
  mockState: TextAnnotatorState<TextAnnotation, unknown>;
  mockLifecycle: Lifecycle<TextAnnotation, unknown>;
  mockOptions: TextAnnotatorOptions<TextAnnotation, unknown>;
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

  const mockLifecycle = {
    emit: vi.fn(),
    on: vi.fn()
  } as unknown as Lifecycle<TextAnnotation, unknown>;

  const mockOptions: TextAnnotatorOptions<TextAnnotation, unknown> = {
    annotatingEnabled: true
  };

  return { container, mockState, mockLifecycle, mockOptions };
}
