import type { Selection, UserSelectAction, Unsubscribe } from '../types';
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

/**
 * SelectionState interface that SelectionProxy wraps.
 * This is the minimal interface that a selection state implementation must provide.
 */
export interface SelectionState<I extends TextAnnotation = TextAnnotation> {
  selected: { id: string; editable?: boolean }[];
  evalSelectAction(annotation: I): UserSelectAction;
  clear(): void;
  userSelect(idOrIds: string | string[], event?: Selection['event']): void;
  subscribe(callback: () => void): Unsubscribe;
}

export const createSelectionProxy = <I extends TextAnnotation>(
  selection: SelectionState<I>
): SelectionProxy => ({
  getSelected: () => selection.selected,
  evalSelectAction: (annotation: TextAnnotation) => selection.evalSelectAction(annotation as I),
  clear: () => selection.clear(),
  userSelect: (idOrIds, event) => selection.userSelect(idOrIds, event),
  subscribe: (callback) => selection.subscribe(callback)
});
