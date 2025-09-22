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
   * - NEVER - don't dismiss the selection, ignore the action.
   * - ALWAYS - dismiss the selection.
   * - function - a custom matcher that takes an event and container as arguments.
   *              Returns `true` if the selection should be dismissed.
   *
   * @defaut NEVER
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

export type DismissOnNotAnnotatableExpression =  'NEVER'| 'ALWAYS' | ((event: Event, container: HTMLElement) => boolean)

export const fillDefaults = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  opts: TextAnnotatorOptions<I, E>,
  defaults: TextAnnotatorOptions<I, E>
): TextAnnotatorOptions<I, E> => ({
  ...opts,
  annotatingEnabled: opts.annotatingEnabled ?? defaults.annotatingEnabled,
  user: opts.user || defaults.user
});
