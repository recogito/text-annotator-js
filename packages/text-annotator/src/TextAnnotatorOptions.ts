import type { FormatAdapter, UserSelectActionExpression, User, Annotation } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';
import type { HighlightStyleExpression } from './highlight';

export interface TextAnnotatorOptions<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<I, E> | null;

  annotatingEnabled?: boolean;

  /**
   * Determines whether an active selection should be dismissed
   * when a user ends their interaction (click, selection)
   * on a non-annotatable element.
   * - ALWAYS - always dismiss the selection.
   * - ANNOTATABLE_AREAS - will dismiss selection only if you click on annotatable areas
   *                       (inside the `container`, not marked as not-annotatable)
   * - function - a custom matcher that takes an event and container as arguments
   *              and returns true if the selection should be dismissed.
   *
   * @defaut ANNOTATABLE_AREAS
   */
  dismissOnNotAnnotatable?: DismissOnNotAnnotatableExpression;

  renderer?: RendererType;

  offsetReferenceSelector?: string;

  userSelectAction?: UserSelectActionExpression<E>,

  presence?: PresencePainterOptions;

  selectionMode?: 'shortest' | 'all';

  style?: HighlightStyleExpression;

  user?: User;
  
}

export type RendererType = 'SPANS' | 'CANVAS' | 'CSS_HIGHLIGHTS';

export type DismissOnNotAnnotatableExpression = 'ALWAYS' | 'ANNOTATABLE_AREAS' | ((event: Event, container: HTMLElement) => boolean)

export const fillDefaults = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  opts: TextAnnotatorOptions<I, E>,
  defaults: TextAnnotatorOptions<I, E>
): TextAnnotatorOptions<I, E> => {

  return {
    ...opts,
    annotatingEnabled: opts.annotatingEnabled ?? defaults.annotatingEnabled,
    user: opts.user || defaults.user
  };

};
