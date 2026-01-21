import { createEmitter, type Filter, Origin, type Unsubscribe } from '../types';
import type { TextAnnotation, TextAnnotationTarget, AnnotationRects } from '../model';

export interface StoreProxyEvents<I extends TextAnnotation = TextAnnotation> {
  addAnnotation(annotation: I, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  updateTarget(target: TextAnnotationTarget, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  deleteAnnotation(id: string): void;
}

export interface StoreProxy<I extends TextAnnotation = TextAnnotation> {
  // Data Down (reads)
  getAnnotation(id: string): I | undefined;
  getAt(x: number, y: number, all?: boolean, filter?: Filter): I | I[] | undefined;
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects<I>[];
  recalculatePositions(): void;

  // Actions Up (writes)
  addAnnotation(annotation: I, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  updateTarget(target: TextAnnotationTarget, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  deleteAnnotation(id: string): void;

  // Observation
  observeStore(callback: () => void): Unsubscribe;

  // Subscribe to action intents
  on: <E extends keyof StoreProxyEvents<I>>(event: E, callback: StoreProxyEvents<I>[E]) => Unsubscribe;
}

/**
 * Store interface that StoreProxy wraps.
 * This is the minimal interface that a store implementation must provide.
 */
export interface Store<I extends TextAnnotation = TextAnnotation> {
  getAnnotation(id: string): I | undefined;
  getAt(x: number, y: number, all?: boolean, filter?: Filter): I | I[] | undefined;
  getIntersecting(minX: number, minY: number, maxX: number, maxY: number): AnnotationRects<I>[];
  recalculatePositions(): void;
  addAnnotation(annotation: I, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  updateTarget(target: TextAnnotationTarget, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  deleteAnnotation(id: string): void;
  observe(callback: () => void): void;
  unobserve(callback: () => void): void;
}

export const createStoreProxy = <I extends TextAnnotation = TextAnnotation>(
  store: Store<I>
): StoreProxy<I> => {
  const emitter = createEmitter<StoreProxyEvents<I>>();

  // Subscribe to events and forward to store
  emitter.on('addAnnotation', (annotation, origin) => {
    store.addAnnotation(annotation, origin);
  });

  emitter.on('updateTarget', (target, origin) => {
    store.updateTarget(target, origin);
  });

  emitter.on('deleteAnnotation', (id) => {
    store.deleteAnnotation(id);
  });

  return {
    // Data Down (reads) - delegate to store
    getAnnotation: (id: string) => store.getAnnotation(id),
    getAt: (x: number, y: number, all?: boolean, filter?: Filter) => store.getAt(x, y, all, filter),
    getIntersecting: (minX: number, minY: number, maxX: number, maxY: number) =>
      store.getIntersecting(minX, minY, maxX, maxY),
    recalculatePositions: () => store.recalculatePositions(),

    // Actions Up (writes) - emit intents
    addAnnotation: (annotation: I, origin?) => {
      emitter.emit('addAnnotation', annotation, origin);
    },
    updateTarget: (target: TextAnnotationTarget, origin?) => {
      emitter.emit('updateTarget', target, origin);
    },
    deleteAnnotation: (id: string) => {
      emitter.emit('deleteAnnotation', id);
    },

    // Observation
    observeStore: (callback: () => void): Unsubscribe => {
      store.observe(callback);
      return () => store.unobserve(callback);
    },

    // Subscribe to action intents
    on: <E extends keyof StoreProxyEvents<I>>(event: E, callback: StoreProxyEvents<I>[E]): Unsubscribe => {
      return emitter.on(event, callback);
    }
  };
};
