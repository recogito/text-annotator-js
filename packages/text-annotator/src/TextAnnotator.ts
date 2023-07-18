import { createAnonymousGuest, createLifecyleObserver } from '@annotorious/core';
import type { Annotator, User, PresenceProvider } from '@annotorious/core';
import { createPainter } from './presence';
import { createHighlightLayer } from './highlight';
import { scrollIntoView } from './api';
import { createTextStore, type TextAnnotationStore } from './state';
import type { TextAnnotation } from './model';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';
import { SelectionHandler } from './SelectionHandler';

import './TextAnnotator.css';

export interface TextAnnotator extends ReturnType<typeof TextAnnotator>, Annotator<TextAnnotation> {};

export const TextAnnotator = (container: HTMLElement, options: TextAnnotatorOptions = {}): Annotator<TextAnnotation> & ReturnType<typeof TextAnnotator> => {

  const store: TextAnnotationStore = createTextStore(container);

  const lifecycle = createLifecyleObserver(store.selection, store);

  let currentUser: User = options.readOnly ? null : createAnonymousGuest();

  const highlightLayer = createHighlightLayer(container, store);

  const selectionHandler = SelectionHandler(container, store);
  selectionHandler.setUser(currentUser);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const getUser = () => currentUser;

  const setPresenceProvider = (provider: PresenceProvider) => {
    if (provider) {
      highlightLayer.setPainter(createPainter(provider, options.presence));
      provider.on('selectionChange', () => highlightLayer.redraw());
    }
  }

  return {
    element: container,
    getUser,
    setUser,
    setPresenceProvider,
    on: lifecycle.on,
    off: lifecycle.off,
    scrollIntoView: scrollIntoView(container),
    selection: store.selection,
    store
  }

}