import type { FormatAdapter, UserSelectActionExpression, User } from '@annotorious/core';
import type { HighlightStyleExpression, RendererFactory } from '@/rendering';
import type { TextAnnotation } from '@/model';

export interface TextAnnotatorOptions<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<I, E> | null;

  allowModifierSelect?: boolean;

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

  mergeHighlights?: {

    horizontalTolerance?: number;

    verticalTolerance?: number;

  }

  offsetReferenceSelector?: string;
  
  renderer?: RendererType | RendererFactory;

  selectionMode?: 'shortest' | 'all';

  style?: HighlightStyleExpression;

  user?: User;

  userSelectAction?: UserSelectActionExpression<E>,

}

export type RendererType = 'SPANS' | 'CSS_HIGHLIGHTS';

export type DismissOnNotAnnotatableExpression =  'NEVER'| 'ALWAYS' | ((event: Event, container: HTMLElement) => boolean)

export const fillDefaults = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  opts: TextAnnotatorOptions<I, E>,
  defaults: TextAnnotatorOptions<I, E>
): TextAnnotatorOptions<I, E> => ({
  ...opts,
  annotatingEnabled: opts.annotatingEnabled ?? defaults.annotatingEnabled,
  user: opts.user || defaults.user
});
