import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { createTextAnnotatorState, Origin } from '@recogito/text-annotator';
import type { 
  HoverState, 
  SelectionState, 
  TextAnnotation, 
  TextAnnotationTarget, 
  TextAnnotatorOptions,
  TextAnnotatorState,
  TextSelector
} from '@recogito/text-annotator';
import { shouldNotify } from '@annotorious/core';
import type { 
  StoreChangeEvent, 
  StoreObserveOptions, 
  StoreObserver, 
  ViewportState, 
  Update,
} from '@annotorious/core';
import type { PDFAnnotation, PDFAnnotationTarget } from '../PDFAnnotation';
import { getQuadPoints, reviveAnnotation, reviveTarget } from './utils';
import type { PDFAnnotationStore } from './PDFAnnotationStore';
import { createRenderedAnnotationsMap } from './renderedAnnotations';
import { splitSelector } from './utils/splitSelector';

export interface PDFAnnotatorState extends TextAnnotatorState<PDFAnnotation, PDFAnnotation> {

  store: PDFAnnotationStore;

  selection: SelectionState<PDFAnnotation, PDFAnnotation>;

  hover: HoverState<PDFAnnotation>;

  viewport: ViewportState;

}

export const createPDFAnnotatorState = (
  viewer: pdfjsViewer.PDFViewer,
  viewerElement: HTMLDivElement, 
  opts: TextAnnotatorOptions<PDFAnnotation>
): PDFAnnotatorState => {

  const renderedAnnotations = createRenderedAnnotationsMap();

  // The 'inner' text annotator
  const { store: innerStore, selection, hover, viewport } = createTextAnnotatorState(viewerElement, opts);

  const observers: StoreObserver<PDFAnnotation>[] = [];

  const observe = (onChange: { (event: StoreChangeEvent<PDFAnnotation>): void }, options: StoreObserveOptions = {}) =>
    observers.push({ onChange, options });

  const unobserve = (onChange: { (event: StoreChangeEvent<PDFAnnotation>): void }) => {
    const idx = observers.findIndex(observer => observer.onChange == onChange);
    if (idx > -1)
      observers.splice(idx, 1);
  }

  const emit = (event: StoreChangeEvent<PDFAnnotation>) => {
    observers.forEach(observer => {
      if (shouldNotify(observer, event))
        observer.onChange(event);
    });
  }

  const toPDFAnnotationTarget = (target: TextAnnotationTarget) => {    
    // Split the text annotation target across pages, if necessary.
    const split = target.selector.reduce<TextSelector[]>((all, selector) => (
      [...all, ...splitSelector(target.selector[0])]
    ), []);

    // CAUTION: some annotations seem to be re-split. Investigate! 

    // All rects, for all selectors
    const rects = innerStore.getAnnotationRects(target.annotation);

    // Container element bounds
    const offset = viewerElement.getBoundingClientRect().top;

    const getRectsForSelector = (selector: TextSelector) => {
      const bounds = selector.range.getBoundingClientRect();

      // Checking for vertical intersection is enough, because we know
      // we're splitting by pages
      return rects.filter(r => (
        r.top + offset <= bounds.bottom && r.bottom + offset >= bounds.top
      ));
    }

    const toPDFSelector = (s: TextSelector) => {
      const pageNumber = parseInt(s.offsetReference.dataset.pageNumber);
      return {
        ...s,
        pageNumber,
        quadpoints: getQuadPoints(getRectsForSelector(s), viewer.getPageView(pageNumber - 1), viewerElement)
      }
    }

    return {
      ...target,
      selector: split.map(toPDFSelector)
    } as PDFAnnotationTarget;
  }

  const toPDFAnnotation = (t: TextAnnotation) => ({
    ...t,
    target: toPDFAnnotationTarget(t.target)
  });

  /**********************/
  /* Wrapped store API **/
  /**********************/

  const addAnnotation = (annotation: PDFAnnotation, origin = Origin.LOCAL) => {
    const revived = reviveAnnotation(annotation);

    const success = innerStore.addAnnotation(revived, origin);
    renderedAnnotations.upsert(revived);

    return success;
  }

  const bulkAddAnnotations = (
    annotations: PDFAnnotation[], 
    replace: boolean,
    origin = Origin.LOCAL
  ) => {
    const revived = annotations.map(reviveAnnotation);
    revived.forEach(a => renderedAnnotations.upsert(a));

    return innerStore.bulkAddAnnotations(revived, replace, origin) as PDFAnnotation[];
  }

  const updateAnnotation = (annotation: PDFAnnotation, origin = Origin.LOCAL) => {
    const revived = reviveAnnotation(annotation);
    
    innerStore.updateAnnotation(revived, origin);

    renderedAnnotations.upsert(revived);
  }

  const updateTarget = (target: PDFAnnotationTarget, origin = Origin.LOCAL) => {
    const revived = reviveTarget(target);

    innerStore.updateTarget(revived, origin);

    renderedAnnotations.updateTarget(revived);
  }

  // Callback method for when a new page gets rendered by PDF.js
  const onLazyRender = (page: number) => {  
    const pages = [page - 2, page - 1, page, page + 1, page + 2].filter(n => n >= 0);
    
    const toRender = pages.reduce<PDFAnnotation[]>((annotations, page) => (
      [...annotations, ...(renderedAnnotations.get(page) || [])]
    ), []).map(({ id }) => innerStore.getAnnotation(id));

    if (toRender.length > 0)
      // Attempt to update the unrendered annotations in the store      
      innerStore.bulkUpsertAnnotations(toRender, Origin.REMOTE);
  }  

  innerStore.observe(event => {
    const { changes } = event;

    // Annotations coming from the innerStore or all TextAnnotations!
    const created: PDFAnnotation[] = (changes.created || []).map(toPDFAnnotation);

    // Update the store silently, i.e. without triggering events
    // @ts-ignore
    created.forEach(a => innerStore.updateAnnotation(a, Origin.SILENT));

    const updated = (changes.updated || []).map(e => {
      if (e.targetUpdated) {
        const newTarget = toPDFAnnotationTarget(e.targetUpdated.newTarget as TextAnnotationTarget);
        const oldValue: PDFAnnotation = e.oldValue as PDFAnnotation;

        const newValue: PDFAnnotation = {
          ...e.newValue,
          target: newTarget
        };

        return {
          ...e,
          oldValue,
          newValue,
          targetUpdated: e.targetUpdated ? ({
            oldTarget: oldValue.target,
            newTarget: newValue.target
          }) : undefined
        } as Update<PDFAnnotation>;
      } else {
        return e as Update<PDFAnnotation>
      }
    });

    // Update silently
    // @ts-ignore
    updated.forEach(u => innerStore.updateAnnotation(u.newValue, Origin.SILENT));

    const deleted: PDFAnnotation[] = (changes.deleted || []).map(toPDFAnnotation);
    deleted.forEach(a => renderedAnnotations.deleteAnnotation(a));

    const crosswalked = {
      ...event,
      changes: {
        created,
        updated,
        deleted
      }
    } as StoreChangeEvent<PDFAnnotation>;
    
    emit(crosswalked);
  }, { origin: Origin.LOCAL });

  innerStore.observe(event => {
    // There is no need to crosswalk REMOTE annotations. We just
    // need to forward them.
    emit(event as StoreChangeEvent<PDFAnnotation>);
  }, { origin: Origin.REMOTE });

  return {
    hover,
    selection,
    // @ts-ignore
    store: { 
      ...innerStore,
      addAnnotation,
      bulkAddAnnotations,
      observe,
      onLazyRender,
      unobserve,
      updateAnnotation,
      updateTarget
    },
    viewport,

  }
  
}
