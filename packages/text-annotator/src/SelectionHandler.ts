import debounce from 'debounce';
import { v4 as uuidv4 } from 'uuid';
import hotkeys from 'hotkeys-js';

import { Origin, type Filter, type Selection, type User } from '@annotorious/core';

import type { TextAnnotatorState } from './state';
import type { TextAnnotation, TextAnnotationTarget } from './model';
import {
  clonePointerEvent,
  cloneKeyboardEvent,
  splitAnnotatableRanges,
  rangeToSelector,
  isMac,
  isWhitespaceOrEmpty,
  trimRangeToContainer,
  NOT_ANNOTATABLE_SELECTOR
} from './utils';

const CLICK_TIMEOUT = 300;

const ARROW_KEYS = ['up', 'down', 'left', 'right'];

const SELECT_ALL = isMac ? '⌘+a' :  'ctrl+a';

const SELECTION_KEYS = [
  ...ARROW_KEYS.map(key => `shift+${key}`),
  SELECT_ALL
];

export const createSelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  offsetReferenceSelector?: string
) => {

  const { store, selection } = state;

  let currentUser: User | undefined;

  const setUser = (user?: User) => currentUser = user;

  let currentFilter: Filter | undefined;

  const setFilter = (filter?: Filter) => currentFilter = filter;

  let currentTarget: TextAnnotationTarget | undefined;

  let isLeftClick: boolean | undefined;

  let lastDownEvent: Selection['event'] | undefined;

  let isContextMenuOpen = false;

  let currentAnnotatingEnabled = true;

  const setAnnotatingEnabled = (enabled: boolean) => {
    currentAnnotatingEnabled = enabled;
    onSelectionChange.clear();

    if (!enabled) {
      currentTarget = undefined;
      lastDownEvent = undefined;
      isContextMenuOpen = false;
    }
  };

  const onSelectStart = (evt: Event) => {
    if (!currentAnnotatingEnabled) return;

    isContextMenuOpen = false;

    if (isLeftClick === false) return;

    /**
     * Make sure we don't listen to selection changes that were
     * not started on the container, or which are not supposed to
     * be annotatable (like a component popup).
     * Note that Chrome/iOS will sometimes return the root doc as target!
     */
    const annotatable = !(evt.target as Node).parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    currentTarget = annotatable ? {
      annotation: uuidv4(),
      selector: [],
      creator: currentUser,
      created: new Date()
    } : undefined;
  };

  const onSelectionChange = debounce((evt: Event) => {
    if (!currentAnnotatingEnabled) return;

    const sel = document.getSelection();

    // This is to handle cases where the selection is "hijacked" by another element
    // in a not-annotatable area. A rare case in theory. But rich text editors
    // will like Quill do it...
    const annotatable = !sel.anchorNode?.parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    if (!annotatable) {
      currentTarget = undefined;
      return;
    }

    const timeDifference = evt.timeStamp - (lastDownEvent?.timeStamp || evt.timeStamp);

    /**
     * The selection start needs to be emulated only for the pointer events!
     * The keyboard ones are consistently fired on desktops
     * and the `timeDifference` will always be <10ms. between the `keydown` and `selectionchange`
     */
    if (lastDownEvent?.type === 'pointerdown') {
      if (timeDifference < 1000 && !currentTarget) {

        // Chrome/iOS does not reliably fire the 'selectstart' event!
        onSelectStart(lastDownEvent || evt);
      } else if (sel.isCollapsed && timeDifference < CLICK_TIMEOUT) {

        // Firefox doesn't fire the 'selectstart' when user clicks
        // over the text, which collapses the selection
        onSelectStart(lastDownEvent || evt);
      }
    }

    // The selection isn't active -> bail out from selection change processing
    if (!currentTarget) return;

    if (sel.isCollapsed) {
      /**
       * The selection range got collapsed during the selecting process.
       * The previously created annotation isn't relevant anymore and can be discarded
       *
       * @see https://github.com/recogito/text-annotator-js/issues/139
       */
      if (store.getAnnotation(currentTarget.annotation)) {
        selection.clear();
        store.deleteAnnotation(currentTarget.annotation);
      }

      return;
    }

    const selectionRange = sel.getRangeAt(0);

// The selection should be captured only within the annotatable container
    const containedRange = trimRangeToContainer(selectionRange, container);
    if (isWhitespaceOrEmpty(containedRange)) return;

    const annotatableRanges = splitAnnotatableRanges(containedRange.cloneRange());

    const hasChanged =
      annotatableRanges.length !== currentTarget.selector.length ||
      annotatableRanges.some((r, i) => r.toString() !== currentTarget.selector[i]?.quote);

    if (!hasChanged) return;

    currentTarget = {
      ...currentTarget,
      selector: annotatableRanges.map(r => rangeToSelector(r, container, offsetReferenceSelector)),
      updated: new Date()
    };

    /**
     * During mouse selection on the desktop, annotation won't usually exist while the selection is being edited.
     * But it will be typical during keyboard or mobile handlebars selection!
     */
    if (store.getAnnotation(currentTarget.annotation)) {
      store.updateTarget(currentTarget, Origin.LOCAL);
    }
  }, 10);

  /**
   * Select events don't carry information about the mouse button
   * Therefore, to prevent right-click selection, we need to listen
   * to the initial pointerdown event and remember the button
   */
  const onPointerDown = (evt: PointerEvent) => {
    if (isContextMenuOpen) return;

    const annotatable = !(evt.target as Node).parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    if (!annotatable) return;

    /**
     * Cloning the event to prevent it from accidentally being `undefined`
     * @see https://github.com/recogito/text-annotator-js/commit/65d13f3108c429311cf8c2523f6babbbc946013d#r144033948
     */
    lastDownEvent = clonePointerEvent(evt);
    isLeftClick = lastDownEvent.button === 0;
  };

  // Helper
  const upsertCurrentTarget = () => {
    const exists = store.getAnnotation(currentTarget.annotation);
    if (exists) {
      store.updateTarget(currentTarget);
    } else {
      store.addAnnotation({
        id: currentTarget.annotation,
        bodies: [],
        target: currentTarget
      });
    }
  }

  const onPointerUp = (evt: PointerEvent) => {
    if (isContextMenuOpen) return;

    const annotatable = !(evt.target as Node).parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    if (!annotatable || !isLeftClick) return;

    // Logic for selecting an existing annotation
    const clickSelect = () => {
      const { x, y } = container.getBoundingClientRect();

      const hovered =
        evt.target instanceof Node &&
        container.contains(evt.target) &&
        store.getAt(evt.clientX - x, evt.clientY - y, currentFilter);

      if (hovered) {
        const { selected } = selection;

        if (selected.length !== 1 || selected[0].id !== hovered.id) {
          selection.userSelect(hovered.id, evt);
        }
      } else if (!selection.isEmpty()) {
        selection.clear();
      }
    };

    const timeDifference = evt.timeStamp - lastDownEvent.timeStamp;

    /**
     * We must check the `isCollapsed` within the 0-timeout
     * to handle the annotation dismissal after a click properly.
     *
     * Otherwise, the `isCollapsed` will return an obsolete `false` value,
     * click won't be processed, and the annotation will get falsely re-selected.
     *
     * @see https://github.com/recogito/text-annotator-js/issues/136
     */
    setTimeout(() => {
      const sel = document.getSelection();

      // Just a click, not a selection
      if (sel?.isCollapsed && timeDifference < CLICK_TIMEOUT) {
        currentTarget = undefined;
        clickSelect();
      } else if (currentTarget && currentTarget.selector.length > 0) {
        selection.clear();
        upsertCurrentTarget();
        selection.userSelect(currentTarget.annotation, clonePointerEvent(evt));
      }
    });
  }

  const onContextMenu = (evt: PointerEvent) => {
    isContextMenuOpen = true;

    const sel = document.getSelection();

    if (sel?.isCollapsed) return;

    // When selecting the initial word, Chrome Android fires `contextmenu`
    // before selectionChanged.
    if (!currentTarget || currentTarget.selector.length === 0) {
      onSelectionChange(evt);
    }

    upsertCurrentTarget();

    selection.userSelect(currentTarget.annotation, clonePointerEvent(evt));
  }

  const onKeyup = (evt: KeyboardEvent) => {
    if (!currentAnnotatingEnabled) return;

    if (evt.key === 'Shift' && currentTarget) {
      const sel = document.getSelection();

      if (!sel.isCollapsed) {
        selection.clear();
        upsertCurrentTarget();
        selection.userSelect(currentTarget.annotation, cloneKeyboardEvent(evt));
      }
    }
  }

  const onSelectAll = (evt: KeyboardEvent) => {

    const onSelected = () => setTimeout(() => {
      if (currentTarget?.selector.length > 0) {
        selection.clear();

        store.addAnnotation({
          id: currentTarget.annotation,
          bodies: [],
          target: currentTarget
        });

        selection.userSelect(currentTarget.annotation, cloneKeyboardEvent(evt));
      }

      document.removeEventListener('selectionchange', onSelected);

      // Sigh... this needs a delay to work. But doesn't seem reliable.
    }, 100);

    // Listen to the change event that follows
    document.addEventListener('selectionchange', onSelected);

    // Start selection!
    onSelectStart(evt);
  }

  hotkeys(SELECTION_KEYS.join(','), { element: container, keydown: true, keyup: false }, evt => {
    if (!evt.repeat)
      lastDownEvent = cloneKeyboardEvent(evt);
  });

  hotkeys(SELECT_ALL, { keydown: true, keyup: false}, evt => {
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
      evt.target !== container && evt.target !== document.body
    ) {
      return;
    }

    currentTarget = undefined;
    selection.clear();
  };

  hotkeys(ARROW_KEYS.join(','), { keydown: true, keyup: false }, handleArrowKeyPress);

  container.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('contextmenu', onContextMenu);

  container.addEventListener('keyup', onKeyup);
  container.addEventListener('selectstart', onSelectStart);
  document.addEventListener('selectionchange', onSelectionChange);

  const destroy = () => {
    currentTarget = undefined;
    lastDownEvent = undefined;
    isContextMenuOpen = false;

    onSelectionChange.clear();

    container.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('contextmenu', onContextMenu);

    container.removeEventListener('keyup', onKeyup);
    container.removeEventListener('selectstart', onSelectStart);
    document.removeEventListener('selectionchange', onSelectionChange);

    hotkeys.unbind();
  };

  return {
    destroy,
    setFilter,
    setUser,
    setAnnotatingEnabled
  }

}

