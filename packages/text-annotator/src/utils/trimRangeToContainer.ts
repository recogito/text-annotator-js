import { rangeContains } from './rangeContains';

export const trimRangeToContainer = (
  range: Range,
  container: HTMLElement
): Range => {
  const trimmedRange = range.cloneRange();

  const containsRangeStart = container.contains(trimmedRange.startContainer);
  const containsRangeEnd = container.contains(trimmedRange.endContainer);

  /**
   * If both range's edges are not within the container (i.e. the selection is done outside)
   * and the range doesn't cover the container itself (i.e. "Select All" was pressed) ->
   * collapse it as irrelevant
   */
  if (!containsRangeStart && !containsRangeEnd) {
    const containedWithinRange = rangeContains(trimmedRange, container);
    if (!containedWithinRange) {
      trimmedRange.collapse();
      return trimmedRange;
    }
  }

  /**
   * If the range starts outside the container -
   * trim it to the start of the container
   */
  if (!containsRangeStart) {
    trimmedRange.setStart(container, 0);
  }

  /**
   * If the range ends outside the container -
   * trim it to the end of the container
   */
  if (!containsRangeEnd) {
    trimmedRange.setEnd(container, container.childNodes.length);
  }

  return trimmedRange;
};
