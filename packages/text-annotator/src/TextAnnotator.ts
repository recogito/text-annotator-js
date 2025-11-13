import { createAnonymousGuest, createLifecycleObserver, createBaseAnnotator, createUndoStack } from '@annotorious/core';
import type { Annotator, Filter, User, PresenceProvider } from '@annotorious/core';
import { scrollIntoView } from './api';
import { createCanvasRenderer, createHighlightsRenderer, createSpansRenderer } from './highlight';
import type { HighlightStyleExpression, RendererFactory } from './highlight';
import type { TextAnnotation } from './model';
import { createPresencePainter } from './presence';
import { type TextAnnotationStore, type TextAnnotatorState, createTextAnnotatorState } from './state';
import { cancelSingleClickEvents, programmaticallyFocusable } from './utils';
import { createSelectionHandler } from './SelectionHandler';
import { fillDefaults, type RendererType, type TextAnnotatorOptions } from './TextAnnotatorOptions';

import './TextAnnotator.css';

const USE_DEFAULT_RENDERER: RendererType = 'SPANS';

export interface TextAnnotator<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> extends Annotator<I, E> {

  element: HTMLElement;

  setStyle(style: HighlightStyleExpression | undefined): void;

  redraw(lazy?: boolean): void;

  // Returns true if successful (or false if the annotation is not currently rendered)
  scrollIntoView(annotationOrId: I | string, scrollParentOrId?: string | Element): boolean;

  setAnnotatingEnabled(enabled?: boolean): void;

  setAnnotatingMode(mode?: AnnotatingMode): void;

  state: TextAnnotatorState<I, E>;

}

export type AnnotatingMode = 'CREATE_NEW' | 'ADD_TO_CURRENT'; // Possibly 'REPLACE_CURRENT' in the future

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

  const state: TextAnnotatorState<I, E> = createTextAnnotatorState<I, E>(container, opts);

  const { selection, viewport } = state;

  const store: TextAnnotationStore<I> = state.store;

  const undoStack = createUndoStack<I>(store);

  const lifecycle = createLifecycleObserver<I, E>(state, undoStack, opts.adapter);

  let currentUser: User = opts.user;

  // Use the selected built-in renderer, or fall back to default. If 
  // CSS_HIGHLIGHT is selected, check if CSS Custom Highlights are 
  // supported, and fall back to default renderer if not.
  const useBuiltInRenderer: RendererType | null =
    typeof opts.renderer !== 'function' ? 
      opts.renderer === 'CSS_HIGHLIGHTS'
        ? Boolean(CSS.highlights) ? 'CSS_HIGHLIGHTS' : USE_DEFAULT_RENDERER
        : opts.renderer || USE_DEFAULT_RENDERER :
    null;

  const highlightRenderer =
    useBuiltInRenderer === null ? (opts.renderer as RendererFactory)(container, state, viewport) :
    useBuiltInRenderer === 'SPANS' ? createSpansRenderer(container, state, viewport) :
    useBuiltInRenderer === 'CSS_HIGHLIGHTS' ? createHighlightsRenderer(container, state, viewport) :
    useBuiltInRenderer === 'CANVAS' ? createCanvasRenderer(container, state, viewport) : undefined;

  if (!highlightRenderer)
    throw `Unknown renderer implementation: ${opts.renderer}`;

  if (useBuiltInRenderer)
    console.debug(`Using ${useBuiltInRenderer} renderer`);
  else 
    console.debug('Using custom renderer implementation');

  if (opts.style)
    highlightRenderer.setStyle(opts.style);

  const selectionHandler = createSelectionHandler(container, state, lifecycle, opts);
  selectionHandler.setUser(currentUser);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<I, E>(state, undoStack, opts.adapter);

  const getUser = () => currentUser;

  const setAnnotatingEnabled = (enabled?: boolean) => {
    selectionHandler.setAnnotatingEnabled(
      enabled === undefined ? true : enabled
    );
  }

  const setAnnotatingMode = (mode?: AnnotatingMode) => {
    selectionHandler.setAnnotatingMode(mode)
  }

  const setFilter = (filter?: Filter<I>) => {
    highlightRenderer.setFilter(filter);
    selectionHandler.setFilter(filter);
  }

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
    setAnnotatingEnabled,
    setAnnotatingMode,
    setFilter,
    setStyle: highlightRenderer.setStyle.bind(highlightRenderer),
    redraw: highlightRenderer.redraw.bind(highlightRenderer),
    setUser,
    setSelected,
    setPresenceProvider,
    setVisible: highlightRenderer.setVisible.bind(highlightRenderer),
    on: lifecycle.on,
    off: lifecycle.off,
    scrollIntoView: scrollIntoView(container, store),
    state
  }

}
