import { getRangeAnnotableContents } from './getAnnotableRanges';
import type { TextSelector } from '../model';

export const rangeToSelector = (
  range: Range,
  container: HTMLElement,
  offsetReferenceSelector?: string
): TextSelector => {
  const rangeBefore = document.createRange();

  const offsetReference: HTMLElement = offsetReferenceSelector
    ? (range.startContainer.parentElement as HTMLElement).closest(offsetReferenceSelector)!
    : container;

  // A helper range from the start of the container to the start of the selection
  rangeBefore.setStart(offsetReference, 0);
  rangeBefore.setEnd(range.startContainer, range.startOffset);

  // A content range before content w/o not annotable elements
  const before = getRangeAnnotableContents(rangeBefore).textContent;

  const quote = range.toString();
  const start = before.length || 0;
  const end = start + quote.length;

  return offsetReferenceSelector
    ? { quote, start, end, range, offsetReference }
    : { quote, start, end, range };
};
