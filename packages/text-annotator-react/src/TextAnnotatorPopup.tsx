import { ReactNode, useEffect, useState } from 'react';
import { useAnnotator, useSelection } from '@annotorious/react';
import { type TextAnnotation, type TextAnnotator, type TextSelector } from '@recogito/text-annotator';
import { getClosestRect, toClientRects } from './utils';
import {
  autoPlacement,
  autoUpdate,
  inline, limitShift,
  offset,
  shift,
  useFloating
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

  const { refs, floatingStyles, update } = useFloating({
    placement: 'top',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      setOpen(open);
      if (!open && reason === 'escape-key') {
        r?.cancelSelected();
      }
    },
    middleware: [offset(10), inline(), shift({ padding: 10, limiter: limitShift() })],
    whileElementsMounted: autoUpdate
  });

  const selectedKey = selected.map(a => a.annotation.id).join('-');
  useEffect(() => {
    // Ignore all selection changes except those accompanied by a pointer event.
    if (pointerEvent) {
      setOpen(selected.length > 0 && pointerEvent.type === 'pointerup');
    }
  }, [pointerEvent?.type, selectedKey]);

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

  return isOpen && selected.length > 0 ? (
    <div
      className="annotation-popup text-annotation-popup not-annotatable"
      ref={refs.setFloating}
      style={floatingStyles}>
      {props.popup({ selected })}
    </div>
  ) : null;

}
