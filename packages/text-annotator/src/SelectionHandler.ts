import hotkeys from 'hotkeys-js';
import type { Filter, User } from '@annotorious/core';
import type { SelectionProxy, StoreProxy } from './state';
import type { TextAnnotation } from './model';
import type { AnnotatingMode } from './TextAnnotator';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';
import {
  createSelectionHandler as createStandaloneSelectionHandler,
  type SelectionHandler as StandaloneSelectionHandler
} from './standalone';
import { cloneKeyboardEvent, isMac, isNotAnnotatable } from './utils';

const ARROW_KEYS = ['up', 'down', 'left', 'right'];

const SELECT_ALL = isMac ? '⌘+a' : 'ctrl+a';

const SELECTION_KEYS = [
  ...ARROW_KEYS.map(key => `shift+${key}`),
  SELECT_ALL
];

export interface SelectionHandler extends StandaloneSelectionHandler {}

export const createSelectionHandler = (
  container: HTMLElement,
  selectionProxy: SelectionProxy,
  onClickAnnotation: (annotation: TextAnnotation | TextAnnotation[]) => void,
  options: TextAnnotatorOptions<TextAnnotation, unknown>,
  storeProxy: StoreProxy<TextAnnotation>
): SelectionHandler => {

  // Create the standalone selection handler which handles all the core logic
  const standaloneHandler = createStandaloneSelectionHandler(
    container,
    selectionProxy,
    onClickAnnotation,
    options,
    storeProxy
  );

  // Track lastDownEvent for keyboard events (hotkeys layer)
  let lastDownEvent: KeyboardEvent | undefined;

  // Helper for select all functionality
  const onSelectAll = (evt: KeyboardEvent) => {
    const onSelected = () => setTimeout(() => {
      // After select-all, we need to trigger the selection flow
      // The standalone handler will have processed the selectionchange event
      // We just need to ensure the selection is committed
      const sel = document.getSelection();
      if (sel && !sel.isCollapsed) {
        // The standalone handler should have already processed this
        // through its selectionchange listener
      }

      document.removeEventListener('selectionchange', onSelected);
    }, 100);

    // Listen to the change event that follows
    document.addEventListener('selectionchange', onSelected);
  }

  // Register hotkey for selection keys (shift+arrow, select-all)
  hotkeys(SELECTION_KEYS.join(','), { element: container, keydown: true, keyup: false }, evt => {
    if (!evt.repeat)
      lastDownEvent = cloneKeyboardEvent(evt);
  });

  // Register select-all hotkey
  hotkeys(SELECT_ALL, { keydown: true, keyup: false }, evt => {
    lastDownEvent = cloneKeyboardEvent(evt);
    onSelectAll(evt);
  });

  /**
   * Free caret movement through the text resets the annotation selection.
   *
   * It should be handled only on:
   * - the annotatable `container`, where the text is.
   * - the `body`, where the focus goes when user closes the popup,
   *   or clicks the button that gets unmounted, e.g. "Close"
   */
  const handleArrowKeyPress = (evt: KeyboardEvent) => {
    if (
      evt.repeat ||
      evt.target instanceof Node && isNotAnnotatable(container, evt.target) && evt.target !== document.body
    ) {
      return;
    }

    selectionProxy.clear();
  };

  hotkeys(ARROW_KEYS.join(','), { keydown: true, keyup: false }, handleArrowKeyPress);

  const destroy = () => {
    standaloneHandler.destroy();
    hotkeys.unbind();
  };

  return {
    destroy,
    setFilter: standaloneHandler.setFilter,
    setUser: standaloneHandler.setUser,
    setAnnotatingEnabled: standaloneHandler.setAnnotatingEnabled,
    setAnnotatingMode: standaloneHandler.setAnnotatingMode
  }

}
