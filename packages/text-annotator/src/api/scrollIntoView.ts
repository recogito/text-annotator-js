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
    const bounds = scrollParent.getBoundingClientRect();

    // Get curren version of the annotation from the store
    const current = store.getAnnotation(annotation.id);

    // Get position of the annotation relative to scroll parent
    const { x, y, width, height } = current.target.selector.range.getBoundingClientRect();
    const offsetTop = y - bounds.y;
    const offsetLeft = x - bounds.x;

    // Set scroll so that annotation is in the middle of the parent
    const top = offsetTop + height / 2 - scrollParent.clientHeight / 2;
    const left = offsetLeft + width / 2 - scrollParent.clientWidth / 2;

    scrollParent.scroll({ top, left, behavior: 'smooth' });
  }
}