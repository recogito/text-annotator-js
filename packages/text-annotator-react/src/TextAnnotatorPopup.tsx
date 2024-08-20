import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useRef,
  PointerEvent
} from 'react';
import { useAnnotator, useSelection } from '@annotorious/react';
import { type TextAnnotation, type TextAnnotator } from '@recogito/text-annotator';
import {
  autoUpdate,
  inline,
  offset,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  FloatingPortal,
  FloatingFocusManager
} from '@floating-ui/react';

interface TextAnnotationPopupProps {

  popup(props: TextAnnotatorPopupProps): ReactNode;

}

export interface TextAnnotatorPopupProps {

  selected: { annotation: TextAnnotation, editable?: boolean }[];

}

export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);

  const { refs, floatingStyles, update, context } = useFloating({
    placement: 'top',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      setOpen(open);
      if (!open && reason === 'escape-key') {
        r?.cancelSelected();
      }
    },
    middleware: [
      offset(10),
      inline(),
      flip(),
      shift({ mainAxis: false, crossAxis: true, padding: 10 })
    ],
    whileElementsMounted: autoUpdate
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  const selectedKey = selected.map(a => a.annotation.id).join('-');
  useEffect(() => {
    // Ignore all selection changes except those accompanied by a user event.
    if (selected.length > 0 && event) {
      setOpen(event.type === 'pointerup' || event.type === 'keydown');
    }
  }, [selectedKey, event]);

  useEffect(() => {
    // Close the popup if the selection is cleared
    if (selected.length === 0 && isOpen) {
      setOpen(false);
    }
  }, [isOpen, selectedKey]);

  useEffect(() => {
    if (!isOpen || !annotation) return;

    const {
      target: {
        selector: [{ range }]
      }
    } = annotation;

    refs.setPositionReference({
      getBoundingClientRect: range.getBoundingClientRect.bind(range),
      getClientRects: range.getClientRects.bind(range)
    });
  }, [isOpen, annotation, refs]);

  // Prevent text-annotator from handling the irrelevant events triggered from the popup
  const getStopEventsPropagationProps = useCallback(
    () => ({ onPointerUp: (event: PointerEvent<HTMLDivElement>) => event.stopPropagation() }),
    []
  );

  useEffect(() => {
    const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

    const mutationObserver = new MutationObserver(() => update());
    mutationObserver.observe(document.body, config);

    window.document.addEventListener('scroll', update, true);

    return () => {
      mutationObserver.disconnect();
      window.document.removeEventListener('scroll', update, true);
    }
  }, [update]);

  useRestoreSelectionCaret({ floatingOpen: isOpen });

  return isOpen && selected.length > 0 ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={context}
        modal={false}
        closeOnFocusOut={false}
        initialFocus={
          /**
           * Don't shift focus to the floating element
           * when the selection performed with the keyboard
           */
          event?.type === 'keydown' ? -1 : 0
        }
      >
        <div
          className="annotation-popup text-annotation-popup not-annotatable"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          {...getStopEventsPropagationProps()}>
          {props.popup({ selected })}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  ) : null;

}

export const useRestoreSelectionCaret = (args: { floatingOpen: boolean }) => {
  const { floatingOpen } = args;

  const focusNodeRef = useRef<Node | null>(null);
  const focusOffsetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!floatingOpen) return;

    const sel = document.getSelection();
    focusNodeRef.current = sel?.focusNode;
    focusOffsetRef.current = sel?.focusOffset;


    console.log('Save selection', sel.focusOffset, sel.anchorOffset);
  }, [floatingOpen]);

  useEffect(() => {
    if (floatingOpen) return;

    const { current: focusNode } = focusNodeRef;
    const { current: focusOffset } = focusOffsetRef;
    if (!focusNode) return;


    setTimeout(() => {
      /**
       * Restore the caret only after it got lost and automatically moved to the `body`.
       * It happens when user clicks on the close button within the floating element.
       */
      const sel = document.getSelection();
      if (sel && sel.isCollapsed && sel.anchorNode === document.body) {
        sel.removeAllRanges();
        sel.setPosition(
          focusNode,
          focusOffset + 1 // Select after the last letter
        );
      }
    });
  }, [floatingOpen]);
};
