import { createStore } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export type TextAnnotationStore = ReturnType<typeof createTextStore>;

export const createTextStore = () => {

  const store = createStore<TextAnnotation>();

  return {
    ...store
  }

}