import { createSelectionState, createStore } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export type TextAnnotationStore = ReturnType<typeof createTextStore>;

export const createTextStore = () => {

  const store = createStore<TextAnnotation>();

  const selection = createSelectionState<TextAnnotation>(store);

  return {
    ...store,
    selection
  }

}