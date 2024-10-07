import type { Unsubscribe } from 'nanoevents';
import type { Filter, Origin, Store } from '@annotorious/core';

import type { TextAnnotation } from '../model';
import type { SpatialTreeEvents } from './spatialTree';


export interface TextAnnotationStore<T extends TextAnnotation = TextAnnotation> extends Omit<Store<T>, 'addAnnotation' | 'bulkAddAnnotation'> {

  // Minor changes to default Annotorious store - text store returns feedback
  // on annotations that failed to render, to support lazy document loading scenarios
  addAnnotation(annotation: T, origin?: Origin): boolean;

  bulkAddAnnotation(annotations: T[], replace: boolean, origin?: Origin): T[];

  bulkUpsertAnnotations(annotations: T[], origin?: Origin): T[];

  getAnnotationBounds(id: string, hintX?: number, hintY?: number, buffer?: number): DOMRect;

  getAnnotationRects(id: string): DOMRect[];

  getAt(x: number, y: number, filter?: Filter): T | undefined;

  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects<T>[];

  recalculatePositions(): void;

  onRecalculatePositions(callback: SpatialTreeEvents['recalculate']): Unsubscribe;

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
