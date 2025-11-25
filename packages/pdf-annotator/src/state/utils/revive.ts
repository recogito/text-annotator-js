import type { TextAnnotation, TextAnnotationTarget, TextSelector } from '@recogito/text-annotator';
import type { PDFAnnotation, PDFAnnotationTarget, PDFSelector } from '../../PDFAnnotation';

/**
 * Revives the given annotation target, if needed.
 * 
 * - if there is a valid offsetReference element, it will reconstruct the PDF page number if needed.
 * - vice versa, if there is no offsetReference, but a pageNumber, it will add in the offsetReference element.
 * 
 * Targets that have neither a pageNumber nor an offsetReference shouldn't be possible. (Annotations
 * created by the user will always have an offsetReference, annotations coming from the backend or 
 * realtime channel will always have a page number).
 */
export const reviveTarget = (target: PDFAnnotationTarget | TextAnnotationTarget): PDFAnnotationTarget => ({
  ...target,
  selector: target.selector.map(reviveSelector)
});

export const reviveSelector = (selector: PDFSelector | TextSelector): PDFSelector => {
  const hasValidOffsetReference = 
    'offsetReference' in selector && 
    selector.offsetReference instanceof HTMLElement;

  if (hasValidOffsetReference) {
    if ('pageNumber' in selector) {
      // Already a PDF selector - doesn't need reviving
      return selector as PDFSelector;
    } else {
      // No pageNumber, but offsetReference element -> crosswalk
      const { offsetReference } = selector;
      const pageNumber = parseInt(offsetReference.dataset.pageNumber);
    
      // @ts-ignore
      return {
        ...selector,
        pageNumber 
      };
    }
  } else if ('pageNumber' in selector) {
    const { pageNumber } = selector;
    const offsetReference: HTMLElement = document.querySelector(`.page[data-page-number="${pageNumber}"]`);

    return {
      ...selector,
      offsetReference
    } as PDFSelector;
  } else { 
    // Has neither offsetReference - shouldn't happen
    console.warn('Invalid PDF selector', selector);
    return selector as PDFSelector;
  }
}

/** Helper: revives the target of the given annotation, if needed **/
export const reviveAnnotation = (a: PDFAnnotation | TextAnnotation): PDFAnnotation => ({
  ...a,
  target: reviveTarget(a.target)
});