import { Origin, createAnonymousGuest, createLifecyleObserver, parseAll, serializeAll } from '@annotorious/core';
import type { Annotator, User, PresenceProvider, Formatter } from '@annotorious/core';
import { createPainter } from './presence';
import { createHighlightLayer } from './highlight';
import { scrollIntoView } from './api';
import { TextAnnotationStore, TextAnnotatorState, createTextAnnotatorState } from './state';
import type { TextAnnotation } from './model';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';
import { SelectionHandler } from './SelectionHandler';

import './TextAnnotator.css';

export interface RecogitoTextAnnotator<T extends unknown = TextAnnotation> extends Annotator<TextAnnotation, T> {

  element: HTMLElement;

  scrollIntoView(annotation: TextAnnotation): void;

}

export const TextAnnotator = <T extends unknown = TextAnnotation>(
  container: HTMLElement, 
  opts: TextAnnotatorOptions<T> = {}
): RecogitoTextAnnotator<T> => {

  const state: TextAnnotatorState = createTextAnnotatorState(container, opts.pointerAction);

  const { hover, selection, viewport } = state;

  const store: TextAnnotationStore = state.store;

  const lifecycle = createLifecyleObserver<TextAnnotation, TextAnnotation | T>(store, selection, hover, viewport);
  
  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

  const highlightLayer = createHighlightLayer(container, state, viewport);

  const selectionHandler = SelectionHandler(container, state);

  selectionHandler.setUser(currentUser);

  /*************************/
  /*      External API     */
  /******++++++*************/

  const addAnnotation = (annotation: T) => {
    // TODO
  }

  const getAnnotationById = (id: string): T | undefined => {
    const annotation = store.getAnnotation(id);
    return (opts.adapter && annotation) ?
      opts.adapter.serialize(annotation) as T : annotation as T | undefined;
  }

  const getAnnotations = () =>
    (opts.adapter ? store.all().map(opts.adapter.serialize) : store.all()) as T[];

  const getUser = () => currentUser;

  const loadAnnotations = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((annotations) => {
        setAnnotations(annotations);
        return annotations;
      });

  const setAnnotations = (annotations: T[]): T[] => {
    if (opts.adapter) {
      const { parsed, failed } = parseAll(opts.adapter)(annotations);

      if (failed.length > 0)
        console.warn(`Discarded ${failed.length} invalid annotations`, failed);

      const notRevived = store.bulkAddAnnotation(parsed, true, Origin.REMOTE) as TextAnnotation[];
      return serializeAll(opts.adapter)(notRevived);
    } else {
      return store.bulkAddAnnotation(annotations as TextAnnotation[], true, Origin.REMOTE) as T[];
    }
  }
  
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

  return {
    addAnnotation,
    element: container,
    getAnnotationById,
    getAnnotations,
    getUser,
    loadAnnotations,
    setAnnotations,
    setFormatter,
    setUser,
    setPresenceProvider,
    on: lifecycle.on,
    off: lifecycle.off,
    scrollIntoView: scrollIntoView(container),
    state
  }

}