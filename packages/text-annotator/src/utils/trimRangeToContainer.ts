export const trimRangeToContainer = (
  range: Range,
  container: HTMLElement
): Range => {
  const trimmedRange = range.cloneRange();

  // If the start is outside the container - set it to the start of the container
  if (!container.contains(trimmedRange.startContainer)) {
    trimmedRange.setStart(container, 0);
  }

  // If the end is outside the container - set it to the end of the container
  if (!container.contains(trimmedRange.endContainer)) {
    trimmedRange.setEnd(container, container.childNodes.length);
  }

  return trimmedRange;
};
