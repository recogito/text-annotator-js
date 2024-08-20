import { useEffect, useRef } from 'react';

import { useSelection } from '@annotorious/react';
import type { TextAnnotation } from '@recogito/text-annotator';

export const useRestoreSelectionCaret = (args: { floatingOpen: boolean }) => {
  const { floatingOpen } = args;

  const { selected } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const focusNodeRef = useRef<Selection['focusNode'] | null>(null);
  const focusOffsetRef = useRef<Selection['focusOffset'] | null>(null);

  useEffect(() => {
    if (!floatingOpen || !annotation) return;

    const sel = document.getSelection();
    if (sel) {
      focusNodeRef.current = sel.focusNode;
      focusOffsetRef.current = sel.focusOffset;
    }
  }, [floatingOpen, annotation]);

  useEffect(() => {
    if (floatingOpen) return;

    const focusNode = focusNodeRef.current;
    const focusOffset = focusOffsetRef.current;
    if (focusNode === null || focusOffset === null) return;

    setTimeout(() => {
      /**
       * Restore the caret only after it got lost and automatically moved to the `body`.
       * It happens when user clicks on the close button within the floating element.
       */
      const sel = document.getSelection();
      if (sel && sel.isCollapsed && sel.anchorNode === document.body) {
        sel.removeAllRanges();
        sel.setPosition(focusNode, focusOffset);
      }
    });
  }, [floatingOpen]);
};
