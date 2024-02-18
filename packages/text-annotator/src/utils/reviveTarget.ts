import type { TextAnnotationTarget } from '../model';
import { isRevived } from './isRevived';
import { reviveSelector } from './reviveSelector';

export const reviveTarget = (target: TextAnnotationTarget, container: HTMLElement): TextAnnotationTarget =>
  isRevived(target.selector)
    ? target
    : ({
      ...target,
      selector: target.selector.map(s => s.range instanceof Range ? s : reviveSelector(s, container))
    });


