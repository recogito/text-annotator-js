import { debounce } from './utils/debounce';
import { Origin, type Filter, type Selection, type User, type AnnotatorOptions } from './types';
import type { SelectionProxy } from './proxies/selectionProxy';
import type { StoreProxy } from './proxies/storeProxy';
import type { TextAnnotation, TextAnnotationTarget } from './model';
import {
  clonePointerEvent,
  cloneKeyboardEvent,
  splitAnnotatableRanges,
  rangeToSelector,
  isMac,
  isRangeWhitespaceOrEmpty,
  trimRangeToContainer,
  isNotAnnotatable,
  mergeRanges,
  isRangeAnnotatable
} from './utils';

const CLICK_TIMEOUT = 300;

// Simple polling utility (replaces 'poll' package)
const poll = async <T>(
  fn: () => T,
  interval: number,
  shouldStop: () => boolean
): Promise<T> => {
  return new Promise((resolve) => {
    const check = () => {
      const result = fn();
      if (shouldStop()) {
        resolve(result);
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
};

export type AnnotatingMode = 'CREATE_NEW' | 'ADD_TO_CURRENT' | 'REPLACE_CURRENT';

export type DismissOnNotAnnotatable = 'ALWAYS' | 'NEVER' | ((event: PointerEvent, container: HTMLElement) => boolean);

export interface SelectionHandlerOptions<I extends TextAnnotation = TextAnnotation> extends AnnotatorOptions<I> {
  offsetReferenceSelector?: string;
  allowModifierSelect?: boolean;
  dismissOnNotAnnotatable?: DismissOnNotAnnotatable;
}

export interface SelectionHandler {
  destroy(): void;
  setFilter(filter?: Filter): void;
  setUser(user?: User): void;
  setAnnotatingEnabled(enabled: boolean): void;
  setAnnotatingMode(mode?: AnnotatingMode): void;
}

export const createSelectionHandler = (
  container: HTMLElement,
  selectionProxy: SelectionProxy,
  onClickAnnotation: (annotation: TextAnnotation | TextAnnotation[]) => void,
  options: SelectionHandlerOptions<TextAnnotation>,
  storeProxy: StoreProxy<TextAnnotation>
): SelectionHandler => {

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

    const selected = selectionProxy.getSelected();

    // Will this selection modify an existing annotation?
    const isModifyExisting = (
      isAddToCurrentSelect(lastDownEvent) || annotatingMode === 'REPLACE_CURRENT'
    ) && selected.length === 1
      && selected[0].editable;

    if (isModifyExisting) {
      const existing = storeProxy.getAnnotation(selected[0].id);

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
      annotation: crypto.randomUUID(),
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
     */
    if (!sel?.anchorNode) return;

    const selectionRanges =
      Array.from(Array(sel.rangeCount).keys()).map(idx => sel.getRangeAt(idx));

    /**
     * This is to handle cases where the selection is "hijacked" by
     * another element in a not-annotatable area. A rare case in practice.
     * But rich text editors like Quill will do it!
     */
    if (selectionRanges.every(r => !isRangeAnnotatable(container, r))) {
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

    /*
     Let's assume the user drags the selection from outside the annotatable area
     over the annotatable area (intersection!). Then drags it out again
     (no intersection!), then in again (intersection). Because the
     currentTarget will have been cleared, meanwhile, execution will stop.

     But we don't want this - instead, processing should continue as normal,
     and a new currentTarget should be computed when the user drags the
     selection into the annotatable area a second time.
    */
    if (!currentTarget) {
      onSelectStart();

      // If the currentTarget is still missing -> bail out
      if (!currentTarget) return;
    }

    if (sel.isCollapsed) {
      /**
       * The selection range got collapsed during the selecting process. Unless this
       * is intentional (CTRL + select, modifying existing annotations), the previously
       * created annotation isn't relevant anymore and can be discarded
       */
      if (storeProxy.getAnnotation(currentTarget.annotation) && !(
        isAddToCurrentSelect(lastDownEvent) || annotatingMode === 'REPLACE_CURRENT'
      )) {
        selectionProxy.clear();
        storeProxy.deleteAnnotation(currentTarget.annotation);
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
     */
    if (isAddToCurrentSelect(lastDownEvent) || annotatingMode === 'REPLACE_CURRENT') return;

    /**
     * During mouse selection on the desktop, the annotation won't usually exist while the selection is being edited.
     * But it'll be typical during selection via the keyboard or mobile's handlebars.
     */
    if (storeProxy.getAnnotation(currentTarget.annotation)) {
      storeProxy.updateTarget(currentTarget, Origin.LOCAL);
    } else {
      // Proper lifecycle management: clear the previous selection first
      selectionProxy.clear();
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
          selectionProxy.clear();
        }
        return;
      }

      const hovered =
        lastUpEvent.target instanceof Node &&
        container.contains(lastUpEvent.target) &&
        storeProxy.getAt(
          lastUpEvent.clientX - x,
          lastUpEvent.clientY - y,
          selectionMode === 'all',
          currentFilter
        );

      if (hovered) {
        const selected = selectionProxy.getSelected();

        const currentIds = new Set(selected.map(s => s.id));
        const nextIds = Array.isArray(hovered) ? hovered.map(a => a.id) : [hovered.id];

        const hasChanged =
          currentIds.size !== nextIds.length ||
          !nextIds.every(id => currentIds.has(id));

        if (hasChanged) {
          onClickAnnotation(hovered);
          selectionProxy.userSelect(nextIds, lastUpEvent);
        }
      } else {
        selectionProxy.clear();
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
       */
      if (sel?.isCollapsed || (isDownOnNotAnnotatable && isUpOnNotAnnotatable)) {
        currentTarget = undefined;
        clickSelect();
        return;
      }
    }

    if (currentTarget && currentTarget.selector.length > 0) {
      upsertCurrentTarget();
      selectionProxy.userSelect(currentTarget.annotation, lastUpEvent);
    }
  }

  /**
   * We must check the `isCollapsed` after an unspecified timeout
   * to handle the annotation dismissal after a click properly.
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

    selectionProxy.userSelect(currentTarget.annotation, clonePointerEvent(evt));
  }

  const onKeyup = (evt: KeyboardEvent) => {
    if (!currentAnnotatingEnabled) return;

    if (evt.key === 'Shift' && currentTarget) {
      const sel = document.getSelection();

      if (!sel.isCollapsed) {
        upsertCurrentTarget();
        selectionProxy.userSelect(currentTarget.annotation, cloneKeyboardEvent(evt));
      }
    }
  }

  // Helper
  const upsertCurrentTarget = () => {
    const existingAnnotation = storeProxy.getAnnotation(currentTarget.annotation);
    if (!existingAnnotation) {
      storeProxy.addAnnotation({
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
        storeProxy.updateTarget(currentTarget);
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
  };

  return {
    destroy,
    setFilter,
    setUser,
    setAnnotatingEnabled,
    setAnnotatingMode
  }

}
