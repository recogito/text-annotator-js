import type { TextAnnotationTarget } from '../model';

/**
 * Recalculates the DOM range from the given text annotation target.
 * 
 * @param annotation the text annotation
 * @param container the HTML container of the annotated content
 * @returns the DOM range
 */
export const reviveTarget = (target: TextAnnotationTarget, container: HTMLElement): TextAnnotationTarget => {
  const { quote, start, end } = target.selector;

  const iterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT);

  let runningOffset = 0;

  let range = document.createRange();

  let n = iterator.nextNode();
  if (n === null)
    console.warn('Empty node iterator!');

  // set range start
  while (n !== null) {
    const len = n.textContent.length;

    if (runningOffset + len > start) {
      range.setStart(n, start - runningOffset);
      break;
    }

    runningOffset += len;

    n = iterator.nextNode();
  }

  // set range end
  while (n !== null) {
    const len = n.textContent.length;

    if (runningOffset + len > end) {
      range.setEnd(n, end - runningOffset);
      break;
    }

    runningOffset += len;

    n = iterator.nextNode();
  }

  return {
    ...target,
    selector: { quote, start, end, range }
  }
}
