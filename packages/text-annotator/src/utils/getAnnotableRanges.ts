export const notAnnotableSelector = '[data-not-annotable="true"]';

const isRangeNotAnnotable = (range: Range): boolean => {
  const ancestor = range.commonAncestorContainer;
  return ancestor instanceof HTMLElement
    ? !!ancestor.closest(notAnnotableSelector)
    : !!ancestor.parentElement?.closest(notAnnotableSelector);
};

const iterateRangeNotAnnotableElements = function*(range: Range): Generator<HTMLElement> {
  const notAnnotableIterator = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    (node) =>
      node instanceof HTMLElement && node.dataset.notAnnotable && range.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
  );

  let notAnnotableNode: Node | null;
  while ((notAnnotableNode = notAnnotableIterator.nextNode())) {
    if (notAnnotableNode instanceof HTMLElement) {
      yield notAnnotableNode;
    }
  }
};


export const getAnnotableRanges = (range: Range): Range[] => {
  // Nothing to annotate within a not annotable element 🤷🏻
  if (isRangeNotAnnotable(range)) return [];

  const annotableRanges: Range[] = [];

  let prevNotAnnotable: HTMLElement | null = null;
  for (const notAnnotable of iterateRangeNotAnnotableElements(range)) {
    let subRange: Range;

    /*
     From the start of the range to the not annotable element
     When the selection starts on the `notAnnotable` element - a collapsed range will be created and ignored
    */
    if (!prevNotAnnotable) {
      subRange = range.cloneRange();
      subRange.setEndBefore(notAnnotable);
    } else {
      // From the previous not annotable element to the current not annotable element
      subRange = document.createRange();
      subRange.setStartAfter(prevNotAnnotable);
      subRange.setEndBefore(notAnnotable);
    }

    if (!subRange.collapsed) {
      annotableRanges.push(subRange);
    }
    prevNotAnnotable = notAnnotable;
  }

  // From the last not annotable element to the end of the parent range
  if (prevNotAnnotable) {
    const lastRange = range.cloneRange();
    lastRange.setStartAfter(prevNotAnnotable);
    if (!lastRange.collapsed) {
      annotableRanges.push(lastRange);
    }
  }

  return annotableRanges.length > 0 ? annotableRanges : [range];
};
export const getRangeAnnotableContents = (range: Range): DocumentFragment => {
  const contents = range.cloneContents();
  contents.querySelectorAll(notAnnotableSelector).forEach((el) => el.remove());
  return contents;
};
