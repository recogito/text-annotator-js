import {
  type Annotator, 
  type AnnotatorState, 
  type Filter, 
  type Lifecycle, 
  type Store, 
  type User,
  createAnonymousGuest, 
  createBaseAnnotator,
  createLifecycleObserver,
  createUndoStack 
} from '@annotorious/core';
import type { HighlightStyleExpression, Renderer, RendererFactory } from './rendering';
import { createSpansRenderer } from './rendering/renderer-spans';
import { createCSSHighlightRenderer } from './rendering/renderer-css-highlight';
import type { TextAnnotation, TextAnnotationLike } from './model';
import { 
  type TextAnnotationStore, 
  type TextAnnotatorState, 
  createTextAnnotatorState 
} from './state';
import { scrollIntoView } from './utils/annotation';
import { programmaticallyFocusable } from './utils/dom';
import { cancelSingleClickEvents } from './utils/events';
import { createSelectionHandler } from './selection-handler';
import { 
  type RendererType, 
  type TextAnnotatorOptions,
  fillDefaults
} from './text-annotator-options';

import './text-annotator.css';

const USE_DEFAULT_RENDERER: RendererType = 'SPANS';

export interface TextAnnotator<I extends TextAnnotationLike = TextAnnotation, E extends unknown = TextAnnotation> 
  extends Omit<Annotator<I, E>, 'setStyle' | 'state'> {

  element: HTMLElement;

  renderer: Renderer<I>;

  setStyle(style?: HighlightStyleExpression<I>, id?: string): void;

  // Returns true if successful (or false if the annotation is not currently rendered)
  scrollIntoView(annotationOrId: I | string, scrollParentOrId?: string | Element): boolean;

  setAnnotatingEnabled(enabled?: boolean): void;

  setAnnotatingMode(mode?: AnnotatingMode): void;

  state: TextAnnotatorState<I, E>;

}

export type AnnotatingMode = 'CREATE_NEW' | 'ADD_TO_CURRENT' | 'REPLACE_CURRENT';

export const createTextAnnotator = <I extends TextAnnotationLike = TextAnnotation, E extends unknown = TextAnnotation>(
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

  // @ts-ignore - temporary!
  const state: TextAnnotatorState<I, E> = createTextAnnotatorState<I, E>(container, opts);

  const { selection, viewport } = state;

  const store: TextAnnotationStore<I> = state.store;

  const undoStack = createUndoStack<I>(store as unknown as Store<I>);

  // Not an ideal cast... but not sure what the best approach would be 
  const lifecycle = 
    createLifecycleObserver<I, E>(state as unknown as AnnotatorState<I, E>, undoStack, opts.adapter);

  let currentUser: User = opts.user!;

  // Use the selected built-in renderer, or fall back to default. If 
  // CSS_HIGHLIGHT is selected, check if CSS Custom Highlights are 
  // supported, and fall back to default renderer if not.
  const useBuiltInRenderer: RendererType | null =
    typeof opts.renderer !== 'function' ? 
      opts.renderer === 'CSS_HIGHLIGHTS'
        ? Boolean(CSS.highlights) ? 'CSS_HIGHLIGHTS' : USE_DEFAULT_RENDERER
        : opts.renderer || USE_DEFAULT_RENDERER :
    null;

  // Likewise: not an ideal cast...
  const renderer = (
    useBuiltInRenderer === null ? (opts.renderer as RendererFactory<I>)(
      container, 
      state as unknown as AnnotatorState<I, E>, 
      viewport) :
    useBuiltInRenderer === 'SPANS' ? createSpansRenderer(
      container, 
      state as unknown as AnnotatorState<TextAnnotation, E>, 
      viewport) :
    useBuiltInRenderer === 'CSS_HIGHLIGHTS' ? createCSSHighlightRenderer(
      container, 
      state as unknown as AnnotatorState<TextAnnotation, E>, 
      viewport) :
    undefined
  ) as unknown as Renderer<I> | undefined;

  if (!renderer)
    throw `Unknown renderer implementation: ${opts.renderer}`;

  if (useBuiltInRenderer)
    console.debug(`Using ${useBuiltInRenderer} renderer`);
  else 
    console.debug('Using custom renderer implementation');

  if (opts.style)
    renderer.setStyle(opts.style);

  // Likewise: not ideal casts...
  const selectionHandler = createSelectionHandler(
    container, 
    state as unknown as TextAnnotatorState<TextAnnotation, E>, 
    lifecycle as unknown as Lifecycle<TextAnnotation, E>,
    opts as unknown as TextAnnotatorOptions<TextAnnotation, E>);

  selectionHandler.setUser(currentUser);

  /*************************/
  /*      External API     */
  /******++++++*************/

  // Most of the external API functions are covered in the base annotator
  const base = createBaseAnnotator<I, E>(state as unknown as AnnotatorState<I, E>, undoStack, opts.adapter);

  const getUser = () => currentUser;

  const setAnnotatingEnabled = (enabled?: boolean) => {
    selectionHandler.setAnnotatingEnabled(
      enabled === undefined ? true : enabled
    );
  }

  const setAnnotatingMode = (mode?: AnnotatingMode) => {
    selectionHandler.setAnnotatingMode(mode);
  }

  const setFilter = (filter?: Filter<I>) => {
    renderer.setFilter(filter);
    selectionHandler.setFilter(filter);
  }

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const setSelected = (arg?: string | string[]) => {
    if (arg) {
      selection.setSelected(arg);
    } else {
      selection.clear();
    }
  }

  const destroy = () => {
    renderer.destroy();
    selectionHandler.destroy();

    // Other cleanup actions
    undoStack.destroy();
  }

  return {
    ...base,
    destroy,
    element: container,
    getUser,
    renderer,
    setAnnotatingEnabled,
    setAnnotatingMode,
    setFilter,
    setStyle: renderer.setStyle.bind(renderer),
    setUser,
    setSelected,
    setVisible: renderer.setVisible.bind(renderer),
    on: lifecycle.on,
    off: lifecycle.off,
    // @ts-ignore - temporary
    scrollIntoView: scrollIntoView(container, store),
    state
  }

}
