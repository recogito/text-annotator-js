import type { TextAnnotationTarget } from '../model';
import { isRevived } from './isRevived';
import { reviveSelector } from './reviveSelector';

export const reviveTarget = <T extends TextAnnotationTarget = TextAnnotationTarget>(target: T, container: HTMLElement): T =>
  isRevived(target.selector)
    ? target
    : ({
      ...target,
      selector: target.selector.map(s => s.range instanceof Range && !s.range.collapsed ? s : reviveSelector(s, container))
    });


