import type { Selection, SelectionState } from '@annotorious/core';
import type { TextAnnotation } from '../model';

export interface SelectionProxy {
  // Data Down (reads) - pull-based
  getSelected(): { id: string; editable?: boolean }[];

  // Actions Up (writes)
  clear(): void;
  userSelect(idOrIds: string | string[], event?: Selection['event']): void;
}

export const createSelectionProxy = <I extends TextAnnotation, E extends unknown>(
  selection: SelectionState<I, E>
): SelectionProxy => ({
  getSelected: () => selection.selected,
  clear: () => selection.clear(),
  userSelect: (idOrIds, event) => selection.userSelect(idOrIds, event)
});
