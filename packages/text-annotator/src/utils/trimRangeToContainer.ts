export const trimRangeToContainer = (
  range: Range,
  container: HTMLElement
): Range => {
  const trimmedRange = range.cloneRange();

  const containsStart = container.contains(trimmedRange.startContainer);
  const containsEnd = container.contains(trimmedRange.endContainer);

  /**
   * If both the start and the end are outside the container -
   * collapse such a range as irrelevant
   */
  if (!containsStart && !containsEnd) {
    trimmedRange.collapse();
    return trimmedRange;
  }

  /**
   * If the range starts outside the container -
   * trim it to the start of the container
   */
  if (!containsStart) {
    trimmedRange.setStart(container, 0);
  }

  /**
   * If the range ends outside the container -
   * trim it to the end of the container
   */
  if (!containsEnd) {
    trimmedRange.setEnd(container, container.childNodes.length);
  }

  return trimmedRange;
};
