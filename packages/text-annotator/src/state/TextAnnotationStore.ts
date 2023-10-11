import type { Origin, Store } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export type TextAnnotationStore = Omit<Store<TextAnnotation>, 'bulkAddAnnotation'> & {

  // Minor change to default Annotorious store - text store returns annotations
  // that failed to render, to support lazy document loading scenarios
  bulkAddAnnotation(annotations: TextAnnotation[], replace: boolean, origin: Origin): TextAnnotation[];
  
  getAnnotationBounds(id: string, hintX?: number, hintY?: number, buffer?: number): DOMRect[];

  getAt(x: number, y: number): TextAnnotation| undefined;
  
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): TextAnnotation[];

  getIntersectingRects(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects[];
  
  recalculatePositions(): void;

}

export interface AnnotationRects {

  annotation: TextAnnotation;

  rects: Rect[];

}

export interface Rect {

  x: number;

  y: number;

  width: number;

  height: number;

}