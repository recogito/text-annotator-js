import type { Unsubscribe } from 'nanoevents';
import type { Filter, Origin, Store } from '@annotorious/core';
import type { RevivedTextAnnotationLike, TextAnnotation, TextAnnotationLike } from '../model';
import type { SpatialTreeEvents } from '../state/spatial-tree';

export interface TextAnnotationStore<T extends TextAnnotationLike = TextAnnotation>
  extends Omit<Store<T>, 'addAnnotation' | 'bulkAddAnnotations' | 'bulkUpsertAnnotations' | 'syncAnnotations'> {

  // Minor changes to default Annotorious store - text store returns feedback
  // on annotations that failed to render, to support lazy document loading scenarios
  addAnnotation(annotation: T, origin?: Origin): boolean;

  /**
   * @deprecated use {@link syncAnnotations} (replace) or {@link bulkUpsertAnnotations} (merge) instead.
   */
  bulkAddAnnotations(annotations: T[], replace: boolean, origin?: Origin): T[];

  bulkUpsertAnnotations(annotations: T[], origin?: Origin): T[];

  syncAnnotations(annotations: T[], origin?: Origin): T[];

  getAnnotationRects(id: string): DOMRect[];

  getAnnotationBounds(id: string): DOMRect | undefined;

  getAnnotationRects(id: string): DOMRect[];

  getAt(x: number, y: number, all: true, filter?: Filter): RevivedTextAnnotationLike<T>[] | undefined;
  getAt(x: number, y: number, all: false, filter?: Filter): RevivedTextAnnotationLike<T>| undefined;
  getAt(x: number, y: number, all?: boolean, filter?: Filter): RevivedTextAnnotationLike<T> | RevivedTextAnnotationLike<T>[] | undefined;

  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects<RevivedTextAnnotationLike<T>>[];

  recalculatePositions(): void;

  onRecalculatePositions(callback: SpatialTreeEvents['recalculate']): Unsubscribe;

}

export interface AnnotationRects <T extends TextAnnotationLike = TextAnnotation> {

  annotation: T;

  rects: Rect[];

}

export interface Rect {

  x: number;

  y: number;

  width: number;

  height: number;

}
