import type { TextAnnotation, TextAnnotationTarget, TextSelector } from '@recogito/text-annotator';

export interface PDFAnnotation extends TextAnnotation {

  target: PDFAnnotationTarget;

}

export interface PDFAnnotationTarget extends TextAnnotationTarget {

  selector: PDFSelector[];

}

export interface PDFSelector extends TextSelector {

  pageNumber: number;

  quadpoints: number[];

}