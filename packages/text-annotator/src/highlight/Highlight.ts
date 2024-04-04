import type { AnnotationState } from '@annotorious/core';
import type { AnnotationRects } from '../state';

export interface Highlight extends AnnotationRects {

  state: AnnotationState;

}