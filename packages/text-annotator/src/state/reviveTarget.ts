import type { TextAnnotationTarget } from '../model';
import { notAnnotableSelector } from '../utils';

/**
 * Retrieves the DOM range from the given text annotation position
 * Only the annotable elements are processed and counted towards the range
 *
 * @param start start of the annotated content
 * @param end end of the annotated content
 * @param offsetReference the HTML container of the annotated content
 *
 * @returns the DOM range
 */
export const reviveTargetRange = (start: number, end: number, offsetReference: HTMLElement): Range => {
  const iterator = document.createNodeIterator(offsetReference, NodeFilter.SHOW_TEXT, (node) =>
    node.parentElement?.closest(notAnnotableSelector)
      ? NodeFilter.FILTER_SKIP
      : NodeFilter.FILTER_ACCEPT
  );

  // Position that contains the length of the preceding annotable text nodes
  let runningOffset = 0;

  const range = document.createRange();

  let n = iterator.nextNode();
  if (n === null) console.error('Could not revive annotation target. Content missing.');

  // If there's no offset reference, start immediately
  let startCounting = !offsetReference;
  while (n !== null) {
    startCounting ||= offsetReference?.contains(n);

    if (startCounting) {
      const len = n.textContent?.length || 0;

      if (runningOffset + len > start) {
        range.setStart(n, start - runningOffset);
        break;
      }

      runningOffset += len;
    }

    n = iterator.nextNode();
  }

  // set range end
  while (n !== null) {
    const len = n.textContent?.length || 0;

    if (runningOffset + len >= end) {
      range.setEnd(n, end - runningOffset);
      break;
    }

    runningOffset += len;

    n = iterator.nextNode();
  }

  return range;
};


/**
 * Constructs a new target with the recalculated DOM range from the given text annotation target
 *
 * @param target the text annotation target
 * @param container the HTML container of the annotated content
 *
 * @returns the new text annotation target
 */
export const reviveTarget = (
  target: TextAnnotationTarget, 
  container: HTMLElement
): TextAnnotationTarget => {  
  const { start, end } = target.selector;

  const offsetReference = target.selector.offsetReference ? target.selector.offsetReference : container;
  return offsetReference ? {
    ...target,
    selector: {
      ...target.selector,
      range: reviveTargetRange(start, end, offsetReference)
    }
  } : target;

}
