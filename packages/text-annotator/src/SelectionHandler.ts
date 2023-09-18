import { Origin, type AnnotationTarget, type User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotatorState } from './state';
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

export const SelectionHandler = (container: HTMLElement, state: TextAnnotatorState) => {

  const { store, selection } = state;

  let currentUser: User;

  let currentTarget: AnnotationTarget = null;

  let selectionStarted = false;

  const setUser = (user: User) => currentUser = user;

  let isLeftClick = false;

  container.addEventListener('selectstart', (evt: PointerEvent) => {
    if (selectionStarted || !isLeftClick)
      return;

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

  document.addEventListener('selectionchange', (evt: PointerEvent) => {   
    if (!selectionStarted || !isLeftClick)
      return;

    const sel = document.getSelection();

    if (!sel.isCollapsed) {
      const ranges = Array.from(Array(sel.rangeCount).keys())
        .map(idx => sel.getRangeAt(idx));

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

        selection.clickSelect(updatedTarget.annotation, evt);
      }

      currentTarget = updatedTarget;
    }
  });

  // Select events don't carry information about the mouse button
  // Therefore, to prevent right-click selection, we need to listen
  // to the initial pointerdown event and remember the button
  container.addEventListener('pointerdown', (evt: PointerEvent) =>
    isLeftClick = evt.button === 0);

  document.addEventListener('pointerup', (evt: PointerEvent) => {
    // Rest left click flag
    isLeftClick = false;

    const annotatable = !(event.target as Node).parentElement?.closest('.not-annotatable');
    if (!annotatable)
      return;
      
    if (currentTarget) {
      store.updateTarget(currentTarget, Origin.LOCAL);

      selection.clickSelect(currentTarget.annotation, evt);

      clearNativeSelection();
      currentTarget = null;
      selectionStarted = false;
    } else {   
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

    delete container.dataset.native;
  });

  return {
    setUser
  }

}