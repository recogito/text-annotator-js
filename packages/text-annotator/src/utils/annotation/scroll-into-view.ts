import type { TextAnnotationStore } from '../../state';
import type { TextAnnotation } from '../../model';
import { reviveTarget } from '../annotation';

const getScrollParent = (el: Element) => {
  if (!el)
    return document.scrollingElement;

  const { overflowY } = window.getComputedStyle(el);
  const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

  // Cf. discussion https://stackoverflow.com/questions/35939886/find-first-scrollable-parent
  if (isScrollable && el.scrollHeight > el.clientHeight)
    return el;
  else
    return getScrollParent(el.parentElement);
};

// Executes scroll on an annotation with a valid DOM range selector
const scroll = <I extends TextAnnotation = TextAnnotation>(
  store: TextAnnotationStore<I>,
  target: I['target'],
  scrollParent: Element
) => {
  // Parent bounds and client (= visible) height
  const parentBounds = scrollParent.getBoundingClientRect();
  const parentHeight = scrollParent.clientHeight;
  const parentWidth = scrollParent.clientWidth;

  // Position of the annotation relative to viewport
  const annotationBounds = target.selector[0].range.getBoundingClientRect();

  /*
   Note: `getBoundingClientRect` seems to return the wrong height!
   (Includes block elements?)
   Instead, the normalized height is used from the spatial index!
  */
  const { width, height } = store.getAnnotationBounds(target.annotation);

  // Position of the annotation relative to scrollParent
  const offsetTop = annotationBounds.top - parentBounds.top;
  const offsetLeft = annotationBounds.left - parentBounds.left;

  const scrollTop = scrollParent.parentElement ? scrollParent.scrollTop : 0;
  const scrollLeft = scrollParent.parentElement ? scrollParent.scrollLeft : 0;

  // Scroll the annotation to the center of the viewport
  const top = offsetTop + scrollTop - (parentHeight - height) / 2;
  const left = offsetLeft + scrollLeft - (parentWidth - width) / 2;

  scrollParent.scroll({ top, left, behavior: 'smooth' });
};

export const scrollIntoView = <I extends TextAnnotation = TextAnnotation>(
  container: HTMLElement, store: TextAnnotationStore<I>
) => <E extends Element = Element>(
  annotationOrId: string | I, scrollParentOrId?: string | E
) => {
  const id =
    typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;

  const scrollParent = scrollParentOrId
    ? typeof scrollParentOrId === 'string' ? document.getElementById(scrollParentOrId) : scrollParentOrId
    : getScrollParent(container);


  if (!scrollParent) {
    console.warn(`The scroll parent is missing for the annotation: ${id}`, { container });
    return false;
  }

  // Get curren version of the annotation from the store
  const current = store.getAnnotation(id);
  if (!current) {
    console.warn(`The annotation is missing in the store: ${id}`);
    return false;
  }

  // The first selector is the topmost one as well
  const { range: annoRange } = current.target.selector[0];
  if (annoRange && !annoRange.collapsed) {
    scroll(store, current.target, scrollParent);
    return true;
  }

  // Try reviving to account for lazy rendering
  const revived = reviveTarget(current.target, container);
  const { range: revivedAnnoRange } = revived.selector[0];
  if (revivedAnnoRange && !revivedAnnoRange.collapsed) {
    scroll(store, revived, scrollParent);
    return true;
  }

  return false;
};
