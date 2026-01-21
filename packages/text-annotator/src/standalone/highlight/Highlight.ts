import type { AnnotationState } from '../types';
import type { AnnotationRects } from '../model';

export interface Highlight extends AnnotationRects {
  state: AnnotationState;
}
