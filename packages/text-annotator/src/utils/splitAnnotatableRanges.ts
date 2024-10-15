export const NOT_ANNOTATABLE_CLASS = 'not-annotatable';

export const NOT_ANNOTATABLE_SELECTOR = `.${NOT_ANNOTATABLE_CLASS}`;

export const isNotAnnotatable = (node: Node): boolean => {
  const closestNotAnnotatable = node instanceof HTMLElement
    ? node.closest(NOT_ANNOTATABLE_SELECTOR)
    : node.parentElement?.closest(NOT_ANNOTATABLE_SELECTOR);
  return Boolean(closestNotAnnotatable);
}

export const isRangeAnnotatable = (range: Range): boolean => {
  const ancestor = range.commonAncestorContainer;
  return !isNotAnnotatable(ancestor);
}

const iterateNotAnnotatableElements = function*(range: Range): Generator<HTMLElement> {
  const notAnnotatableIterator = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    (node) =>
      node instanceof HTMLElement // Only elements that can have the class applied
      && node.classList.contains(NOT_ANNOTATABLE_CLASS) // Only elements that are not annotatable
      && !node.parentElement.closest(NOT_ANNOTATABLE_SELECTOR) // Only elements that are not descendants of a not annotatable element
      && range.intersectsNode(node) // Only elements that are within the range
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
  contents.querySelectorAll(NOT_ANNOTATABLE_SELECTOR).forEach((el) => el.remove());
  return contents;
}
