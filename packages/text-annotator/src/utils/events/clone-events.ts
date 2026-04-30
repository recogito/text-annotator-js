/**
 * Events need to be manually mapped into new objects:
 * 1. It preserves the `target` and `currentTarget` properties.
 *    Otherwise, they will be `null` when the event is read beyond the handler.
 * 2. Spread operator can copy only own enumerable properties, not inherited ones.
 *    Therefore, we need to manually copy the props we're interested in.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
 * @see https://github.com/recogito/text-annotator-js/commit/65d13f3108c429311cf8c2523f6babbbc946013d#r144041390
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
  shiftKey: event.shiftKey,
  button: event.button,
  buttons: event.buttons,
  currentTarget: event.currentTarget,
  target: event.target,
  defaultPrevented: event.defaultPrevented,
  detail: event.detail,
  eventPhase: event.eventPhase,
  pointerId: event.pointerId,
  pointerType: event.pointerType,
  timeStamp: event.timeStamp
})

export const cloneKeyboardEvent = (event: KeyboardEvent): KeyboardEvent => ({
  ...event,
  type: event.type,
  key: event.key,
  code: event.code,
  location: event.location,
  repeat: event.repeat,
  altKey: event.altKey,
  ctrlKey: event.ctrlKey,
  metaKey: event.metaKey,
  shiftKey: event.shiftKey,
  currentTarget: event.currentTarget,
  target: event.target,
  defaultPrevented: event.defaultPrevented,
  detail: event.detail,
  timeStamp: event.timeStamp
})
