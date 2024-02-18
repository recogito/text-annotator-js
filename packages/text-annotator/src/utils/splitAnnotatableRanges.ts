const NOT_ANNTOTATABLE_CLASS = 'not-annotatable';

export const NOT_ANNTOTATABLE_SELECTOR = `.${NOT_ANNTOTATABLE_CLASS}`;

const isRangeAnnotatable = (range: Range): boolean => {
  const ancestor = range.commonAncestorContainer;
  return ancestor instanceof HTMLElement
    ? !ancestor.closest(NOT_ANNTOTATABLE_SELECTOR)
    : !ancestor.parentElement?.closest(NOT_ANNTOTATABLE_SELECTOR);
}

const iterateNotAnnotatableElements = function*(range: Range): Generator<HTMLElement> {
  const notAnnotatableIterator = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    (node) =>
      node instanceof HTMLElement && node.classList.contains(NOT_ANNTOTATABLE_CLASS) && range.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
  );

  let notAnnotatableNode: Node | null;

  while ((notAnnotatableNode = notAnnotatableIterator.nextNode())) {
    if (notAnnotatableNode instanceof HTMLElement) {
      yield notAnnotatableNode;
    }
  }
}

/**
 * Splits a DOM Range into one or more ranges that span annotatable content only.
 */
export const splitAnnotatableRanges = (range: Range): Range[] => {
  if (!isRangeAnnotatable(range)) return [];

  const annotatableRanges: Range[] = [];

  let prevNotAnnotatable: HTMLElement | null = null;

  for (const notAnnotatable of iterateNotAnnotatableElements(range)) {
    let subRange: Range;

    // From the start of the range to the not annotatable element.
    // If selection starts on the non-annotatable element, a collapsed range will be created and ignored.
    if (!prevNotAnnotatable) {
      subRange = range.cloneRange();
      subRange.setEndBefore(notAnnotatable);
    } else {
      // From the previous not annotatable element to the current not annotatable element
      subRange = document.createRange();
      subRange.setStartAfter(prevNotAnnotatable);
      subRange.setEndBefore(notAnnotatable);
    }

    if (!subRange.collapsed)
      annotatableRanges.push(subRange);

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
}

export const getRangeAnnotatableContents = (range: Range): DocumentFragment => {
  const contents = range.cloneContents();
  contents.querySelectorAll(NOT_ANNTOTATABLE_SELECTOR).forEach((el) => el.remove());
  return contents;
}
