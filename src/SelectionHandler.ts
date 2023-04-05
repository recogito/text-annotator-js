import type { User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotationStore } from './state';

export const SelectionHandler = (container: HTMLElement, store: TextAnnotationStore) => {

  let currentUser: User;

  const setUser = (user: User) => currentUser = user;

  container.addEventListener('selectstart', () => {
    // Show native browser selection
    delete container.dataset.native;
  });

  document.addEventListener('selectionchange', () => {   
    const selection = document.getSelection();

    if (!selection.isCollapsed) 
      console.log('changed!')
  });

  document.addEventListener('pointerup', () => {
    const selection = document.getSelection();

    if (selection.isCollapsed)
      return;

    // Hide native browser selection
    container.dataset.native = 'hidden';

    const ranges = Array.from(Array(selection.rangeCount).keys())
      .map(idx => selection.getRangeAt(idx));

    const annotations = ranges.map(range => {
      const id = uuidv4();

      return {
        id,
        bodies: [],
        target: {
          annotation: id,
          selector: range,
          creator: currentUser,
          created: new Date()
        }
      }
    });

    store.bulkAddAnnotation(annotations, false);
  });

  return {
    setUser
  }

}