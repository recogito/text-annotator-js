import type { Store } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export type TextAnnotationStore = Store<TextAnnotation> & {

  getAt(x: number, y: number): TextAnnotation | undefined;
  
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): TextAnnotation[];
  
  recalculatePositions(): void;

}