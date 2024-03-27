import type { DrawingStyle, FormatAdapter, PointerSelectAction } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';
import type { HighlightStyleExpression } from './highlight/HighlightStyle';

export interface TextAnnotatorOptions<T extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<TextAnnotation, T> | null;

  renderer?: 'SPAN' | 'CANVAS' | 'CSS_HIGHLIGHT';

  offsetReferenceSelector?: string;

  pointerAction?: PointerSelectAction | ((annotation: TextAnnotation) => PointerSelectAction);

  presence?: PresencePainterOptions;

  style?: HighlightStyleExpression;
    
}
