import type { TextAnnotation } from '../model/TextAnnotation';

export const scrollIntoView = (container: HTMLElement) => (annotation: TextAnnotation) => {
  const getScrollParent = (el: Element) => {
    if (el === null)
      return null;
  
    if (el.scrollHeight > el.clientHeight)
      return el;
    else
      return getScrollParent(el.parentElement);
  }

  // Get closest scrollable parent
  const scrollParent: Element = getScrollParent(container);
  const bounds = scrollParent.getBoundingClientRect();

  // Get position of the annotation relative to scroll parent
  const { x, y, width, height } = annotation.target.selector.range.getBoundingClientRect();
  const offsetTop = y - bounds.y;
  const offsetLeft = x - bounds.x;

  // Set scroll so that annotation is in the middle of the parent
  const top = offsetTop + height / 2 - scrollParent.clientHeight / 2;
  const left = offsetLeft + width / 2 - scrollParent.clientWidth / 2;

  scrollParent.scroll({ top, left, behavior: 'smooth' });
}