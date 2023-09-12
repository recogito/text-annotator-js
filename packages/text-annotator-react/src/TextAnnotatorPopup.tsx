import { createPortal } from 'react-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { RecogitoTextAnnotator, TextAnnotation } from '@recogito/text-annotator';
import { useAnnotator, useSelection } from '@annotorious/react';

const getOffset = (event: PointerEvent, parent: Element) => {
  const { left, top } = parent.getBoundingClientRect();
  const offsetX = event.clientX - left;
  const offsetY = event.clientY - top;
  return { offsetX, offsetY };
}

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
    if (selected.length === 0 && open) {
      // Close on deselect
      setOpen(false);
    } else if (selected.length > 0) {
      // Ignore all selection changes except those
      // accompanied by a pointerup event.
      if (pointerEvent?.type !== 'pointerup')
        return;

      setOpen(true);
    }
  }, [pointerEvent, selected]);

  useEffect(() => {
    if (!(pointerEvent && open && r))
      return;

    const { offsetX, offsetY } = getOffset(pointerEvent, r.element);

    el.current.style.left = `${offsetX}px`;
    el.current.style.top = `${offsetY}px`;
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