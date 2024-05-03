import { NOT_ANNOTATABLE_SELECTOR } from './splitAnnotatableRanges';

/** 
 * Calls .preventDefault() on click events in annotable areas, in order
 * to prevent problematic default browser behavior. (Specifically: keep
 * Chrome Android from triggering word selection on single click.)
 */
export const cancelSingleClickEvents = (container: HTMLElement) => {
  container.addEventListener('click', event => {
    const targetElement = event.target as HTMLElement;

    const shouldPrevent =
      // Allow clicks within not-annotatable elements
      !targetElement.closest(NOT_ANNOTATABLE_SELECTOR)
      // Allow clicks on links
      && !(event.target as Element).closest('a');

    if (shouldPrevent)
      event.preventDefault();
  });
}