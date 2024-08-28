import { useCallback, useEffect, useRef } from 'react';

import { useAnnotator, useSelection } from '@annotorious/react';
import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';

/**
 * Restores the selection range after the floating element
 * is dismissed and the selection is lost.
 *
 * However, when the floating element is dismissed with intentional
 * caret repositioning via the mouse click or arrow key navigation ->
 * we shouldn't restore its position to the previous selection.
 */
export const useRestoreSelectionRange = () => {
  const r = useAnnotator<TextAnnotator>();

  const { selected } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const selectionRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!annotation?.target) return;

    const sel = document.getSelection();
    selectionRangeRef.current = sel?.getRangeAt(0).cloneRange() || null;
  }, [annotation?.target]);

  return useCallback(() => {
    const { current: selectionRange } = selectionRangeRef;
    if (!selectionRange) return;

    setTimeout(() => {
      const sel = document.getSelection();
      if (sel) {
        // Temporary disable the annotating mode to prevent creation of new annotations
        r?.setAnnotatingEnabled(false);

        sel.removeAllRanges();
        sel.addRange(selectionRange);

        const { startContainer } = selectionRange;
        const startContainerElement = startContainer instanceof HTMLElement
          ? startContainer
          : startContainer.parentElement;
        startContainerElement.focus({ preventScroll: true });

        r?.setAnnotatingEnabled(true);
      }
    });
  }, [r]);
};
