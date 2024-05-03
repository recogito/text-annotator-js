import { ReactNode, useEffect, useState } from 'react';
import { useSelection } from '@annotorious/react';
import type { TextAnnotation, TextSelector } from '@recogito/text-annotator';
import { getClosestRect, toClientRects } from './utils';
import {
  autoPlacement,
  autoUpdate,
  inline,
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

  const { selected, pointerEvent } = useSelection<TextAnnotation>();
  
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | undefined>();

  const [isOpen, setIsOpen] = useState(selected?.length > 0);

  const { refs, floatingStyles, update } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      autoPlacement({ crossAxis: true, padding: 5 }), 
      inline(), 
      offset(5), 
      shift({ crossAxis: true, padding: 5 })
    ],
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

    const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

    const mutationObserver = new MutationObserver(() =>
      update());

    mutationObserver.observe(document.body, config);

    window.document.addEventListener('scroll', update, true);
    window.document.addEventListener('pointerup', onPointerUp);

    return () => {
      mutationObserver.disconnect();
      window.document.removeEventListener('scroll', update, true);
      window.document.removeEventListener('pointerup', onPointerUp);
    }
  }, [update]);

  return (isOpen && selected.length > 0) && (
    <div
      className="annotation-popup text-annotation-popup not-annotatable"
      ref={refs.setFloating}
      style={floatingStyles}>
      {props.popup({ selected })}
    </div>
  )

}