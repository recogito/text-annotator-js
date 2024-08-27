import { PointerEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useAnnotator, useSelection } from '@annotorious/react';
import { toDomRectList, denormalizeRectWithOffset, type TextAnnotation, type TextAnnotator } from '@recogito/text-annotator';
import {
  autoUpdate,
  inline,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react';

interface TextAnnotationPopupProps {

  popup(props: TextAnnotatorPopupProps): ReactNode;

}

export interface TextAnnotatorPopupProps {

  selected: { annotation: TextAnnotation, editable?: boolean }[];

}

export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {
  const r = useAnnotator<TextAnnotator>();

  const { selected, pointerEvent } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);

  const { refs, floatingStyles, context } = useFloating({
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
    if (pointerEvent) {
      setOpen(selected.length > 0 && pointerEvent.type === 'pointerup');
    }
  }, [pointerEvent?.type, selectedKey]);

  useEffect(() => {
    if (!annotation?.id || !r) return;

    if (isOpen) {
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
      refs.setPositionReference(null);
    }
  }, [isOpen, annotation?.id, annotation?.target, r]);

  // Prevent text-annotator from handling the irrelevant events triggered from the popup
  const getStopEventsPropagationProps = useCallback(
    () => ({ onPointerUp: (event: PointerEvent<HTMLDivElement>) => event.stopPropagation() }),
    []
  );

  return isOpen && selected.length > 0 ? (
    <div
      className="annotation-popup text-annotation-popup not-annotatable"
      ref={refs.setFloating}
      style={floatingStyles}
      {...getFloatingProps()}
      {...getStopEventsPropagationProps()}>
      {props.popup({ selected })}
    </div>
  ) : null;

}
