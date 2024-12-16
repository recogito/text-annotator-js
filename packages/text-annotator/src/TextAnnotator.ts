import { createAnonymousGuest, createLifecycleObserver, createBaseAnnotator, createUndoStack } from '@annotorious/core';
import type { Filter } from '@annotorious/core';
import type { Annotator, User, PresenceProvider } from '@annotorious/core';
import { createCanvasRenderer, createHighlightsRenderer, createSpansRenderer, type HighlightStyleExpression } from './highlight';
import { createPresencePainter } from './presence';
import { scrollIntoView } from './api';
import { type TextAnnotationStore, type TextAnnotatorState, createTextAnnotatorState } from './state';
import type { TextAnnotation } from './model';
import { cancelSingleClickEvents, programmaticallyFocusable } from './utils';
import { fillDefaults, type RendererType, type TextAnnotatorOptions } from './TextAnnotatorOptions';
import { SelectionHandler } from './SelectionHandler';

import './TextAnnotator.css';

const USE_DEFAULT_RENDERER: RendererType = 'SPANS';

export interface TextAnnotator<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> extends Annotator<I, E> {

  element: HTMLElement;

  setStyle(style: HighlightStyleExpression | undefined): void;

  // Returns true if successful (or false if the annotation is not currently rendered)
  scrollIntoView(annotationOrId: I | string): boolean;

  state: TextAnnotatorState<I, E>;

}

export const createTextAnnotator = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  container: HTMLElement,
  options: TextAnnotatorOptions<I, E> = {}
): TextAnnotator<I, E> => {
  // Prevent mobile browsers from triggering word selection on single click.
  cancelSingleClickEvents(container);

  // Make sure that the container is focusable and can receive both pointer and keyboard events
  programmaticallyFocusable(container);

  const opts = fillDefaults<I, E>(options, {
    annotatingEnabled: true,
    user: createAnonymousGuest()
  });

  const state: TextAnnotatorState<I, E> =
    createTextAnnotatorState<I, E>(container, opts.userSelectAction);

  const { selection, viewport } = state;

  const store: TextAnnotationStore<I> = state.store;

  const undoStack = createUndoStack<I>(store);

  const lifecycle = createLifecycleObserver<I, E>(state, undoStack, opts.adapter);

  let currentUser: User = opts.user;

  // Use selected renderer, or fall back to default. If CSS_HIGHLIGHT is
  // requested, check if CSS Custom Highlights are supported, and fall
  // back to default renderer if not.
  const useRenderer: RendererType =
    opts.renderer === 'CSS_HIGHLIGHTS'
      ? Boolean(CSS.highlights) ? 'CSS_HIGHLIGHTS' : USE_DEFAULT_RENDERER
      : opts.renderer || USE_DEFAULT_RENDERER;

  const highlightRenderer =
    useRenderer === 'SPANS' ? createSpansRenderer(container, state, viewport) :
    useRenderer === 'CSS_HIGHLIGHTS' ? createHighlightsRenderer(container, state, viewport) :
    useRenderer === 'CANVAS' ? createCanvasRenderer(container, state, viewport) : undefined;

  if (!highlightRenderer)
    throw `Unknown renderer implementation: ${useRenderer}`;

  console.debug(`Using ${useRenderer} renderer`);

  if (opts.style)
    highlightRenderer.setStyle(opts.style);

  const selectionHandler = SelectionHandler(container, state, opts);
  selectionHandler.setUser(currentUser);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<I, E>(state, undoStack, opts.adapter);

  const getUser = () => currentUser;

  const setFilter = (filter?: Filter<I>) => {
    highlightRenderer.setFilter(filter);
    selectionHandler.setFilter(filter);
  }

  const setStyle = (style: HighlightStyleExpression | undefined) =>
    highlightRenderer.setStyle(style);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const setPresenceProvider = (provider: PresenceProvider) => {
    if (provider) {
      highlightRenderer.setPainter(createPresencePainter(provider, opts.presence));
      provider.on('selectionChange', () => highlightRenderer.redraw());
    }
  }

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

  const setVisible = (visible: boolean) =>
    highlightRenderer.setVisible(visible);

  const destroy = () => {
    highlightRenderer.destroy();
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
    setVisible,
    on: lifecycle.on,
    off: lifecycle.off,
    scrollIntoView: scrollIntoView(container, store),
    state
  }

}
