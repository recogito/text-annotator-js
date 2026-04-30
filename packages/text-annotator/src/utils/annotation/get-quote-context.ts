import { getRangeAnnotatableContents } from '../dom';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

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

  const prefixGraphemes = [...segmenter.segment(before)];
  const suffixGraphemes = [...segmenter.segment(after)];

  return {
    prefix: prefixGraphemes.slice(-length).map(s => s.segment).join(''),
    suffix: suffixGraphemes.slice(0, length).map(s => s.segment).join('')
  };
}
