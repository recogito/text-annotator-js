import { Origin, type User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotatorState } from './state';
import type { TextAnnotation, TextAnnotationTarget } from './model';
import { debounce, getAnnotableRanges, rangeToSelector, trimRange } from './utils';

// Shortcut
const createTarget = (args: {
  annotationId: string,
  creator: User,
  range: Range,
  container: HTMLElement,
  offsetReferenceSelector?: string
}): TextAnnotationTarget => {
  const { annotationId, creator, range, container, offsetReferenceSelector } = args

  const selector = rangeToSelector(range, container, offsetReferenceSelector);
  return {
    id: uuidv4(),
    annotation: annotationId,
    selector,
    creator,
    created: new Date()
  };
};

export const SelectionHandler = (
  container: HTMLElement,
  state: TextAnnotatorState,
  offsetReferenceSelector?: string
) => {

  const { store, selection } = state;

  let currentUser: User;

  let currentAnnotation: TextAnnotation | undefined;

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

    currentAnnotation = annotatable ? {
      id: uuidv4(),
      targets: [],
      bodies: []
    } : undefined;
  }

  container.addEventListener('selectstart', onSelectStart);

  const onSelectionChange = debounce( (evt: PointerEvent) => {
    const sel = document.getSelection();

    // Chrome/iOS does not reliably fire the 'selectstart' event!
    if (evt.timeStamp - lastPointerDown.timeStamp < 1000 && !currentAnnotation) {
      onSelectStart(lastPointerDown);
    }

    if (sel.isCollapsed || !isLeftClick || !currentAnnotation) return;

    const selRange = sel.getRangeAt(0);
    const trimmedRange = trimRange(selRange.cloneRange());
    const annotableRanges = getAnnotableRanges(trimmedRange);

    const hasChanged =
      annotableRanges.length !== currentAnnotation.targets.length ||
      annotableRanges.some((r, i) => r.toString() !== currentAnnotation.targets[i].selector?.quote);
    if (!hasChanged) return;

    // Discards any targets that don't have a corresponding annotable range
    const targetsToDiscard = currentAnnotation.targets.slice(annotableRanges.length);
    targetsToDiscard.forEach(target => store.deleteTarget(target, Origin.LOCAL));

    annotableRanges.forEach((range, i) => {
      const target = currentAnnotation.targets[i];
      if (target) {
        currentAnnotation.targets[i] = {
          ...target,
          selector: rangeToSelector(range, container, offsetReferenceSelector)
        };
      } else {
        currentAnnotation.targets[i] = createTarget({
          annotationId: currentAnnotation.id,
          creator: currentUser,
          range,
          container,
          offsetReferenceSelector
        });
      }
    });

    const annotation = store.getAnnotation(currentAnnotation.id);
    if (annotation) {
      store.updateAnnotation(annotation);
    } else {
      store.addAnnotation(annotation);

      // Reminder: select events don't have offsetX/offsetY - reuse last up/down
      selection.clickSelect(annotation.id, lastPointerDown);
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
      currentAnnotation = undefined;
      clickSelect();
    } else {
      selection.clickSelect(currentAnnotation.id, evt);
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
