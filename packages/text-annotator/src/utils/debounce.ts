import libDebounce from 'debounce';

/**
 * Wraps the `debounce` function from the `debounce` package
 * to make it context-agnostic.
 * Otherwise, we won't be able to use it in multiple event listeners simultaneously,
 * like `window.onresize` and `ResizeObserver`.
 * @see https://github.com/sindresorhus/debounce/issues/8#issuecomment-2321341074
 */
export const debounce: typeof libDebounce = (function_, wait = 10, options) => {
  const fn = libDebounce(function_, wait, options);

  const boundFn = fn.bind(undefined);

  Object.getOwnPropertyNames(fn).forEach(
    prop => Object.defineProperty(boundFn, prop, Object.getOwnPropertyDescriptor(fn, prop))
  );
  const proto = Object.getPrototypeOf(fn);
  Object.setPrototypeOf(boundFn, proto);

  return boundFn;
}
