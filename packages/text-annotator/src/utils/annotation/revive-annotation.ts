import { isRevived, isRevivedTarget } from '../../model';
import { NOT_ANNOTATABLE_SELECTOR } from '../dom';
import type { 
  RevivedTextAnnotationLike, 
  RevivedTextAnnotationTargetLike, 
  RevivedTextSelector, 
  RevivedTextSelectorLike, 
  TextAnnotationLike, 
  TextAnnotationTargetLike, 
  TextSelector 
} from '../../model';

/**
 * Creates a new selector object with the revived DOM range from the given text annotation position
 * Only the annotatable elements are processed and counted towards the range
 *
 * @param selector annotation selector with start and end positions
 * @param container the HTML container of the annotated content
 *
 * @returns the revived selector
 */
export const reviveTextSelector = <T extends TextSelector>(
  selector: T, 
  container: HTMLElement
): RevivedTextSelector  => { 
  const { start, end } = selector;

  const offsetReference = selector.offsetReference || container;
  
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, (node) =>
    node.parentElement?.closest(NOT_ANNOTATABLE_SELECTOR)
      ? NodeFilter.FILTER_SKIP
      : NodeFilter.FILTER_ACCEPT
  );

  // Position that contains the length of the preceding annotatable text nodes
  let runningOffset = 0;

  const range = document.createRange();

  let n = walker.nextNode();
  if (n === null) console.error('Could not revive annotation target. Content missing.');

  // If there's no offset reference, start immediately
  let startCounting = !offsetReference;
  while (n !== null) {
    startCounting ||= (typeof offsetReference?.contains === 'function') ? offsetReference.contains(n) : false;

    if (startCounting) {
      const len = n.textContent?.length || 0;

      if (runningOffset + len > start) {
        range.setStart(n, start - runningOffset);
        break;
      }

      runningOffset += len;
    }

    n = walker.nextNode();
  }

  // set range end
  while (n !== null) {
    const len = n.textContent?.length || 0;

    if (runningOffset + len >= end) {
      range.setEnd(n, end - runningOffset);
      break;
    }

    runningOffset += len;

    n = walker.nextNode();
  }
  
  return {
    ...selector,
    range
  }

}

export const reviveTarget = <T extends TextAnnotationTargetLike>(
  target: T, 
  container: HTMLElement,
  reviveFn: (arg: T['selector'][number], container: HTMLElement) => RevivedTextSelectorLike =
    (s, c) => reviveTextSelector(s as TextSelector, c) as RevivedTextSelectorLike
): RevivedTextAnnotationTargetLike<T> =>
  isRevivedTarget(target)
    ? target
    : ({
      ...target,
      selector: target.selector.map(s => isRevived(s) ? s : reviveFn(s, container))
    });

export const reviveAnnotation = <T extends TextAnnotationLike>(
  annotation: T, 
  container: HTMLElement,
  reviveFn?: (arg: T['target']['selector'][number], container: HTMLElement) => RevivedTextSelectorLike
): RevivedTextAnnotationLike<T> =>
  isRevivedTarget(annotation.target)
    ? annotation as RevivedTextAnnotationLike<T>
    : ({ ...annotation, target: reviveTarget(annotation.target, container, reviveFn) } as RevivedTextAnnotationLike<T>);