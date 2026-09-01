import type { TextAnnotatorOptions } from '@recogito/text-annotator';
import type { PDFAnnotation } from './model';

export interface PDFAnnotatorOptions extends TextAnnotatorOptions<PDFAnnotation, PDFAnnotation> {

  workerSrc?: string;

}