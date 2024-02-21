import { getRangeAnnotatableContents } from './splitAnnotatableRanges';

export const getQuoteContext = (
  range: Range, 
  container: HTMLElement, 
  length = 10,
  offsetReferenceSelector?: string
) => {
  const offsetReference: HTMLElement = offsetReferenceSelector
    ? (range.startContainer.parentElement as HTMLElement).closest(offsetReferenceSelector)!
    : container;

  const rangeBefore = document.createRange();
  rangeBefore.setStart(offsetReference, 0);
  rangeBefore.setEnd(range.startContainer, range.startOffset);

  const before = getRangeAnnotatableContents(rangeBefore).textContent;
  
  const rangeAfter = document.createRange();
  rangeAfter.setStart(range.endContainer, range.endOffset);

  if (offsetReference === document.body)
    rangeAfter.setEnd(offsetReference, offsetReference.childNodes.length);
  else
    rangeAfter.setEndAfter(offsetReference);

  const after = getRangeAnnotatableContents(rangeAfter).textContent;

  return {
    prefix: before.substring(before.length - length),
    suffix: after.substring(0, length)
  }
}
