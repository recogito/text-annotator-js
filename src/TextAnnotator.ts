import { createAnonymousGuest, type Annotator, type User, createLifecyleObserver, type PresenceProvider } from '@annotorious/core';
import type { TextAnnotation } from './model/TextAnnotation';
import { SelectionHandler } from './SelectionHandler';
import { createTextStore, type TextAnnotationStore } from './state';
import { createHighlightLayer } from './highlight/highlightLayer';
import { createPainter } from './presence/PresencePainter';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';

import './TextAnnotator.css';

export type TextAnnotator = Annotator<TextAnnotation> & ReturnType<typeof RecogitoJS>;

export const RecogitoJS = (container: HTMLElement, options: TextAnnotatorOptions = {}): Annotator<TextAnnotation> & ReturnType<typeof RecogitoJS> => {

  const store: TextAnnotationStore = createTextStore(container);

  const lifecycle = createLifecyleObserver(store.selection, store);

  store.hover.subscribe(id => {
    // console.log('hover change', id ? store.getAnnotation(id) : null);
  });

  let currentUser: User = options.readOnly ? null : createAnonymousGuest();

  const highlightLayer = createHighlightLayer(container, store);

  const selectionHandler = SelectionHandler(container, store);
  selectionHandler.setUser(currentUser);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const getUser = () => currentUser;

  const setPresenceProvider = (provider: PresenceProvider) =>
    highlightLayer.setPainter(createPainter(provider, options.presence));

  return {
    getUser,
    setUser,
    setPresenceProvider,
    on: lifecycle.on,
    off: lifecycle.off,
    selection: store.selection,
    store
  }

}