import type { AnnotationLayer } from '@annotorious/core';
import type { TextAnnotation } from './model/TextAnnotation';

export type TextAnnotationLayer = AnnotationLayer<TextAnnotation> & ReturnType<typeof TextAnnotator>;

export const TextAnnotator = (element: HTMLElement) => {

  console.log('initializing...', element);

}