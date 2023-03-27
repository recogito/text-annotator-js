import type { User } from '@annotorious/core';
import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotationStore } from './state';

export const SelectionHandler = (store: TextAnnotationStore) => {

  let currentUser: User;

  const setUser = (user: User) => currentUser = user;

  document.addEventListener('selectionchange', () => {
    // TODO for future use (touch!)
  });

  document.addEventListener('pointerup', () => {
    const selection = document.getSelection();

    if (selection.isCollapsed)
      return

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