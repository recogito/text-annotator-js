import type { TextAnnotationStore } from '../state';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import { reviveTarget } from '../utils';

const getScrollParent = (el: Element) => {
  if (el === null)
    return document.scrollingElement;

  const { overflowY } = window.getComputedStyle(el);
  const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

  // Cf. discussion https://stackoverflow.com/questions/35939886/find-first-scrollable-parent
  if (isScrollable && el.scrollHeight > el.clientHeight)
    return el;
  else
    return getScrollParent(el.parentElement);
};

export const scrollIntoView = (container: HTMLElement, store: TextAnnotationStore) => (annotation: TextAnnotation) => {

  // Executes scroll on an annotation with a valid DOM range selector
  const scroll = (target: TextAnnotationTarget) => {
    // Parent bounds and client (= visible) height
    const parentBounds = scrollParent.getBoundingClientRect();
    const parentHeight = scrollParent.clientHeight;
    const parentWidth = scrollParent.clientWidth;

    // Position of the annotation relative to viewport
    const topAnnotationBounds = target.selector[0].range.getBoundingClientRect();

    // Note: getBoundingClientRect seems to return wrong height! 
    // (Includes block elements?) We'll therefore use the normalized height
    // from the spatial index!
    const { width, height } = store.getAnnotationBounds(annotation.id);

    // Position of the annotation relative to scrollParent
    const offsetTop = topAnnotationBounds.top - parentBounds.top;
    const offsetLeft = topAnnotationBounds.left - parentBounds.left;

    const scrollTop = scrollParent.parentElement ? scrollParent.scrollTop : 0;
    const scrollLeft = scrollParent.parentElement ? scrollParent.scrollLeft : 0;

    // Scroll the annotation to the center of the viewport
    const top = offsetTop + scrollTop - (parentHeight - height) / 2;
    const left = offsetLeft + scrollLeft - (parentWidth - width) / 2;

    scrollParent.scroll({ top, left, behavior: 'smooth' });
  };

  // Get closest scrollable parent
  const scrollParent: Element = getScrollParent(container);
  if (scrollParent) {
    // Get curren version of the annotation from the store
    const current = store.getAnnotation(annotation.id);

    // The 1st selector is the topmost one as well
    const { range } = current.target.selector[0];
    if (range && !range.collapsed) {
      scroll(current.target);
      return true;
    } else {
      // Try reviving to account for lazy rendering
      const revived = reviveTarget(current.target, container);
      const { range } = revived.selector[0];
      if (range && !range.collapsed) {
        scroll(revived);
        return true;
      }
    }
  }

  return false;
};
