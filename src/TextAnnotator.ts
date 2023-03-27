import { createAnonymousGuest, type AnnotationLayer, type User } from '@annotorious/core';
import type { TextAnnotation } from './model/TextAnnotation';
import HighlightLayer from './HighlightLayer.svelte';
import { SelectionHandler } from './SelectionHandler';
import { createTextStore } from './state';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';

export type TextAnnotationLayer = AnnotationLayer<TextAnnotation> & ReturnType<typeof TextAnnotator>;

export const TextAnnotator = (container: HTMLElement, options: TextAnnotatorOptions = {}) => {

  const store = createTextStore();

  let currentUser = options.readOnly ? null : createAnonymousGuest();

  const highlightLayer = new HighlightLayer({
    target: container,
    anchor: container.firstChild as Element,
    props: { container, store,  }
  });

  const selectionHandler = SelectionHandler(store);
  selectionHandler.setUser(currentUser);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const getUser = () => currentUser;

  return {
    getUser,
    setUser,
    store
  }

}