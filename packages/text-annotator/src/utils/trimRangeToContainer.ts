export const trimRangeToContainer = (
  range: Range,
  container: HTMLElement
): Range => {
  const trimmedRange = range.cloneRange();

  /**
   * If the range starts outside the container -
   * trim it to the start of the container
   */
  if (!container.contains(trimmedRange.startContainer)) {
    trimmedRange.setStart(container, 0);
  }

  /**
   * If the range ends outside the container -
   * trim it to the end of the container
   */
  if (!container.contains(trimmedRange.endContainer)) {
    trimmedRange.setEnd(container, container.childNodes.length);
  }

  return trimmedRange;
}
