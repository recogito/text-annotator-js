import { Origin, type User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotatorState } from './state';
import type { TextSelector, TextAnnotationTarget, TextSelectorQuote } from './model';
import { trimRange } from './utils';

const rangeToQuote = (range: Range): TextSelectorQuote => {
  /**
   * Captures the prefix and suffix snippets of the selection to match the `Text Quote Selector` spec
   * @see https://www.w3.org/TR/annotation-model/#text-quote-selector
   */
  const snippetLength = 10;

  const rangePrefix = document.createRange();
  rangePrefix.setStart(range.startContainer, Math.max(range.startOffset - snippetLength, 0));
  rangePrefix.setEnd(range.startContainer, range.startOffset);

  const rangeSuffix = document.createRange();
  rangeSuffix.setStart(range.endContainer, range.endOffset);
  rangeSuffix.setEnd(range.endContainer, Math.min(range.endOffset + snippetLength, range.endContainer.textContent.length));

  return {
    exact: range.toString(),
    prefix: rangePrefix.toString(),
    suffix: rangeSuffix.toString()
  }
}

export const rangeToSelector = (range: Range, container: HTMLElement, offsetReferenceSelector?: string): TextSelector => {
  const offsetReference: HTMLElement = offsetReferenceSelector
      ? (range.startContainer.parentElement as HTMLElement).closest(offsetReferenceSelector)
      : container;

  // Helper range from the start of the contentNode to the start of the selection
  const rangeBefore = document.createRange();
  rangeBefore.setStart(offsetReference, 0);
  rangeBefore.setEnd(range.startContainer, range.startOffset);

  const quote = rangeToQuote(range);
  const start = rangeBefore.toString().length;
  const end = start + quote.exact.length;

  return offsetReferenceSelector ?
    { quote, start, end, range, offsetReference } :
    { quote, start, end, range };
}

export const SelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState,
  // Experimental
  offsetReferenceSelector?: string
) => {

  const { store, selection } = state;

  let currentUser: User;

  let currentTarget: TextAnnotationTarget = null;

  const setUser = (user: User) => currentUser = user;

  let isLeftClick = false;

  let lastPointerEvent: PointerEvent;

  container.addEventListener('selectstart', (evt: PointerEvent) => {
    if (!isLeftClick)
      return;

    // Make sure we don't listen to selection changes that
    // were not started on the container, or which are not supposed to
    // be annotatable (like the popup)
    const annotatable = !(evt.target as Node).parentElement.closest('.not-annotatable');
    if (annotatable) {
      currentTarget = {
        annotation: uuidv4(),
        selector: undefined,
        creator: currentUser,
        created: new Date()
      };
    } else {
      currentTarget = null;
      lastPointerEvent = undefined;
    }
  });

  let debounceTimer: ReturnType<typeof setTimeout> = undefined;

  document.addEventListener('selectionchange', (evt: PointerEvent) => {
    if (debounceTimer)
      clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => onSelectionChange(), 50);
  });

  const onSelectionChange = () => {
    const sel = document.getSelection();

    if (!sel.isCollapsed && isLeftClick && currentTarget) {
      const ranges = Array.from(Array(sel.rangeCount).keys())
        .map(idx => sel.getRangeAt(idx));

      const trimmed = trimRange(ranges[0]);

      const hasChanged =
        trimmed.toString() !== currentTarget.selector?.range?.toString();

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
          selection.clickSelect(currentTarget.annotation, lastPointerEvent);
        }
      }
    }
  }

  // Select events don't carry information about the mouse button
  // Therefore, to prevent right-click selection, we need to listen
  // to the initial pointerdown event and remember the button
  container.addEventListener('pointerdown', (evt: PointerEvent) => {
    lastPointerEvent = evt;
    isLeftClick = evt.button === 0;
  });

  document.addEventListener('pointerup', (evt: PointerEvent) => {
    lastPointerEvent = evt;

    const annotatable = !(evt.target as Node).parentElement?.closest('.not-annotatable');
    if (!annotatable || !isLeftClick)
      return;

    setTimeout(() => {
      if (currentTarget?.selector) {
        store.updateTarget(currentTarget, Origin.LOCAL);

        selection.clickSelect(currentTarget.annotation, evt);

        currentTarget = null;
        lastPointerEvent = undefined;
      } else {
        const { x, y } = container.getBoundingClientRect();

        const hovered = store.getAt(evt.clientX - x, evt.clientY - y);
        if (hovered) {
          const { selected } = selection;

          if (selected.length !== 1 || selected[0].id !== hovered.id) {
            selection.clickSelect(hovered.id, evt);
            lastPointerEvent = undefined;
          }
        } else if (!selection.isEmpty()) {
          selection.clear();
        }
      }
    }, 50);
  });

  return {
    setUser
  }

}
