import { ReactNode, useEffect, useState } from 'react';
import { useSelection } from '@annotorious/react';
import type { TextAnnotation, TextSelector } from '@recogito/text-annotator';
import { getClosestRect, toClientRects } from './utils';
import {
  autoUpdate,
  flip,
  inline,
  offset,
  shift,
  useFloating
} from '@floating-ui/react';

export interface TextAnnotatorPopupProps {

  selected: { annotation: TextAnnotation, editable?: boolean }[];

}

interface TextAnnotationPopupProps {

  popup(props: TextAnnotatorPopupProps): ReactNode;

}

export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {

  const { selected, pointerEvent } = useSelection<TextAnnotation>();
  
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | undefined>();

  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [inline(), offset(4), flip({ crossAxis: true }), shift({ crossAxis: true })],
    whileElementsMounted: autoUpdate
  });

  useEffect(() => {
    // Ignore all selection changes except those
    // accompanied by a pointer event.
    if (pointerEvent) {
      if (selected.length > 0 && pointerEvent.type === 'pointerup') {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, [pointerEvent, selected.map(a => a.annotation.id).join('-')]);

  useEffect(() => {
    if (selected?.length > 0) {
      const selector = selected[0].annotation.target.selector as (TextSelector | TextSelector[]);
      const range = Array.isArray(selector) ? selector[0].range : selector.range; 

      if (range && !range.collapsed) {
        refs.setReference({
          getBoundingClientRect: () => {
            return range.getBoundingClientRect();
          },
          getClientRects: () => { 
            const rect = mousePos 
              ? getClosestRect(range.getClientRects(), mousePos)
              : range.getClientRects()[0];

            return toClientRects(rect);
          }
        });
      }
    }
  }, [open, selected, mousePos]);

  useEffect(() => {
    const onPointerUp = (event: PointerEvent) => {
      const { clientX, clientY } = event;
      setMousePos({ x: clientX, y: clientY });
    }

    window.document.addEventListener('pointerup', onPointerUp);

    return () => {
      window.document.removeEventListener('pointerup', onPointerUp);
    }
  }, []);

  return (isOpen && selected.length > 0) && (
    <div
      className="annotation-popup text-annotation-popup not-annotatable"
      ref={refs.setFloating}
      style={floatingStyles}>
      {props.popup({ selected })}
    </div>
  )

}