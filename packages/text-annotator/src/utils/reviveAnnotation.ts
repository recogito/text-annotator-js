import type { TextAnnotation } from '../model';
import { isRevived } from './isRevived';
import { reviveTarget } from './reviveTarget';

export const reviveAnnotation = <T extends TextAnnotation>(annotation: T, container: HTMLElement): T =>
  isRevived(annotation.target.selector)
    ? annotation
    : ({ ...annotation, target: reviveTarget(annotation.target, container) });