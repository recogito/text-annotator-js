import debounce from 'debounce';
import { v4 as uuidv4 } from 'uuid';
import hotkeys from 'hotkeys-js';
import { poll } from 'poll';
import { Origin } from '@annotorious/core';
import type { Filter, Lifecycle, Selection, User } from '@annotorious/core';
import type { TextAnnotatorState } from './state';
import type { TextAnnotation, TextAnnotationTarget } from './model';
import type { AnnotatingMode } from './TextAnnotator';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';
import {
  clonePointerEvent,
  cloneKeyboardEvent,
  splitAnnotatableRanges,
  rangeToSelector,
  isMac,
  isRangeWhitespaceOrEmpty,
  trimRangeToContainer,
  isNotAnnotatable,
  mergeRanges
} from './utils';

const CLICK_TIMEOUT = 300;

const ARROW_KEYS = ['up', 'down', 'left', 'right'];

const SELECT_ALL = isMac ? '⌘+a' : 'ctrl+a';

const SELECTION_KEYS = [
  ...ARROW_KEYS.map(key => `shift+${key}`),
  SELECT_ALL
];

export const createSelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  lifecycle: Lifecycle<TextAnnotation, unknown>,
  options: TextAnnotatorOptions<TextAnnotation, unknown>
) => {
  const { store, selection } = state;

  let currentUser: User | undefined;

  const {
    annotatingEnabled,
    offsetReferenceSelector,
    selectionMode,
    dismissOnNotAnnotatable = 'NEVER'
  } = options;

  let currentFilter: Filter | undefined;

  let currentAnnotatingEnabled = annotatingEnabled;

  let annotatingMode: AnnotatingMode = 'CREATE_NEW';

  let currentTarget: TextAnnotationTarget | undefined;

  // Only used if allowModifierSelect === true or if
  // annotatingMode === 'ADD_TO_CURRENT' | 'REPLACE_CURRENT'
  let targetToModify: TextAnnotationTarget | undefined;

  let isLeftClick: boolean | undefined;

  let lastDownEvent: Selection['event'] | undefined;

  const setAnnotatingEnabled = (enabled: boolean) => {
    currentAnnotatingEnabled = enabled;
    onSelectionChange.clear();

    if (!enabled) {
      targetToModify = undefined;
      currentTarget = undefined;
      isLeftClick = undefined;
      lastDownEvent = undefined;
    }
  }

  const setAnnotatingMode = (mode?: AnnotatingMode) => annotatingMode = mode || 'CREATE_NEW';

  const setFilter = (filter?: Filter) => currentFilter = filter;
  
  const setUser = (user?: User) => currentUser = user;

  const isAddToCurrentSelect = (evt: Event) => {
    if (annotatingMode === 'ADD_TO_CURRENT')
      return true;

    if (options.allowModifierSelect) {
      const asPtr = evt as PointerEvent;
      return isMac ? asPtr.metaKey : asPtr.ctrlKey;
    } else {
      return false;
    }
  }

  const onSelectStart = () => {
    if (!currentAnnotatingEnabled) return;

    if (isLeftClick === false) return;

    const { selected } = selection;

    // Will this selection modify an existing annotation?
    const isModifyExisting = (
      isAddToCurrentSelect(lastDownEvent) || annotatingMode === 'REPLACE_CURRENT'
    ) && selected.length === 1
      && selected[0].editable;

    if (isModifyExisting) {
      const existing = store.getAnnotation(selected[0].id);

      if (existing?.target) {
        targetToModify = existing.target;

        currentTarget = {
          annotation: existing.id,
          selector: [],
          created: targetToModify.created,
          creator: targetToModify.creator,
          updated: new Date(),
          updatedBy: currentUser
        };

        return;
      }
    }

    targetToModify = undefined;

    currentTarget = {
      annotation: uuidv4(),
      selector: [],
      created: new Date(),
      creator: currentUser
    };
  };

  const onSelectionChange = debounce((evt: Event) => {
    if (!currentAnnotatingEnabled) return;

    const sel = document.getSelection();

    /**
     * In iOS when a user clicks on a button, the `selectionchange` event is fired.
     * However, the generated selection is empty and the `anchorNode` is `null`. That
     * doesn't give us information about whether the selection is in the annotatable area
     * or whether the previously selected text was dismissed. Therefore we should bail
     * out from such a range processing.
     *
     * @see https://github.com/recogito/text-annotator-js/pull/164#issuecomment-2416961473
     */
    if (!sel?.anchorNode) return;

    const selectionRanges =
      Array.from(Array(sel.rangeCount).keys()).map(idx => sel.getRangeAt(idx));

    /**
     * This is to handle cases where the selection is "hijacked" by
     * another element in a not-annotatable area. A rare case in practice.
     * But rich text editors like Quill will do it!
     */
    if (!selectionRanges.some(r => r.intersectsNode(container))) {
      currentTarget = undefined;
      return;
    }

    const timeDifference = evt.timeStamp - (lastDownEvent?.timeStamp || evt.timeStamp);

    /**
     * The selection start needs to be emulated for some platforms, but only 
     * for the pointer events! (Keyboard events fire consistently on desktops 
     * and the `timeDifference` will always be <10ms between `keydown` and
     * `selectionchange`)
     */
    if (lastDownEvent?.type === 'pointerdown') {
      if (timeDifference < 1000 && !currentTarget) {
        // Chrome/iOS does not reliably fire the 'selectstart' event!
        onSelectStart();
      } else if (sel.isCollapsed && timeDifference < CLICK_TIMEOUT) {
        // Firefox doesn't fire the 'selectstart' when user clicks
        // over the text, which collapses the selection
        onSelectStart();
      }
    }

    if (!currentTarget) onSelectStart();

    if (sel.isCollapsed) {
      /**
       * The selection range got collapsed during the selecting process. Unless this
       * is intentional (CTRL + select, modifying existing annotations), the previously 
       * created annotation isn't relevant anymore and can be discarded
       *
       * @see https://github.com/recogito/text-annotator-js/issues/139
       */
      if (store.getAnnotation(currentTarget.annotation) && !(
        isAddToCurrentSelect(lastDownEvent) || annotatingMode === 'REPLACE_CURRENT'
      )) {
        selection.clear();
        store.deleteAnnotation(currentTarget.annotation);
      }

      return;
    }

    const containedRanges =
      selectionRanges.map(r => trimRangeToContainer(r, container));

    // The selection should be captured only within the annotatable container
    if (containedRanges.every(r => isRangeWhitespaceOrEmpty(r))) return;

    const annotatableRanges = containedRanges.flatMap(r => splitAnnotatableRanges(container, r.cloneRange()));

    const hasChanged =
      (annotatableRanges.length > 0 && !currentTarget) ||
      annotatableRanges.length !== currentTarget.selector.length ||
      annotatableRanges.some((r, i) => r.toString() !== currentTarget.selector[i]?.quote);

    if (!hasChanged) return;

    /** 
     * The annotatable ranges are:
     * - the current annotatable ranges
     * - the ranges of the existing annotatation IFF we are adding to the current
     */
    const combinedRanges = (isAddToCurrentSelect(lastDownEvent) && targetToModify) ? mergeRanges([ 
      ...(targetToModify.selector.map(s => s.range)),
      ...annotatableRanges
    ]) : annotatableRanges;

    currentTarget = {
      ...currentTarget,
      selector: combinedRanges.map(r => rangeToSelector(r, container, offsetReferenceSelector)),
      updated: new Date()
    };

    /** 
     * If we're modifying (adding to/replacing) an existing annotation, we don't 
     * need to perform the steps below.
     * 
     * - We don't want to clear the selection
     * - We don't want to update the target until mouse-up
     * 
     * CAVEAT: this won't work with keyboard selection yet. Ideally, we'd need an explicit
     * "isKeyboardSelection" flag to handle this case correctly.
     */
    if (isAddToCurrentSelect(lastDownEvent) || annotatingMode === 'REPLACE_CURRENT') return;

    /**
     * During mouse selection on the desktop, the annotation won't usually exist while the selection is being edited.
     * But it'll be typical during selection via the keyboard or mobile's handlebars.
     */
    if (store.getAnnotation(currentTarget.annotation)) {
      store.updateTarget(currentTarget, Origin.LOCAL);
    } else {
      // Proper lifecycle management: clear the previous selection first
      selection.clear();
    }
  }, 10);

  /**
   * Select events don't carry information about the mouse button.
   * Therefore, to prevent right-click selection, we need to listen
   * to the initial pointerdown event and remember the button
   */
  const onPointerDown = (evt: PointerEvent) => {
    /**
     * Cloning the event to prevent it from accidentally being `undefined`
     * @see https://github.com/recogito/text-annotator-js/commit/65d13f3108c429311cf8c2523f6babbbc946013d#r144033948
     */
    lastDownEvent = clonePointerEvent(evt);
    isLeftClick = lastDownEvent.button === 0;
  };

  const onPointerUp = async (evt: PointerEvent) => {
    if (!isLeftClick) return;

    const lastUpEvent = clonePointerEvent(evt);

    // Logic for selecting an existing annotation
    const clickSelect = () => {
      const { x, y } = container.getBoundingClientRect();

      if (isNotAnnotatable(container, lastUpEvent.target as Node)) {
        const shouldDismissSelection = typeof dismissOnNotAnnotatable === 'function'
          ? dismissOnNotAnnotatable(lastUpEvent, container)
          : dismissOnNotAnnotatable === 'ALWAYS';
        if (shouldDismissSelection) {
          selection.clear();
        }
        return;
      }

      const hovered =
        lastUpEvent.target instanceof Node &&
        container.contains(lastUpEvent.target) &&
        store.getAt(
          lastUpEvent.clientX - x,
          lastUpEvent.clientY - y,
          selectionMode === 'all',
          currentFilter
        );

      if (hovered) {
        const { selected } = selection;

        const currentIds = new Set(selected.map(s => s.id));
        const nextIds = Array.isArray(hovered) ? hovered.map(a => a.id) : [hovered.id];

        const hasChanged =
          currentIds.size !== nextIds.length ||
          !nextIds.every(id => currentIds.has(id));

        if (hasChanged) {
          lifecycle.emit('clickAnnotation', hovered);
          selection.userSelect(nextIds, lastUpEvent);
        }
      } else {
        selection.clear();
      }
    };

    const timeDifference = lastUpEvent.timeStamp - lastDownEvent.timeStamp;
    if (timeDifference < CLICK_TIMEOUT) {
      await pollSelectionCollapsed();

      const sel = document.getSelection();

      const isDownOnNotAnnotatable =
        isNotAnnotatable(container, lastDownEvent.target as Node);

      const isUpOnNotAnnotatable = 
        isNotAnnotatable(container, lastUpEvent.target as Node);

      /**
       * Route to `clickSelect` if selection is collapsed OR the click happened
       * entirely over a not-annotatable element.
       *
       * The latter allows preventing re-selection of an existing annotation
       * when a user clicks on not-annotatable controls. For example, a click
       * on a `button` element doesn't make the selection collapse, but it still 
       * needs to be processed with `clickSelect`.
       */
      if (sel?.isCollapsed || (isDownOnNotAnnotatable && isUpOnNotAnnotatable)) {
        currentTarget = undefined;
        clickSelect();
        return;
      }
    }

    if (currentTarget && currentTarget.selector.length > 0) {
      upsertCurrentTarget();
      selection.userSelect(currentTarget.annotation, lastUpEvent);
    }
  }

  /**
   * We must check the `isCollapsed` after an unspecified timeout
   * to handle the annotation dismissal after a click properly.
   *
   * Otherwise, the `isCollapsed` will return an obsolete `false` value,
   * click won't be processed, and the annotation will get falsely re-selected.
   *
   * @see https://github.com/recogito/text-annotator-js/issues/136#issue-2465915707
   * @see https://github.com/recogito/text-annotator-js/issues/136#issuecomment-2413773804
   */
  const pollSelectionCollapsed = async () => {
    const sel = document.getSelection();

    let stopPolling = false;
    let isCollapsed = sel?.isCollapsed;
    const shouldStopPolling = () => isCollapsed || stopPolling;

    const pollingDelayMs = 1;
    const stopPollingInMs = 50;
    setTimeout(() => stopPolling = true, stopPollingInMs);

    return poll(() => isCollapsed = sel?.isCollapsed, pollingDelayMs, shouldStopPolling);
  }

  const onContextMenu = (evt: PointerEvent) => {
    const sel = document.getSelection();

    if (sel?.isCollapsed) return;

    /**
     * When selecting the initial word, Chrome Android
     * fires `contextmenu`before `selectionchange`
     */
    if (!currentTarget || currentTarget.selector.length === 0) {
      onSelectionChange(evt);
    }
    
    /**
     * The selection couldn't be initiated - might span over a not-annotatable element.
     */
    if (!currentTarget) return;
    upsertCurrentTarget();

    selection.userSelect(currentTarget.annotation, clonePointerEvent(evt));
  }

  const onKeyup = (evt: KeyboardEvent) => {
    if (!currentAnnotatingEnabled) return;

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
    onSelectStart();
  }

  hotkeys(SELECTION_KEYS.join(','), { element: container, keydown: true, keyup: false }, evt => {
    if (!evt.repeat)
      lastDownEvent = cloneKeyboardEvent(evt);
  });

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
    } else {
      const { target: { updated: existingTargetUpdated } } = existingAnnotation;
      const { updated: currentTargetUpdated } = currentTarget;

      if (
        !existingTargetUpdated ||
        !currentTargetUpdated ||
        existingTargetUpdated < currentTargetUpdated
      ) {
        store.updateTarget(currentTarget);
      }
    }
  };

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('contextmenu', onContextMenu);

  container.addEventListener('keyup', onKeyup);
  container.addEventListener('selectstart', onSelectStart);
  document.addEventListener('selectionchange', onSelectionChange);

  const destroy = () => {
    currentTarget = undefined;
    targetToModify = undefined;
    isLeftClick = undefined;
    lastDownEvent = undefined;

    onSelectionChange.clear();

    document.removeEventListener('pointerdown', onPointerDown);
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
    setAnnotatingEnabled,
    setAnnotatingMode
  }

}

