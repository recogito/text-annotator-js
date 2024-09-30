import React, { PointerEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  inline,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react';

import { useAnnotator, useSelection } from '@annotorious/react';
import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';

import './TextAnnotatorPopup.css';

interface TextAnnotationPopupProps {

  popup(props: TextAnnotationPopupContentProps): ReactNode;

}

export interface TextAnnotationPopupContentProps {

  annotation: TextAnnotation;

  editable?: boolean;

  event?: PointerEvent;

}

export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);

  const handleClose = () => {
    r?.cancelSelected();
  };

  const { refs, floatingStyles, update, context } = useFloating({
    placement: 'top',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      setOpen(open);

      if (!open) {
        if (reason === 'escape-key' || reason === 'focus-out') {
          r?.cancelSelected();
        }
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
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  const selectedKey = selected.map(a => a.annotation.id).join('-');

  useEffect(() => {
    // Ignore all selection changes except those accompanied by a user event.
    if (selected.length > 0) { // && event) {
      setOpen(true); // event.type === 'pointerup' || event.type === 'keydown');
    }
  }, [selectedKey /*, event */]);

  useEffect(() => {
    // Close the popup if the selection is cleared
    if (selected.length === 0 && isOpen) {
      setOpen(false);
    }
  }, [isOpen, selectedKey]);

  useEffect(() => {
    if (isOpen && annotation) {
      const {
        target: {
          selector: [{ range }]
        }
      } = annotation;

      refs.setPositionReference({
        getBoundingClientRect: range.getBoundingClientRect.bind(range),
        getClientRects: range.getClientRects.bind(range)
      });
    } else {
      // Don't leave the reference depending on the previously selected annotation
      refs.setPositionReference(null);
    }
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
    };
  }, [update]);

  return isOpen && selected.length > 0 ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={context}
        modal={false}
        closeOnFocusOut={true}
        initialFocus={
          /**
           * Don't shift focus to the floating element
           * when the selection performed with the keyboard
           */
          event?.type === 'keydown' ? -1 : 0
        }
        returnFocus={false}
      >
        <div
          className="annotation-popup text-annotation-popup not-annotatable"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          {...getStopEventsPropagationProps()}>
          {props.popup({
            annotation: selected[0].annotation,
            editable: selected[0].editable,
            event
          })}

          {/* It lets keyboard/sr users to know that the dialog closes when they focus out of it */}
          <button className="popup-close-message" onClick={handleClose}>
            This dialog closes when you leave it.
          </button>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  ) : null;

};
