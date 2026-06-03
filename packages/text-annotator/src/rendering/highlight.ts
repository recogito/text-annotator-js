import type { AnnotationState } from '@annotorious/core';
import type { RevivedTextAnnotationLike } from '../model';
import type { AnnotationRects } from '../state';

export interface Highlight extends AnnotationRects<RevivedTextAnnotationLike> {

  state: AnnotationState;

}