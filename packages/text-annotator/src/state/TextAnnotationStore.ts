import type { Unsubscribe } from 'nanoevents';
import type { Filter, Origin, Store } from '@annotorious/core';

import type { TextAnnotation } from '../model';
import type { SpatialTreeEvents } from './spatialTree';


export interface TextAnnotationStore extends Omit<Store<TextAnnotation>, 'addAnnotation' | 'bulkAddAnnotation'> {

  // Minor changes to default Annotorious store - text store returns feedback
  // on annotations that failed to render, to support lazy document loading scenarios
  addAnnotation(annotation: TextAnnotation, origin?: Origin): boolean;

  bulkAddAnnotation(annotations: TextAnnotation[], replace: boolean, origin?: Origin): TextAnnotation[];

  bulkUpsertAnnotations(annotations: TextAnnotation[], origin?: Origin): TextAnnotation[];

  getAnnotationBounds(id: string, hintX?: number, hintY?: number, buffer?: number): DOMRect;

  getAt(x: number, y: number, filter?: Filter): TextAnnotation | undefined;

  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects[];

  recalculatePositions(): void;

  onRecalculatePositions(callback: SpatialTreeEvents['recalculate']): Unsubscribe;

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
