import { createNanoEvents, type Unsubscribe } from 'nanoevents';
import type { Origin } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationTarget } from '../model';
import type { TextAnnotationStore } from './TextAnnotationStore';

export interface StoreProxyEvents<I extends TextAnnotation = TextAnnotation> {
  addAnnotation(annotation: I, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  updateTarget(target: TextAnnotationTarget, origin?: typeof Origin.LOCAL | typeof Origin.REMOTE): void;
  deleteAnnotation(id: string): void;
}

export interface StoreProxy<I extends TextAnnotation = TextAnnotation> {
  emit: <E extends keyof StoreProxyEvents<I>>(event: E, ...args: Parameters<StoreProxyEvents<I>[E]>) => void;
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
    emit: <E extends keyof StoreProxyEvents<I>>(event: E, ...args: Parameters<StoreProxyEvents<I>[E]>) => {
      (emitter.emit as any)(event, ...args);
    },
    on: <E extends keyof StoreProxyEvents<I>>(event: E, callback: StoreProxyEvents<I>[E]): Unsubscribe => {
      return emitter.on(event, callback);
    }
  };
};
