import type { HoverState, Unsubscribe } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export interface HoverProxy {
  // Data Down (reads)
  getCurrent(): string | null;

  // Actions Up (writes)
  set(id: string | null): void;

  // Observation
  subscribe(callback: () => void): Unsubscribe;
}

export const createHoverProxy = <I extends TextAnnotation = TextAnnotation>(
  hover: HoverState<I>
): HoverProxy => ({
  getCurrent: () => hover.current ?? null,
  set: (id) => hover.set(id),
  subscribe: (callback) => hover.subscribe(callback)
});
