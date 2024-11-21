import { Origin } from '@annotorious/core';
import type { Filter, Selection, User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import hotkeys from 'hotkeys-js';
import type { TextAnnotatorState } from './state';
import type { TextAnnotation, TextAnnotationTarget } from './model';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';
import {
  clonePointerEvent,
  cloneKeyboardEvent,
  debounce,
  splitAnnotatableRanges,
  rangeToSelector,
  isMac,
  isWhitespaceOrEmpty,
  trimRangeToContainer,
  isNotAnnotatable
} from './utils';

const CLICK_TIMEOUT = 300;

const ARROW_KEYS = ['up', 'down', 'left', 'right'];

const SELECT_ALL = isMac ? '⌘+a' :  'ctrl+a';

const SELECTION_KEYS = [
  ...ARROW_KEYS.map(key => `shift+${key}`),
  SELECT_ALL
];

export const SelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  options: TextAnnotatorOptions<TextAnnotation, unknown>
) => {

  let currentUser: User | undefined;

  const { annotatingEnabled, offsetReferenceSelector, selectionMode } = options;

  const setUser = (user?: User) => currentUser = user;

  let currentFilter: Filter | undefined;

  const setFilter = (filter?: Filter) => currentFilter = filter;

  const { store, selection } = state;

  let currentTarget: TextAnnotationTarget | undefined;

  let isLeftClick: boolean | undefined;

  let lastDownEvent: Selection['event'] | undefined;

  const onSelectStart = (evt: Event) => {
    if (isLeftClick === false)
      return;

    /**
     * Make sure we don't listen to selection changes that were
     * not started on the container, or which are not supposed to
     * be annotatable (like a component popup).
     * Note that Chrome/iOS will sometimes return the root doc as target!
     */
    currentTarget = isNotAnnotatable(evt.target as Node)
      ? undefined
      : {
        annotation: uuidv4(),
        selector: [],
        creator: currentUser,
        created: new Date()
      };
  };

  const onSelectionChange = debounce((evt: Event) => {
    const sel = document.getSelection();

    /**
     * In iOS when a user clicks on a button, the `selectionchange` event is fired.
     * However, the generated selection is empty and the `anchorNode` is `null`.
     * That doesn't give us information about whether the selection is in the annotatable area
     * or whether the previously selected text was dismissed.
     * Therefore - we should bail out from such a range processing.
     *
     * @see https://github.com/recogito/text-annotator-js/pull/164#issuecomment-2416961473
     */
    if (!sel?.anchorNode) {
      return;
    }

    /**
     * This is to handle cases where the selection is "hijacked"
     * by another element in a not-annotatable area.
     * A rare case in theory.
     * But rich text editors will like Quill do it.
     */
    if (isNotAnnotatable(sel.anchorNode)) {
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
     * During mouse selection on the desktop, the annotation won't usually exist while the selection is being edited.
     * But it'll be typical during selection via the keyboard or mobile's handlebars.
     */
    if (store.getAnnotation(currentTarget.annotation)) {
      store.updateTarget(currentTarget, Origin.LOCAL);
    } else {
      // Proper lifecycle management: clear the previous selection first...
      selection.clear();
    }
  });

  /**
   * Select events don't carry information about the mouse button.
   * Therefore, to prevent right-click selection, we need to listen
   * to the initial pointerdown event and remember the button
   */
  const onPointerDown = (evt: PointerEvent) => {
    if (isNotAnnotatable(evt.target as Node)) return;

    /**
     * Cloning the event to prevent it from accidentally being `undefined`
     * @see https://github.com/recogito/text-annotator-js/commit/65d13f3108c429311cf8c2523f6babbbc946013d#r144033948
     */
    lastDownEvent = clonePointerEvent(evt);
    isLeftClick = lastDownEvent.button === 0;
  };

  const onPointerUp = (evt: PointerEvent) => {
    if (isNotAnnotatable(evt.target as Node) || !isLeftClick) return;

    // Logic for selecting an existing annotation
    const clickSelect = () => {
      const { x, y } = container.getBoundingClientRect();

      const hovered =
        evt.target instanceof Node &&
        container.contains(evt.target) &&
        store.getAt(evt.clientX - x, evt.clientY - y, selectionMode === 'all', currentFilter);

      if (hovered) {
        const { selected } = selection;

        const currentIds = new Set(selected.map(s => s.id));
        const nextIds = Array.isArray(hovered) ? hovered.map(a => a.id) : [hovered.id];

        const hasChanged =
          currentIds.size !== nextIds.length ||
          !nextIds.every(id => currentIds.has(id));

        if (hasChanged)
          selection.userSelect(nextIds, evt);
      } else {
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
        upsertCurrentTarget();
        selection.userSelect(currentTarget.annotation, clonePointerEvent(evt));
      }
    });
  }

  const onContextMenu = (evt: PointerEvent) => {
    const sel = document.getSelection();

    if (sel?.isCollapsed) return;

    /**
     * When selecting the initial word, Chrome Android
     * fires the `contextmenu` before the `selectionchange`
     */
    if (!currentTarget || currentTarget.selector.length === 0) {
      onSelectionChange(evt);
    }
    
    upsertCurrentTarget();

    selection.userSelect(currentTarget.annotation, clonePointerEvent(evt));
  }

  const onKeyup = (evt: KeyboardEvent) => {
    if (evt.key === 'Shift' && currentTarget) {
      const sel = document.getSelection();

      if (!sel.isCollapsed) {
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

  // Helper
  const upsertCurrentTarget = () => {
    const existingAnnotation = store.getAnnotation(currentTarget.annotation);
    if (!existingAnnotation) {
      store.addAnnotation({
        id: currentTarget.annotation,
        bodies: [],
        target: currentTarget
      });
      return;
    }

    const { target: { updated: existingTargetUpdated } } = existingAnnotation;
    const { updated: currentTargetUpdated } = currentTarget;
    if (
      !existingTargetUpdated ||
      !currentTargetUpdated ||
      existingTargetUpdated < currentTargetUpdated
    ) {
      store.updateTarget(currentTarget);
    }
  };

  container.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('contextmenu', onContextMenu);

  if (annotatingEnabled) {
    container.addEventListener('keyup', onKeyup);
    container.addEventListener('selectstart', onSelectStart);
    document.addEventListener('selectionchange', onSelectionChange);
  }

  const destroy = () => {
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
    setUser
  }

}

