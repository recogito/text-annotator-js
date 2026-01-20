import type { Selection, SelectionState, UserSelectAction, Unsubscribe } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export interface SelectionProxy {
  // Data Down (reads) - pull-based
  getSelected(): { id: string; editable?: boolean }[];
  evalSelectAction(annotation: TextAnnotation): UserSelectAction;

  // Actions Up (writes)
  clear(): void;
  userSelect(idOrIds: string | string[], event?: Selection['event']): void;

  // Observation
  subscribe(callback: () => void): Unsubscribe;
}

export const createSelectionProxy = <I extends TextAnnotation, E extends unknown>(
  selection: SelectionState<I, E>
): SelectionProxy => ({
  getSelected: () => selection.selected,
  evalSelectAction: (annotation: TextAnnotation) => selection.evalSelectAction(annotation as I),
  clear: () => selection.clear(),
  userSelect: (idOrIds, event) => selection.userSelect(idOrIds, event),
  subscribe: (callback) => selection.subscribe(callback)
});
