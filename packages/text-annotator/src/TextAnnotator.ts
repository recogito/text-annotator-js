import { createAnonymousGuest, createLifecyleObserver, createBaseAnnotator } from '@annotorious/core';
import type { Annotator, User, PresenceProvider, Formatter } from '@annotorious/core';
import { createPainter } from './presence';
import { createHighlightLayer } from './highlight';
import { scrollIntoView } from './api';
import { TextAnnotationStore, TextAnnotatorState, createTextAnnotatorState } from './state';
import type { TextAnnotation } from './model';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';
import { SelectionHandler } from './SelectionHandler';

import './TextAnnotator.css';

export interface TextAnnotator<T extends unknown = TextAnnotation> extends Annotator<TextAnnotation, T> {

  element: HTMLElement;

  // Returns true if successful (or false if the annotation is not currently rendered)
  scrollIntoView(annotation: TextAnnotation): boolean;

}

export const createTextAnnotator = <E extends unknown = TextAnnotation>(
  container: HTMLElement, 
  opts: TextAnnotatorOptions<E> = {}
): TextAnnotator<E> => {

  const state: TextAnnotatorState = createTextAnnotatorState(container, opts.pointerAction);

  const { hover, selection, viewport } = state;

  const store: TextAnnotationStore = state.store;

  const lifecycle = createLifecyleObserver<TextAnnotation, TextAnnotation | E>(store, selection, hover, viewport);
  
  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

  const highlightLayer = createHighlightLayer(container, state, viewport);

  const selectionHandler = SelectionHandler(container, state, opts.offsetReferenceSelector);

  selectionHandler.setUser(currentUser);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<TextAnnotation, E>(store, opts.adapter);

  const getUser = () => currentUser;
  
  const setFormatter = (formatter: Formatter) =>
    highlightLayer.setFormatter(formatter);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const setPresenceProvider = (provider: PresenceProvider) => {
    if (provider) {
      highlightLayer.setPainter(createPainter(provider, opts.presence));
      provider.on('selectionChange', () => highlightLayer.redraw());
    }
  }

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

  return {
    ...base,
    element: container,
    getUser,
    setFormatter,
    setUser,
    setSelected,
    setPresenceProvider,
    on: lifecycle.on,
    off: lifecycle.off,
    scrollIntoView: scrollIntoView(container, store),
    state
  }

}