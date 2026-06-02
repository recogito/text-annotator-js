import type { Annotation, AnnotationTarget } from '@annotorious/core';

/**
 * The Text Annotator model is becoming slightly complex. But it seems
 * justified since we need to dealing with two orthogonal issues:
 * 
 * - Annotations come in "revived" and "unrevived" states (with or without 
 *   resolved DOM elements: Range and offset element)
 * - Annotations can be "plain" HTML/text annotations with `start` and `end`
 *   character offset fields, or annotations from extensions (TEI/XML, PDF)
 *   which handle the serializable anchoring differently (XPath, pages)
 */

export interface TextAnnotationLike extends Annotation {

  target: TextAnnotationTargetLike;

}

export interface TextAnnotationTargetLike extends AnnotationTarget {

  selector: TextSelectorLike[];

}

export interface TextSelectorLike {

  id?: string;

  quote: string;

  offsetReference?: HTMLElement;

}

export interface RevivedTextSelectorLike extends TextSelectorLike {

  range: Range;

}

/**
 * Core classes - this is what most parts of the core deal with:
 * a TextAnnotationLike with all-revived selectors
 */
export type RevivedTextAnnotationLike<T extends TextAnnotationLike = TextAnnotationLike> = T & {

  target: RevivedTextAnnotationTargetLike<T['target']>;

}

export type RevivedTextAnnotationTargetLike<T extends TextAnnotationTargetLike = TextAnnotationTargetLike> = Omit<T, 'selector'> & {

  selector: RevivedTextSelectorLike[];

}

/**
 * Default specialization of TextAnnotationLike
 */
export interface TextAnnotation extends TextAnnotationLike {

  target: TextAnnotationTarget;

}

export interface TextAnnotationTarget extends TextAnnotationTargetLike {

  selector: TextSelector[];

}

export interface TextSelector extends TextSelectorLike {
  
  start: number;

  end: number;

}

export type RevivedTextSelector = TextSelector & RevivedTextSelectorLike;

/**
 * Utility type guards
 */
export const isRevivedAnnotation = (annotation: TextAnnotationLike): annotation is RevivedTextAnnotationLike => 
  annotation.target.selector.every(isRevived);

export const isRevivedTarget = (target: TextAnnotationTargetLike): target is RevivedTextAnnotationTargetLike => target.selector.every(isRevived);

export function isRevived(selector: TextSelectorLike): selector is RevivedTextSelectorLike;
export function isRevived(selectors: TextSelectorLike[]): selectors is RevivedTextSelectorLike[];
export function isRevived(selector: TextSelectorLike | TextSelectorLike[]): boolean {
  return Array.isArray(selector)
    ? selector.every(s => 'range' in s && s.range instanceof Range && !s.range.collapsed)
    : 'range' in selector && selector.range instanceof Range && !selector.range.collapsed;
}