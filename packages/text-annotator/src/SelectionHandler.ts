import { Origin, type User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotatorState } from './state';
import type { TextSelector, TextAnnotationTarget } from './model';
import { debounce, trimRange } from './utils';

export const rangeToSelector = (range: Range, container: HTMLElement, offsetReferenceSelector?: string): TextSelector => {
  const rangeBefore = document.createRange();

  const offsetReference: HTMLElement = offsetReferenceSelector ? 
    (range.startContainer.parentElement as HTMLElement).closest(offsetReferenceSelector) : container;

  // A helper range from the start of the contentNode to the start of the selection
  rangeBefore.setStart(offsetReference, 0);
  rangeBefore.setEnd(range.startContainer, range.startOffset);

  const quote = range.toString();
  const start = rangeBefore.toString().length;
  const end = start + quote.length;

  return offsetReferenceSelector ?
    { quote, start, end, range, offsetReference } :
    { quote, start, end, range };
}

export const SelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState,
  offsetReferenceSelector?: string
) => {

  const { store, selection } = state;

  let currentUser: User;

  let currentTarget: TextAnnotationTarget | undefined;

  const setUser = (user: User) => currentUser = user;

  let isLeftClick = false;

  let lastPointerDown: PointerEvent | undefined;

  const onSelectStart = (evt: PointerEvent) => {
    if (!isLeftClick) return;

    // Make sure we don't listen to selection changes that were
    // not started on the container, or which are not supposed to
    // be annotatable (like a component popup).
    // Note that Chrome/iOS will sometimes return the root doc as target!
    const annotatable = !(evt.target as Node).parentElement?.closest('.not-annotatable');
    if (annotatable) {
      currentTarget = {
        annotation: uuidv4(),
        selector: undefined,
        creator: currentUser,
        created: new Date()
      };
    } else {
      currentTarget = undefined;
    }
  }

  container.addEventListener('selectstart', onSelectStart);

  const onSelectionChange = debounce( (evt: PointerEvent) => {
    const sel = document.getSelection();

    // Chrome/iOS does not reliably fire the 'selectstart' event!
    if (evt.timeStamp - lastPointerDown.timeStamp < 1000 && !currentTarget)
      onSelectStart(lastPointerDown);

    if (!sel.isCollapsed && isLeftClick && currentTarget) {
      const ranges = Array.from(Array(sel.rangeCount).keys())
        .map(idx => sel.getRangeAt(idx));

      const trimmed = trimRange(ranges[0]);

      const hasChanged =
        trimmed.toString() !== currentTarget.selector?.quote;

      if (hasChanged) {
        currentTarget = {
          ...currentTarget,
          selector: rangeToSelector(ranges[0], container, offsetReferenceSelector)
        };

        if (store.getAnnotation(currentTarget.annotation)) {
          store.updateTarget(currentTarget, Origin.LOCAL);
        } else {
          store.addAnnotation({
            id: currentTarget.annotation,
            bodies: [],
            target: currentTarget
          });

          // Reminder: select events don't have offsetX/offsetY - reuse last up/down
          selection.clickSelect(currentTarget.annotation, lastPointerDown);
        }
      }
    }
  })

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

  container.addEventListener('pointerdown', onPointerDown);

  const onPointerUp = (evt: PointerEvent) => {
    const annotatable = !(evt.target as Node).parentElement?.closest('.not-annotatable');
    if (!annotatable || !isLeftClick)
      return;

    // Logic for selecting an existing annotation by clicking it
    const clickSelect = () => {
      const { x, y } = container.getBoundingClientRect();

      const hovered = store.getAt(evt.clientX - x, evt.clientY - y);
      if (hovered) {
        const { selected } = selection;

        if (selected.length !== 1 || selected[0].id !== hovered.id)
          selection.clickSelect(hovered.id, evt);
      } else if (!selection.isEmpty()) {
        selection.clear();
      }
    }

    const timeDifference = evt.timeStamp - lastPointerDown.timeStamp;

    // Just a click, not a selection
    if (document.getSelection().isCollapsed && timeDifference < 300) {
      currentTarget = undefined;
      clickSelect();
    } else {
      selection.clickSelect(currentTarget.annotation, evt);
    }
  }

  document.addEventListener('pointerup', onPointerUp);

  const destroy = () => {
    container.removeEventListener('selectstart', onSelectStart);
    document.removeEventListener('selectionchange', onSelectionChange);
    container.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', onPointerUp);
  }

  return {
    destroy,
    setUser
  }

}
