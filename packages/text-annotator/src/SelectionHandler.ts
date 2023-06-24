import { Origin, type AnnotationTarget, type User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotationStore } from './state';
import type { TextSelector } from './model';

const clearNativeSelection = () => {
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  // @ts-ignore
  } else if (document.selection) {
    // @ts-ignore
    document.selection.empty();
  }
}

export const rangeToSelector = (range: Range, container: HTMLElement): TextSelector => {
  const rangeBefore = document.createRange();

  // A helper range from the start of the contentNode to the start of the selection
  rangeBefore.setStart(container, 0);
  rangeBefore.setEnd(range.startContainer, range.startOffset);

  const quote = range.toString();
  const start = rangeBefore.toString().length;
  const end = start + quote.length;

  return {  quote, start, end, range };
}

export const SelectionHandler = (container: HTMLElement, store: TextAnnotationStore) => {

  let currentUser: User;

  let currentTarget: AnnotationTarget = null;

  let selectionStarted = false;

  const setUser = (user: User) => currentUser = user;

  container.addEventListener('selectstart', (evt: PointerEvent) => {
    // Make sure we don't listen to selection changes that
    // were not started on the container, or which are not supposed to 
    // be annotatable (like the popup)
    const annotatable = !(evt.target as Node).parentElement.closest('.not-annotatable');
    if (annotatable) {
      selectionStarted = true;

      // Hide native browser selection
      container.dataset.native = 'hidden';
    } else {
      // Show native browser selection
      delete container.dataset.native;
    }
  });

  document.addEventListener('selectionchange', (event: PointerEvent) => {   
    if (!selectionStarted)
      return;

    const selection = document.getSelection();

    if (!selection.isCollapsed) {
      const ranges = Array.from(Array(selection.rangeCount).keys())
        .map(idx => selection.getRangeAt(idx));

      const updatedTarget = {
        annotation: currentTarget?.annotation || uuidv4(),
        selector: rangeToSelector(ranges[0], container),
        creator: currentUser,
        created: new Date()
      };
  
      if (currentTarget) {
        store.updateTarget(updatedTarget, Origin.LOCAL);
      } else {
        store.addAnnotation({
          id: updatedTarget.annotation,
          bodies: [],
          target: updatedTarget
        });

        store.selection.clickSelect(updatedTarget.annotation, event);
      }

      currentTarget = updatedTarget;
    }
  });

  document.addEventListener('pointerup', (event: PointerEvent) => {
    if (currentTarget) {
      store.updateTarget(currentTarget, Origin.LOCAL);

      store.selection.clickSelect(currentTarget.annotation, event);

      clearNativeSelection();
      currentTarget = null;
      selectionStarted = false;
    } else {   
      const { x, y } = container.getBoundingClientRect();
    
      const hovered = store.getAt(event.clientX - x, event.clientY - y);
      if (hovered) {
        const { selected } = store.selection;
        
        if (selected.length !== 1 || selected[0] !== hovered.id)
          store.selection.clickSelect(hovered.id, event);
      } else if (!store.selection.isEmpty()) {
        store.selection.clear();
      }
    }

    delete container.dataset.native;
  });

  return {
    setUser
  }

}