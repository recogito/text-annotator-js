/**
 * Text annotation model types.
 * Defines the core data structures for text annotations.
 */

// ============================================
// Base Annotation Types (equivalent to @annotorious/core)
// ============================================

export interface AnnotationBody {
  id?: string;
  annotation?: string;
  type?: string;
  purpose?: string;
  value?: string;
  created?: Date;
  creator?: { id: string; name?: string };
  updated?: Date;
  updatedBy?: { id: string; name?: string };
}

export interface AnnotationTarget {
  annotation?: string;
  created?: Date;
  creator?: { id: string; name?: string };
  updated?: Date;
  updatedBy?: { id: string; name?: string };
}

export interface Annotation {
  id: string;
  bodies: AnnotationBody[];
  target: AnnotationTarget;
}

// ============================================
// Text-Specific Types
// ============================================

export interface TextSelector {
  id?: string;
  quote: string;
  start: number;
  end: number;
  range: Range;
  offsetReference?: HTMLElement;
}

export interface TextAnnotationTarget extends AnnotationTarget {
  selector: TextSelector[];
}

export interface TextAnnotation extends Annotation {
  target: TextAnnotationTarget;
}

// ============================================
// Rect Types (for spatial indexing)
// ============================================

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationRects<T extends TextAnnotation = TextAnnotation> {
  annotation: T;
  rects: Rect[];
}
