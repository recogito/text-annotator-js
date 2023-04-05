import { createAnonymousGuest, type AnnotationLayer, type User, createLifecyleObserver } from '@annotorious/core';
import type { TextAnnotation } from './model/TextAnnotation';
import HighlightLayer from './highlight/HighlightLayer.svelte';
import { SelectionHandler } from './SelectionHandler';
import { createTextStore } from './state';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';

import './TextAnnotator.css';

export type TextAnnotationLayer = AnnotationLayer<TextAnnotation> & ReturnType<typeof TextAnnotator>;

export const TextAnnotator = (container: HTMLElement, options: TextAnnotatorOptions = {}) => {

  const store = createTextStore();

  const lifecycle = createLifecyleObserver(store.selection, store);

  let currentUser = options.readOnly ? null : createAnonymousGuest();

  const highlightLayer = new HighlightLayer({
    target: container,
    anchor: container.firstChild as Element,
    props: { container, store,  }
  });

  const selectionHandler = SelectionHandler(container, store);
  selectionHandler.setUser(currentUser);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const getUser = () => currentUser;

  return {
    getUser,
    on: lifecycle.on,
    off: lifecycle.off,
    setUser,
    store
  }

}