import { ReactNode, useCallback, useEffect, useState, PointerEvent } from 'react';
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
  useRole, FloatingPortal, FloatingFocusManager
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

  return isOpen && selected.length > 0 ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={context}
        visuallyHiddenDismiss="Dismiss the annotation dialog"
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
