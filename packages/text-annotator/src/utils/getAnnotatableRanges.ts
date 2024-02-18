const notAnnotatableToken = 'not-annotatable';
export const notAnnotatableSelector = `.${notAnnotatableToken}`;

const isRangeNotAnnotatable = (range: Range): boolean => {
  const ancestor = range.commonAncestorContainer;
  return ancestor instanceof HTMLElement
    ? !!ancestor.closest(notAnnotatableSelector)
    : !!ancestor.parentElement?.closest(notAnnotatableSelector);
};

const iterateRangeNotAnnotatableElements = function*(range: Range): Generator<HTMLElement> {
  const notAnnotatableIterator = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    (node) =>
      node instanceof HTMLElement && node.classList.contains(notAnnotatableToken) && range.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
  );

  let notAnnotatableNode: Node | null;
  while ((notAnnotatableNode = notAnnotatableIterator.nextNode())) {
    if (notAnnotatableNode instanceof HTMLElement) {
      yield notAnnotatableNode;
    }
  }
};


export const getAnnotatableRanges = (range: Range): Range[] => {
  // Nothing to annotate within a not annotatable element 🤷🏻
  if (isRangeNotAnnotatable(range)) return [];

  const annotatableRanges: Range[] = [];

  let prevNotAnnotatable: HTMLElement | null = null;
  for (const notAnnotatable of iterateRangeNotAnnotatableElements(range)) {
    let subRange: Range;

    /*
     From the start of the range to the not annotatable element
     When the selection starts on the `notAnnotatable` element - a collapsed range will be created and ignored
    */
    if (!prevNotAnnotatable) {
      subRange = range.cloneRange();
      subRange.setEndBefore(notAnnotatable);
    } else {
      // From the previous not annotatable element to the current not annotatable element
      subRange = document.createRange();
      subRange.setStartAfter(prevNotAnnotatable);
      subRange.setEndBefore(notAnnotatable);
    }

    if (!subRange.collapsed) {
      annotatableRanges.push(subRange);
    }
    prevNotAnnotatable = notAnnotatable;
  }

  // From the last not annotatable element to the end of the parent range
  if (prevNotAnnotatable) {
    const lastRange = range.cloneRange();
    lastRange.setStartAfter(prevNotAnnotatable);
    if (!lastRange.collapsed) {
      annotatableRanges.push(lastRange);
    }
  }

  return annotatableRanges.length > 0 ? annotatableRanges : [range];
};
export const getRangeAnnotatableContents = (range: Range): DocumentFragment => {
  const contents = range.cloneContents();
  contents.querySelectorAll(notAnnotatableSelector).forEach((el) => el.remove());
  return contents;
};
