export const toParentBounds = (rect: DOMRect, offset: DOMRect): DOMRect => {
  const { left, top, right, bottom } = rect;
  return new DOMRect(left - offset.left, top - offset.top, right - left, bottom - top);
};

export const toViewportBounds = (rect: DOMRect, offset: DOMRect): DOMRect => {
  const { left, top, right, bottom } = rect;
  return new DOMRect(left + offset.left, top + offset.top, right - left, bottom - top);
}
