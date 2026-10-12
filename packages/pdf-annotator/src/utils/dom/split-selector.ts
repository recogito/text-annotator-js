import type { RevivedTextSelector } from '@recogito/text-annotator';

// A boundary can be the .page element itself (e.g. in a piece
// already split by splitSelector), so look elements up from themselves
const getPage = (node: Node): HTMLElement | null => {
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  return element?.closest<HTMLElement>('.page') || null;
}

export const isSamePage = (selector: RevivedTextSelector) => {
  const startPage = getPage(selector.range.startContainer);
  const endPage = getPage(selector.range.endContainer);
  return startPage === endPage;
}

const pageRangeToTextSelectorSelector = (range: Range): RevivedTextSelector => {
  const rangeBefore = document.createRange();

  const offsetReference = getPage(range.startContainer)!;

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

export const splitSelector = (selector: RevivedTextSelector): RevivedTextSelector[] => {
  const startPage = getPage(selector.range.startContainer)!;
  const endPage = getPage(selector.range.endContainer)!;

  if (startPage === endPage)
    return [selector];

  const ranges = [];

  let currentPage: Element | undefined = startPage;

  while (currentPage) {
    const pageRange = document.createRange();

    if (currentPage === startPage) {
      pageRange.setStart(selector.range.startContainer, selector.range.startOffset);
      pageRange.setEndAfter(currentPage.lastChild!);
    } else if (currentPage === endPage) {
      pageRange.setStartBefore(currentPage.firstChild!);
      pageRange.setEnd(selector.range.endContainer, selector.range.endOffset);
    } else {
      pageRange.selectNodeContents(currentPage);
    }

    if (!pageRange.collapsed)
      ranges.push(pageRange);

    if (currentPage === endPage) {
      currentPage = undefined;
    } else {
      currentPage = currentPage.nextElementSibling!;
    }
  }

  return ranges.map(pageRangeToTextSelectorSelector);

}
