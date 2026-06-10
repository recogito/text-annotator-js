import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import { createTextAnnotatorState, Origin } from '@recogito/text-annotator';
import type { 
  HoverState, 
  RevivedTextAnnotationLike, 
  RevivedTextAnnotationTargetLike, 
  RevivedTextSelector, 
  SelectionState, 
  TextAnnotation, 
  TextAnnotationStore, 
  TextAnnotationTarget, 
  TextAnnotatorOptions,
  TextAnnotatorState
} from '@recogito/text-annotator';
import { 
  shouldNotify,
  type StoreChangeEvent, 
  type StoreObserveOptions, 
  type StoreObserver, 
  type ViewportState, 
  type Update,
} from '@annotorious/core';
import type { PDFAnnotation, PDFAnnotationTarget } from '../model/core/pdf-annotation';
import { resolveAnnotation, resolveTarget } from '../utils/annotation';
import { getQuadPoints } from '../utils/pdf';
import { createRenderedAnnotationsMap } from './rendered-annotations';
import { splitSelector } from '../utils/dom/split-selector';

export interface PDFAnnotationStore extends TextAnnotationStore<PDFAnnotation> {

  onLazyRender(page: number): void;   

}

export interface PDFAnnotatorState extends TextAnnotatorState<PDFAnnotation, PDFAnnotation> {

  store: PDFAnnotationStore;

  selection: SelectionState<PDFAnnotation, PDFAnnotation>;

  hover: HoverState<PDFAnnotation>;

  viewport: ViewportState;

}

export const createPDFAnnotatorState = (
  viewer: pdfjsViewer.PDFViewer,
  viewerElement: HTMLDivElement, 
  opts: TextAnnotatorOptions<PDFAnnotation, PDFAnnotation>
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

  const toPDFAnnotationTarget = (target: RevivedTextAnnotationTargetLike<TextAnnotationTarget>) => {    
    // Split the text annotation target across pages, if necessary.
    const split = target.selector.reduce<RevivedTextSelector[]>((all, selector) => (
      [...all, ...splitSelector(selector as RevivedTextSelector)]
    ), []);

    // All rects, for all selectors
    const rects = innerStore.getAnnotationRects(target.annotation);

    // Container element bounds
    const offset = viewerElement.getBoundingClientRect().top;

    const getRectsForSelector = (selector: RevivedTextSelector) => {
      const bounds = selector.range.getBoundingClientRect();

      // Checking for vertical intersection is enough, because we know
      // we're splitting by pages
      return rects.filter(r => (
        r.top + offset <= bounds.bottom && r.bottom + offset >= bounds.top
      ));
    }

    const toPDFSelector = (s: RevivedTextSelector) => {
      const pageNumber = parseInt(s.offsetReference?.dataset.pageNumber!);
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

  const toPDFAnnotation = (t: RevivedTextAnnotationLike<TextAnnotation>) => ({
    ...t,
    target: toPDFAnnotationTarget(t.target)
  });

  /**********************/
  /* Wrapped store API **/
  /**********************/

  const addAnnotation = (annotation: PDFAnnotation, origin = Origin.LOCAL) => {
    const resolved = resolveAnnotation(annotation);
    const success = innerStore.addAnnotation(resolved, origin);
    renderedAnnotations.upsert(resolved);
    return success;
  }

  const bulkAddAnnotations = (
    annotations: PDFAnnotation[], 
    replace: boolean,
    origin = Origin.LOCAL
  ) => {
    const resolved = annotations.map(resolveAnnotation);
    resolved.forEach(a => renderedAnnotations.upsert(a));
    return innerStore.bulkAddAnnotations(resolved, replace, origin) as PDFAnnotation[];
  }

  const updateAnnotation = (arg1: string | PDFAnnotation, arg2?: PDFAnnotation | Origin, arg3?: Origin) => {
    const annotation = typeof arg1 === 'string' ? arg2 as PDFAnnotation : arg1; 
    const origin = typeof arg1 === 'string' ? arg3 : arg2 as Origin;
    const resolved = resolveAnnotation(annotation);
    innerStore.updateAnnotation(resolved, origin);
    renderedAnnotations.upsert(resolved);
  }

  const updateTarget = (target: PDFAnnotationTarget, origin = Origin.LOCAL) => {
    const resolved = resolveTarget(target);
    innerStore.updateTarget(resolved, origin);
    renderedAnnotations.updateTarget(resolved);
  }

  // Callback method for when a new page gets rendered by PDF.js
  const onLazyRender = (page: number) => {  
    const pages = [page - 2, page - 1, page, page + 1, page + 2].filter(n => n >= 0);
    
    const toRender = pages.reduce<PDFAnnotation[]>((annotations, page) => (
      [...annotations, ...(renderedAnnotations.get(page) || [])]
    ), [])
    .map(({ id }) => innerStore.getAnnotation(id)!)
    .filter(Boolean);

    if (toRender.length > 0)
      // Attempt to update the unrendered annotations in the store      
      innerStore.bulkUpsertAnnotations(toRender, Origin.REMOTE);
  }  

  innerStore.observe(event => {
    const { changes } = event;

    // Annotations coming from the innerStore or all TextAnnotations!
    const created: PDFAnnotation[] = (changes.created || []).map(a => 
      toPDFAnnotation(a as unknown as RevivedTextAnnotationLike<TextAnnotation>));

    // Update the store silently, i.e. without triggering events
    created.forEach(a => innerStore.updateAnnotation(a, Origin.SILENT));

    const updated = (changes.updated || []).map(e => {
      if (e.targetUpdated) {
        const newTarget = toPDFAnnotationTarget(e.targetUpdated.newTarget as unknown as RevivedTextAnnotationTargetLike<TextAnnotationTarget>);
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
    updated.forEach(u => innerStore.updateAnnotation(u.newValue, Origin.SILENT));

    const deleted: PDFAnnotation[] = (changes.deleted || []).map(a => 
      toPDFAnnotation(a as unknown as RevivedTextAnnotationLike<TextAnnotation>));

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
    viewport
  }
  
}
