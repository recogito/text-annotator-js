import type { FormatAdapter, PointerSelectAction } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';
import type { HighlightPainterStyle } from './highlight';

export interface TextAnnotatorOptions<T extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<TextAnnotation, T> | null;

  offsetReferenceSelector?: string;

  pointerAction?: PointerSelectAction | ((annotation: TextAnnotation) => PointerSelectAction);

  presence?: PresencePainterOptions;

  style?: HighlightPainterStyle;
    
}
