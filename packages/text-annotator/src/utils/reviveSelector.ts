import type { TextSelector } from '../model';
import { NOT_ANNTOTATABLE_SELECTOR } from './splitAnnotatableRanges';

/**
 * Retrieves the DOM range from the given text annotation position
 * Only the annotatable elements are processed and counted towards the range
 *
 * @param start start of the annotated content
 * @param end end of the annotated content
 * @param offsetReference the HTML container of the annotated content
 *
 * @returns the DOM range
 */
const reviveRange = (start: number, end: number, offsetReference: HTMLElement): Range => {
  const iterator = document.createNodeIterator(offsetReference, NodeFilter.SHOW_TEXT, (node) =>
    node.parentElement?.closest(NOT_ANNTOTATABLE_SELECTOR)
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

  return range;
}

export const reviveSelector = (selector: TextSelector, container: HTMLElement): TextSelector => {
  const { start, end, offsetReference: selectorReference } = selector;

  const offsetReference = selectorReference || container;
  return offsetReference ? {
    ...selector,
    range: reviveRange(start, end, offsetReference)
  } : selector;
}

