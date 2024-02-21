import { NOT_ANNOTATABLE_SELECTOR } from './splitAnnotatableRanges';

/**
 * Returns a DocumentFragment consisting of ONLY the annotatable content
 * in the given DOM Range.
 */
export const getAnnotatableFragment = (range: Range): DocumentFragment => {
  const fragment = range.cloneContents();
  fragment.querySelectorAll(NOT_ANNOTATABLE_SELECTOR).forEach(el => el.remove());
  return fragment;
}
