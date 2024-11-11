import type { FormatAdapter, UserSelectActionExpression, User, Annotation } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';
import type { HighlightStyleExpression } from './highlight';

export interface TextAnnotatorOptions<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<I, E> | null;

  annotatingEnabled?: boolean;

  renderer?: RendererType;

  offsetReferenceSelector?: string;

  userSelectAction?: UserSelectActionExpression<E>,

  presence?: PresencePainterOptions;

  selectionMode?: 'shortest' | 'all';

  style?: HighlightStyleExpression;

  user?: User;
  
}

export type RendererType = 'SPANS' | 'CANVAS' | 'CSS_HIGHLIGHTS';

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
