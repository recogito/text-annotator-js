import type { TextAnnotation } from '../model';
import { isRevived } from './isRevived';
import { reviveTarget } from './reviveTarget';

export const reviveAnnotation = (annotation: TextAnnotation, container: HTMLElement): TextAnnotation =>
  isRevived(annotation.target.selector)
    ? annotation
    : ({ ...annotation, target: reviveTarget(annotation.target, container) });