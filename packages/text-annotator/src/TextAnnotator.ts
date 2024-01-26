import { createAnonymousGuest, createLifecyleObserver, createBaseAnnotator, DrawingStyle, Filter, createUndoStack } from '@annotorious/core';
import type { Annotator, User, PresenceProvider } from '@annotorious/core';
import { createPainter } from './presence';
import { createHighlightLayer, type HighlightPainterStyle } from './highlight';
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

  setStyle(style?: HighlightPainterStyle): void;

}

export const createTextAnnotator = <E extends unknown = TextAnnotation>(
  container: HTMLElement, 
  opts: TextAnnotatorOptions<E> = {}
): TextAnnotator<E> => {
  // Prevent mobile browsers from triggering word selection on single click.
  container.addEventListener('click', evt => evt.preventDefault());

  const state: TextAnnotatorState = createTextAnnotatorState(container, opts.pointerAction);

  const { selection, viewport } = state;

  const store: TextAnnotationStore = state.store;

  const undoStack = createUndoStack(store);

  const lifecycle = createLifecyleObserver<TextAnnotation, TextAnnotation | E>(
    state, undoStack, opts.adapter
  );
  
  let currentUser: User = createAnonymousGuest();

  const highlightLayer = createHighlightLayer(container, state, viewport);
  if (opts.style)
    highlightLayer.setDrawingStyle(opts.style);

  const selectionHandler = SelectionHandler(container, state, opts.offsetReferenceSelector);

  selectionHandler.setUser(currentUser);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<TextAnnotation, E>(state, undoStack, opts.adapter);

  const getUser = () => currentUser;

  const setFilter = (filter?: Filter) =>
    highlightLayer.setFilter(filter);

  const setStyle = (style?: HighlightPainterStyle) =>
    highlightLayer.setDrawingStyle(style);

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

  const destroy = () => {
    highlightLayer.destroy();
    selectionHandler.destroy();

    // Other cleanup actions
    undoStack.destroy();
  }

  return {
    ...base,
    destroy,
    element: container,
    getUser,
    setFilter,
    setStyle,
    setUser,
    setSelected,
    setPresenceProvider,
    on: lifecycle.on,
    off: lifecycle.off,
    scrollIntoView: scrollIntoView(container, store),
    state
  }

}
