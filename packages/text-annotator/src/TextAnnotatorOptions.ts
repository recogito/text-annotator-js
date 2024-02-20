import type { FormatAdapter, PointerSelectAction } from '@annotorious/core';
import type { PresencePainterOptions } from './presence';
import type { TextAnnotation } from './model';
import type { HighlightStyle } from './highlight';

export interface TextAnnotatorOptions<T extends unknown = TextAnnotation> {

  adapter?: FormatAdapter<TextAnnotation, T> | null;

  experimentalCSSRenderer?: boolean;

  offsetReferenceSelector?: string;

  pointerAction?: PointerSelectAction | ((annotation: TextAnnotation) => PointerSelectAction);

  presence?: PresencePainterOptions;

  style?: HighlightStyle;

}
