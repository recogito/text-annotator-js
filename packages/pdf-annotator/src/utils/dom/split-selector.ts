import type { TextSelector } from '@recogito/text-annotator';

export const isSamePage = (selector: TextSelector) => {
  const startPage = selector.range.startContainer.parentElement.closest('.page');
  const endPage = selector.range.endContainer.parentElement.closest('.page');
  return startPage === endPage;
}

const pageRangeToTextSelectorSelector = (range: Range): TextSelector => {
  const rangeBefore = document.createRange();

  const offsetReference: HTMLElement = range.startContainer instanceof HTMLElement 
    ? range.startContainer.closest('.page')
    : range.startContainer.parentElement.closest('.page');

  // A helper range from the start of the container to the start of the selection
  rangeBefore.setStart(offsetReference, 0);
  rangeBefore.setEnd(range.startContainer, range.startOffset);

  const quote = range.toString();
  const start = rangeBefore.toString().length || 0;
  const end = start + quote.length;

  return { 
    end,
    offsetReference,
    quote, 
    range,
    start
  }

}

export const splitSelector = (selector: TextSelector): TextSelector[] => {
  const startPage = selector.range.startContainer.parentElement.closest('.page');
  const endPage = selector.range.endContainer.parentElement.closest('.page');

  if (startPage === endPage)
    return [selector];

  const ranges = [];

  let currentPage = startPage;

  while (currentPage) {
    const pageRange = document.createRange();

    if (currentPage === startPage) {
      pageRange.setStart(selector.range.startContainer, selector.range.startOffset);
      pageRange.setEndAfter(currentPage.lastChild);
    } else if (currentPage === endPage) {
      pageRange.setStartBefore(currentPage.firstChild);
      pageRange.setEnd(selector.range.endContainer, selector.range.endOffset);
    } else {
      pageRange.selectNodeContents(currentPage);
    }

    if (!pageRange.collapsed)
      ranges.push(pageRange);

    if (currentPage === endPage) {
      currentPage = undefined;
    } else {
      currentPage = currentPage.nextElementSibling;
    }
  }

  return ranges.map(pageRangeToTextSelectorSelector);

}
