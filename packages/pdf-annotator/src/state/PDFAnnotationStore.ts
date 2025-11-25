import type { TextAnnotationStore } from '@recogito/text-annotator';
import type { PDFAnnotation } from '../PDFAnnotation';

export interface PDFAnnotationStore extends TextAnnotationStore<PDFAnnotation> {

  onLazyRender(page: number): void;   
  
}