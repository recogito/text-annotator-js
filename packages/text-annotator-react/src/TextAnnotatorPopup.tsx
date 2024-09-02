import { PointerEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useAnnotator, useSelection } from '@annotorious/react';
import { toDomRectList, denormalizeRectWithOffset, type TextAnnotation, type TextAnnotator } from '@recogito/text-annotator';
import {
  autoUpdate,
  inline,
  offset,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react';

interface TextAnnotationPopupProps {

  popup(props: TextAnnotationPopupContentProps): ReactNode;

}

interface TextAnnotationPopupContentProps {

  annotation: TextAnnotation;
  
  editable?: boolean;

  event?: PointerEvent;

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
    // Ignore all selection changes except those accompanied by a pointer event.
    if (event) {
      setOpen(selected.length > 0 && event.type === 'pointerup');
    }
  }, [event?.type, selectedKey]);

  useEffect(() => {
    if (!r) return;

    if (isOpen && annotation?.id) {
      refs.setPositionReference({
        getBoundingClientRect: () => denormalizeRectWithOffset(
          r.state.store.getAnnotationBounds(annotation.id),
          r.element.getBoundingClientRect()
        ),
        getClientRects: () => {
          const rects = r.state.store.getAnnotationRects(annotation.id);
          const denormalizedRects = rects.map(
            rect => denormalizeRectWithOffset(rect, r.element.getBoundingClientRect())
          );
          return toDomRectList(denormalizedRects);
        }
      });
    } else {
      // Don't leave the reference depending on the previously selected annotation
      refs.setPositionReference(null);
    }
  }, [isOpen, annotation?.id, annotation?.target, r]);

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
    </div>
  ) : null;

}
