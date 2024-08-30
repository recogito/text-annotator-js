import type { FormatAdapter, UserSelectActionExpression, User } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';
import type { HighlightStyleExpression } from './highlight';

export interface TextAnnotatorOptions<T extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<TextAnnotation, T> | null;

  annotatingEnabled?: boolean;

  renderer?: RendererType;

  offsetReferenceSelector?: string;

  userSelectAction?: UserSelectActionExpression<TextAnnotation>,

  presence?: PresencePainterOptions;

  style?: HighlightStyleExpression;

  user?: User;
  
}

export type RendererType = 'SPANS' | 'CANVAS' | 'CSS_HIGHLIGHTS';

export const fillDefaults = <T extends unknown = TextAnnotation>(
  opts: TextAnnotatorOptions<T>,
  defaults: TextAnnotatorOptions<T>
): TextAnnotatorOptions<T> => {

  return {
    ...opts,
    annotatingEnabled: opts.annotatingEnabled ?? defaults.annotatingEnabled,
    user: opts.user || defaults.user
  };

};
