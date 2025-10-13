/**
 * Offsets the given rect relative to the offset parent.
 */
export const toParentBounds = (rect: DOMRect, offset: DOMRect): DOMRect => {
  const { left, top, right, bottom } = rect;
  return new DOMRect(left - offset.left, top - offset.top, right - left, bottom - top);
};

/**
 * Inverse: translates the given relative rect back into viewport bounds.
 */
export const toViewportBounds = (rect: DOMRect, offset: DOMRect): DOMRect => {
  const { left, top, right, bottom } = rect;
  return new DOMRect(left + offset.left, top + offset.top, right - left, bottom - top);
}
