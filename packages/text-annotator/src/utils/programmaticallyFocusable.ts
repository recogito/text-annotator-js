/**
 * Makes an element programmatically focusable by adding a `tabindex="-1"` attribute.
 * Or does nothing if the element is already focusable 🤷🏻
 * It's required to process keyboard events on an element that is not natively focusable.
 */
export const programmaticallyFocusable = (container: HTMLElement) => {
  if (!container.hasAttribute('tabindex') && container.tabIndex < 0) {
    container.setAttribute('tabindex', '-1');
  }

  container.classList.add('no-focus-outline');
};
