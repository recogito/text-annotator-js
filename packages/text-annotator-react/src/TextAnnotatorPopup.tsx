import { createPortal } from 'react-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { RecogitoTextAnnotator, TextAnnotation, TextAnnotatorState } from '@recogito/text-annotator';
import { useAnnotator, useSelection } from '@annotorious/react';

export interface TextAnnotatorPopupProps {

  selected: { annotation: TextAnnotation, editable?: boolean }[];

}

export interface TextAnnotatorPopupContainerProps {

  popup(props: TextAnnotatorPopupProps): ReactNode;

}

export const TextAnnotatorPopup = (props: TextAnnotatorPopupContainerProps) => {

  const el = useRef<HTMLDivElement>(null);

  const r = useAnnotator<RecogitoTextAnnotator>();

  const [open, setOpen] = useState(false);

  const { selected, pointerEvent } = useSelection<TextAnnotation>();

  useEffect(() => {
    // Ignore all selection changes except those
    // accompanied by a pointer event.
    if (pointerEvent) {
      if (selected.length > 0 && pointerEvent?.type === 'pointerup') {
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
  }, [pointerEvent, selected.map(a => a.annotation.id).join('-')]);

  useEffect(() => {
    if (!(pointerEvent && open && r))
      return;

    const { left, top } = r.element.getBoundingClientRect();
    let x = pointerEvent.clientX - left;
    let y = pointerEvent.clientY - top;

    const { id } = selected[0].annotation;
    const { offsetX, offsetY } = pointerEvent;
    const bounds = (r.state as TextAnnotatorState).store.getAnnotationBounds(id, offsetX, offsetY);
    
    if (bounds.length > 0) {
      const b = bounds[0];

      x = Math.max(x, b.x - left);
      x = Math.min(x, b.right - left);

      y = Math.max(y, b.y - top);
      y = Math.min(y, b.bottom - top);
    }

    el.current.style.left = `${x}px`;
    el.current.style.top = `${y}px`;
  }, [open, pointerEvent, r?.element]);

  const onPointerUp = (evt: React.PointerEvent<HTMLDivElement>) =>
    evt.stopPropagation();
  
  return (open && selected.length > 0) && createPortal(
    <div 
      ref={el}
      className="a9s-popup r6o-popup not-annotatable"
      style={{ position: 'absolute' }}
      onPointerUp={onPointerUp}>

      {props.popup({ selected })}
      
    </div>, r.element
  );

}