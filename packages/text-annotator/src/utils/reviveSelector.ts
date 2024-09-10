import type { TextSelector } from '../model';
import { NOT_ANNOTATABLE_SELECTOR } from './splitAnnotatableRanges';

/**
 * Creates a new selector object with the revived DOM range from the given text annotation position
 * Only the annotatable elements are processed and counted towards the range
 *
 * @param selector annotation selector with start and end positions
 * @param container the HTML container of the annotated content
 *
 * @returns the revived selector
 */
export const reviveSelector = <T extends TextSelector>(selector: T, container: HTMLElement): T => {

  const { start, end } = selector;

  const offsetReference = selector.offsetReference || container;

  const iterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT, (node) =>
    node.parentElement?.closest(NOT_ANNOTATABLE_SELECTOR)
      ? NodeFilter.FILTER_SKIP
      : NodeFilter.FILTER_ACCEPT
  );

  // Position that contains the length of the preceding annotatable text nodes
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
  
  return {
    ...selector,
    range
  }

}
