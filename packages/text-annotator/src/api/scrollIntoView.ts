import type { TextAnnotationStore } from 'src/state';
import type { TextAnnotation } from '../model/TextAnnotation';

const getScrollParent = (el: Element) => {
  if (el === null)
    return null;

  if (el.scrollHeight > el.clientHeight)
    return el;
  else
    return getScrollParent(el.parentElement);
}

export const scrollIntoView = (container: HTMLElement, store: TextAnnotationStore) => (annotation: TextAnnotation) => {
  // Get closest scrollable parent
  const scrollParent: Element = getScrollParent(container);
  if (scrollParent) {
    // Get curren version of the annotation from the store
    const current = store.getAnnotation(annotation.id);

    const { range } = current.target.selector;

    if (!range || range.collapsed)
      return false;

    // Parent bounds and client (= visible) height
    const parentBounds = scrollParent.getBoundingClientRect();
    const parentHeight = scrollParent.clientHeight;
    const parentWidth = scrollParent.clientWidth;

    // Position of the annotation relative to viewport
    const annotationBounds = current.target.selector.range.getBoundingClientRect();

    // Position of the annotation relative to scrollParent
    const offsetTop = annotationBounds.top - parentBounds.top;
    const offsetLeft = annotationBounds.left - parentBounds.left;

    const scrollTop = scrollParent.parentElement ? scrollParent.scrollTop : 0;
    const scrollLeft = scrollParent.parentElement ? scrollParent.scrollLeft : 0;

    // Scroll the annotation to the center of the viewport
    const top = offsetTop + scrollTop - (parentHeight - annotationBounds.height) / 2;
    const left = offsetLeft + scrollLeft - (parentWidth - annotationBounds.width) / 2;

    scrollParent.scroll({ top, left, behavior: 'smooth' });

    return true;
  }
}