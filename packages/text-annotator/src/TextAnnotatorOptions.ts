import type { FormatAdapter, PointerAction } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';

export interface TextAnnotatorOptions<T extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<TextAnnotation, T> | null;

  readOnly?: boolean;

  pointerAction?: PointerAction | ((annotation: TextAnnotation) => PointerAction);

  presence?: PresencePainterOptions;
    
}