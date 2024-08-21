import { useEffect, useRef } from 'react';

import { useSelection } from '@annotorious/react';
import type { TextAnnotation } from '@recogito/text-annotator';

/**
 * Restores the caret position after the floating element gets closed
 * and the selection is lost and moved to the `body`.
 * The caret is placed at the start of the previous selection range.
 *
 * However, when the floating element is dismissed with intentional
 * caret repositioning via the mouse click or arrow key navigation ->
 * we shouldn't restore its position to the previous selection.
 */
export const useRestoreSelectionCaret = (args: { floatingOpen: boolean }) => {
  const { floatingOpen } = args;

  const { selected } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const selectionRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!floatingOpen || !annotation) return;

    const sel = document.getSelection();
    if (sel) {
      selectionRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, [floatingOpen, annotation]);

  useEffect(() => {
    if (floatingOpen) return;

    const { current: selectionRange } = selectionRangeRef;
    if (!selectionRange) return;

    const { startContainer, startOffset } = selectionRange;

    setTimeout(() => {
      const sel = document.getSelection();
      if (sel && sel.isCollapsed && sel.anchorNode === document.body) {
        sel.removeAllRanges();
        sel.setPosition(startContainer, startOffset);

        const startContainerElement = startContainer instanceof HTMLElement
          ? startContainer
          : startContainer.parentElement;
        startContainerElement.focus({ preventScroll: true });
      }
    });
  }, [floatingOpen]);
};
