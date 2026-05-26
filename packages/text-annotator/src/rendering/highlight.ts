import type { AnnotationState } from '@annotorious/core';
import type { TextAnnotationLike } from '../model';
import type { AnnotationRects } from '../state';

export interface Highlight extends AnnotationRects<TextAnnotationLike> {

  state: AnnotationState;

}