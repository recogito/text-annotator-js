import type { Filter, Origin, Store } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export interface TextAnnotationStore<T extends TextAnnotation = TextAnnotation> extends Omit<Store<T>, 'addAnnotation' | 'bulkAddAnnotation'> {

  // Minor changes to default Annotorious store - text store returns feedback
  // on annotations that failed to render, to support lazy document loading scenarios
  addAnnotation(annotation: T, origin?: Origin): boolean;

  bulkAddAnnotation(annotations: T[], replace: boolean, origin?: Origin): T[];

  bulkUpsertAnnotations(annotations: T[], origin?: Origin): T[];

  getAnnotationRects(id: string): DOMRect[];

  getAnnotationBounds(id: string, hintX?: number, hintY?: number, buffer?: number): DOMRect | undefined;

  getAnnotationRects(id: string): DOMRect[];

  getAt(x: number, y: number, filter?: Filter): T | undefined;

  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects<T>[];

  recalculatePositions(): void;

}

export interface AnnotationRects <T extends TextAnnotation = TextAnnotation> {

  annotation: T;

  rects: Rect[];

}

export interface Rect {

  x: number;

  y: number;

  width: number;

  height: number;

}
