import RBush from 'rbush';
import type { Store } from '@annotorious/core';
import { createNanoEvents, type Unsubscribe } from 'nanoevents';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { AnnotationRects } from '../state/text-annotation-store';
import { reviveSelector } from '../utils/annotation';
import { debounce } from '../utils/events';
import { mergeClientRects, getHighlightClientRects, toParentBounds } from '../utils/highlight'; 
import type { SelectorCompareFn, SelectorReviveFn } from '../text-annotator-options';

interface IndexedHighlightRect {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

  annotation: {
    
    id: string;

    rects: DOMRect[];

  }

}

export interface SpatialTreeEvents {

  recalculate(): void;

}

export const createSpatialTree = <T extends TextAnnotation>(
  store: Store<T>,
  container: HTMLElement,
  hMergeTolerance?: number,
  vMergeTolerance?: number,
  selectorReviveFn?: SelectorReviveFn,
  selectorCompareFn?: SelectorCompareFn
) => {
  const tree = new RBush<IndexedHighlightRect>();

  const index = new Map<string, IndexedHighlightRect[]>();

  // Targets not yet in the tree because they had no revived range yet
  const pending = new Map<string, TextAnnotationTarget>();

  const emitter = createNanoEvents<SpatialTreeEvents>();

  // Helper: converts a single text annotation target to a list of hightlight rects
  const toItems = (target: TextAnnotationTarget, offset: DOMRect): IndexedHighlightRect[] => {
    const rects = target.selector.flatMap(s => {
      const revivedRange = (selectorReviveFn ? selectorReviveFn(s, container) : reviveSelector(s, container))?.range;
      return revivedRange ? getHighlightClientRects(revivedRange) : [];
    });

    if (rects.length === 0) return [];

    /**
     * Offset the merged client rects so that coords
     * are relative to the parent container
     */
    const merged = mergeClientRects(rects, hMergeTolerance, vMergeTolerance)
      .map(rect => toParentBounds(rect, offset));

    return merged.map(rect => {
      const { x, y, width, height } = rect;

      return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
        annotation: {
          id: target.annotation,
          rects: merged
        }
      }
    });
  }

  const all = () => [...index.values()];

  const clear = () => {
    tree.clear();
    index.clear();
    pending.clear();
  }

  const insert = (target: TextAnnotationTarget) => {
    const rects = toItems(target, container.getBoundingClientRect());
    if (rects.length === 0) {
      pending.set(target.annotation, target);
      return;
    }

    pending.delete(target.annotation);

    rects.forEach(rect => tree.insert(rect));
    index.set(target.annotation, rects);
  }

  const remove = (target: TextAnnotationTarget) => {
    pending.delete(target.annotation);

    const rects = index.get(target.annotation);
    if (rects) {
      rects.forEach(rect => tree.remove(rect));
      index.delete(target.annotation);
    }
  }

  const update = (target: TextAnnotationTarget) => {
    remove(target);
    insert(target);
  }

  const set = debounce((targets: TextAnnotationTarget[], replace: boolean = true, skipSort = false) => {
    console.log('set ', targets.length);
    const startTime = performance.now();

    let sorted = [...targets];

    if (!skipSort) {
      sorted = [...targets];
      if (selectorCompareFn)
        sorted.sort((a, b) => selectorCompareFn(a.selector[0], b.selector[0], container));
    }

    if (replace) clear();

    const offset = container.getBoundingClientRect();

    let enteredViewport = false;
    let rectsByTarget: { target: TextAnnotationTarget, rects: IndexedHighlightRect[] }[] = [];

    for (const t of sorted) {
      const rects = toItems(t, offset);
      if (rects.length > 0) {
        enteredViewport = true;

        pending.delete(t.annotation);
        index.set(t.annotation, rects);

        rectsByTarget.push({ target: t, rects });
      } else {
        if (enteredViewport) {
          // Early return: append remaining as pending
          const from = sorted.indexOf(t);

          for (let i = from; i < sorted.length; i++) {
            const remaining = sorted[i];
            if (!index.has(remaining.annotation)) {
              pending.set(remaining.annotation, remaining);
            }
          }

          break;
        } else {
          // Not yet in viewport - append this annotation as pending
          if (!index.has(t.annotation))
            pending.set(t.annotation, t);
        }
      }
    }

    const allRects = rectsByTarget.flatMap(({ rects }) => rects);
    if (allRects.length > 0)
      tree.load(allRects);

    console.log('took ' + (performance.now() - startTime));
  }, 10);

  const getAt = (x: number, y: number, all = false): string[] => {
    const hits = tree.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    });

    const area = (rect: IndexedHighlightRect) =>
      rect.annotation.rects.reduce((area, r) =>
        area + r.width * r.height, 0);
    
    // Get smallest rect
    if (hits.length > 0) {
      hits.sort((a, b) => area(a) - area(b));
      return all ? hits.map(h => h.annotation.id) : [ hits[0].annotation.id ];
    } else {
      return [];
    }
  }

  const getAnnotationBounds = (id: string): DOMRect | undefined => {
    const rects = getAnnotationRects(id);

    if (rects.length === 0)
      return;

    let left = rects[0].left;
    let top = rects[0].top;
    let right = rects[0].right;
    let bottom = rects[0].bottom;

    for (let i = 1; i < rects.length; i++) {
      const rect = rects[i];

      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }

    return new DOMRect(left, top, right - left, bottom - top);
  }

  const getAnnotationRects = (id: string): DOMRect[] => {
    const indexed = index.get(id);
    if (indexed) {
      // Reminder: *each* IndexedHighlightRect stores *all*
      // DOMRects for the annotation for convenience
      return indexed[0].annotation.rects;
    } else {
      return [];
    }
  }

  const getIntersecting = (
    minX: number, 
    minY: number, 
    maxX: number, 
    maxY: number,
  ): AnnotationRects<T>[] => {
    // All rects in this area, regardless of annotation
    const rects = tree.search({ minX, minY, maxX, maxY });

    // Distinct annotation IDs
    const annotationIds = new Set(rects.map(rect => rect.annotation.id));

    // Resolve annotation IDs. Note that the tree could be slightly out of sync (because 
    // it updates by listening to changes, just like anyone else)
    return Array.from(annotationIds).map(annotationId => ({
      annotation: store.getAnnotation(annotationId)!,
      rects: getAnnotationRects(annotationId)
    })).filter(t => Boolean(t.annotation));
  }

  const size = () => tree.all().length;

  const recalculate = () => {
    set(store.all().map(a => a.target), true);
  }

  let resolveLatest: (() => void) | null = null;

  const debouncedRun = debounce(() => {
    if (pending.size === 0) {
      resolveLatest?.();
      resolveLatest = null;
      return;
    }

    requestAnimationFrame(() => {
      const candidates = [...pending.values()];
      set(candidates, false, true);
      resolveLatest?.();
      resolveLatest = null;
    });
  }, 100)

  const revivePending = (): Promise<void> => new Promise(resolve => {
    resolveLatest = resolve;
    debouncedRun();
  });

  const on = <E extends keyof SpatialTreeEvents>(event: E, callback: SpatialTreeEvents[E]): Unsubscribe => emitter.on(event, callback);

  return {
    all,
    clear,
    getAt,
    getAnnotationBounds,
    getAnnotationRects,
    getIntersecting,
    insert,
    recalculate,
    revivePending,
    remove,
    set,
    size,
    update,
    on
  }

}
