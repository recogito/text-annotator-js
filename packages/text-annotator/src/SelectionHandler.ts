import { Filter, Origin, type User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotatorState } from './state';
import type { TextAnnotationTarget } from './model';
import {
  debounce,
  splitAnnotatableRanges,
  rangeToSelector,
  isWhitespaceOrEmpty,
  trimRangeToContainer,
  NOT_ANNOTATABLE_SELECTOR
} from './utils';

const CLICK_TIMEOUT = 300;

export const SelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState,
  annotatingEnabled: boolean,
  offsetReferenceSelector?: string
) => {

  let currentUser: User | undefined;

  const setUser = (user?: User) => currentUser = user;

  let currentFilter: Filter | undefined;

  const setFilter = (filter?: Filter) => currentFilter = filter;

  const { store, selection } = state;

  let currentTarget: TextAnnotationTarget | undefined;

  let isLeftClick = false;

  let lastPointerDown: PointerEvent | undefined;

  const onSelectStart = (evt: PointerEvent) => {
    if (!isLeftClick) return;

    // Make sure we don't listen to selection changes that were
    // not started on the container, or which are not supposed to
    // be annotatable (like a component popup).
    // Note that Chrome/iOS will sometimes return the root doc as target!
    const annotatable = !(evt.target as Node).parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    currentTarget = annotatable ? {
      annotation: uuidv4(),
      selector: [],
      creator: currentUser,
      created: new Date()
    } : undefined;
  }

  if (annotatingEnabled)
    container.addEventListener('selectstart', onSelectStart);

  const onSelectionChange = debounce((evt: PointerEvent) => {
    const sel = document.getSelection();

    // This is to handle cases where the selection is "hijacked" by another element
    // in a not-annotatable area. A rare case in theory. But rich text editors
    // will like Quill do it...
    const annotatable = !sel.anchorNode?.parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    if (!annotatable) {
      currentTarget = undefined;
      return;
    }


    const timeDifference = evt.timeStamp - (lastPointerDown?.timeStamp || evt.timeStamp);

    if (timeDifference < 1000 && !currentTarget) {

      // Chrome/iOS does not reliably fire the 'selectstart' event!
      onSelectStart(lastPointerDown);

    } else if (sel.isCollapsed && timeDifference < CLICK_TIMEOUT) {

      /*
       Firefox doesn't fire the 'selectstart' when user clicks
       over the text, which collapses the selection
      */
      onSelectStart(lastPointerDown);

    }

    // The selection isn't active -> bail out from selection change processing
    if (!currentTarget) return;

    /**
     * The selection range got collapsed during the selecting process.
     * The previously created annotation isn't relevant anymore and can be discarded
     *
     * @see https://github.com/recogito/text-annotator-js/issues/139
     */
    if (sel.isCollapsed && store.getAnnotation(currentTarget.annotation)) {
      selection.clear();
      store.deleteAnnotation(currentTarget.annotation);
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

    if (store.getAnnotation(currentTarget.annotation)) {
      store.updateTarget(currentTarget, Origin.LOCAL);
    } else {
      // Proper lifecycle management: clear selection first...
      selection.clear();

      // ...then add annotation to store...
      store.addAnnotation({
        id: currentTarget.annotation,
        bodies: [],
        target: currentTarget
      });

      // ...then make the new annotation the current selection. (Reminder:
      // select events don't have offsetX/offsetY - reuse last up/down)
      selection.userSelect(currentTarget.annotation, lastPointerDown);
    }
  })

  if (annotatingEnabled)
    document.addEventListener('selectionchange', onSelectionChange);

  // Select events don't carry information about the mouse button
  // Therefore, to prevent right-click selection, we need to listen
  // to the initial pointerdown event and remember the button
  const onPointerDown = (evt: PointerEvent) => {
    // Note that the event itself can be ephemeral!
    const { target, timeStamp, offsetX, offsetY, type } = evt;
    lastPointerDown = { ...evt, target, timeStamp, offsetX, offsetY, type };

    isLeftClick = evt.button === 0;
  }

  document.addEventListener('pointerdown', onPointerDown);

  const onPointerUp = (evt: PointerEvent) => {
    const annotatable = !(evt.target as Node).parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
    if (!annotatable || !isLeftClick)
      return;

    // Logic for selecting an existing annotation by clicking it
    const clickSelect = () => {
      const { x, y } = container.getBoundingClientRect();

      const hovered =
        evt.target instanceof Node &&
        container.contains(evt.target) &&
        store.getAt(evt.clientX - x, evt.clientY - y, currentFilter);

      if (hovered) {
        const { selected } = selection;

        if (selected.length !== 1 || selected[0].id !== hovered.id)
          selection.userSelect(hovered.id, evt);
      } else if (!selection.isEmpty()) {
        selection.clear();
      }
    }

    const sel = document.getSelection();
    const timeDifference = evt.timeStamp - lastPointerDown.timeStamp;

    // Just a click, not a selection
    if (sel?.isCollapsed && timeDifference < CLICK_TIMEOUT) {
      currentTarget = undefined;
      clickSelect();
    } else if (currentTarget) {
      selection.userSelect(currentTarget.annotation, evt);
    }
  }

  document.addEventListener('pointerup', onPointerUp);

  const destroy = () => {
    container.removeEventListener('selectstart', onSelectStart);
    document.removeEventListener('selectionchange', onSelectionChange);

    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', onPointerUp);
  }

  return {
    destroy,
    setFilter,
    setUser
  }

}
