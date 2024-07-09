/**
 * Event need to be manually mapped into a new object
 * to preserve the `target` and `currentTarget` properties.
 * Otherwise, they will be `null` when the event is read beyond the handler.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
 */
export const clonePointerEvent = (event: PointerEvent): PointerEvent => ({
  ...event,
  type: event.type,
  x: event.x,
  y: event.y,
  clientX: event.clientX,
  clientY: event.clientY,
  offsetX: event.offsetX,
  offsetY: event.offsetY,
  screenX: event.screenX,
  screenY: event.screenY,
  isPrimary: event.isPrimary,
  altKey: event.altKey,
  ctrlKey: event.ctrlKey,
  metaKey: event.metaKey,
  button: event.button,
  buttons: event.buttons,
  currentTarget: event.currentTarget,
  target: event.target,
  defaultPrevented: event.defaultPrevented,
  pointerId: event.pointerId,
  pointerType: event.pointerType,
  shiftKey: event.shiftKey
})
