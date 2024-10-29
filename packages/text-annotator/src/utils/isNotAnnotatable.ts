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