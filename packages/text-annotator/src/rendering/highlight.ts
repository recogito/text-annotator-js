import type { AnnotationState } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { AnnotationRects } from '../state';

export interface Highlight extends AnnotationRects<TextAnnotation> {

  state: AnnotationState;

}