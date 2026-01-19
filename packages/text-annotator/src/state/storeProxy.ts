import { createNanoEvents, type Unsubscribe } from 'nanoevents';
import type { Filter, Origin } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { TextAnnotationStore } from './TextAnnotationStore';

export interface StoreProxyEvents<I extends TextAnnotation = TextAnnotation> {
  addAnnotation(annotation: I, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  updateTarget(target: TextAnnotationTarget, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  deleteAnnotation(id: string): void;
}

export interface StoreProxy<I extends TextAnnotation = TextAnnotation> {
  // Data Down (reads)
  getAnnotation(id: string): I | undefined;
  getAt(x: number, y: number, all?: boolean, filter?: Filter): I | I[] | undefined;

  // Actions Up (writes)
  addAnnotation(annotation: I, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  updateTarget(target: TextAnnotationTarget, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  deleteAnnotation(id: string): void;

  // Subscribe to action intents
  on: <E extends keyof StoreProxyEvents<I>>(event: E, callback: StoreProxyEvents<I>[E]) => Unsubscribe;
}

export const createStoreProxy = <I extends TextAnnotation = TextAnnotation>(
  store: TextAnnotationStore<I>
): StoreProxy<I> => {
  const emitter = createNanoEvents<StoreProxyEvents<I>>();

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

    // Subscribe to action intents
    on: <E extends keyof StoreProxyEvents<I>>(event: E, callback: StoreProxyEvents<I>[E]): Unsubscribe => {
      return emitter.on(event, callback);
    }
  };
};
