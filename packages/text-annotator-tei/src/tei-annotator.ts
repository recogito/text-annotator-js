import { createTextAnnotator } from '@recogito/text-annotator';
import type { TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { Origin } from '@annotorious/core';
import type { Annotator, Store } from '@annotorious/core';
import { reviveSelector } from './crosswalk';
import type { TEIAnnotation } from './tei-annotation';

export type TEIAnnotationStore = Store<TEIAnnotation> & {

  bulkAddAnnotation(annotations: TextAnnotation[], replace: boolean, origin: Origin): TEIAnnotation[];

  getAt(x: number, y: number): TEIAnnotation | undefined;
  
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): TEIAnnotation[];
  
  recalculatePositions(): void;

}

export type TEIAnnotator<T extends unknown = TEIAnnotation> = Annotator<TEIAnnotation, T>;

export const createTEIAnnotator = <T extends unknown>(
  container: HTMLElement,
  options: TextAnnotatorOptions<TEIAnnotation, T> = {}
): TEIAnnotator => createTextAnnotator(container, {
  ...options,
  selectorReviveFn: reviveSelector
}) as unknown as TEIAnnotator;
