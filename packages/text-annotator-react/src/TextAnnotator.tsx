import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Filter } from '@annotorious/react';
import { createTextAnnotator, type HighlightPainterStyle } from '@recogito/text-annotator';
import type { TextAnnotatorOptions } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps<E extends unknown> = TextAnnotatorOptions<E> & {

  children?: ReactNode | JSX.Element; 

  filter?: Filter;

  style?: HighlightPainterStyle

}

export const TextAnnotator = <E extends unknown>(props: TextAnnotatorProps<E>) => {

  const el = useRef<HTMLDivElement>(null);

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);
  
  useEffect(() => {  
    if (setAnno) {
      const anno = createTextAnnotator(el.current, opts);
      anno.setStyle(props.style);
      setAnno(anno);
    }
  }, [setAnno]);

  useEffect(() => {
    if (!anno)
      return;
    
    anno.setStyle(props.style);
  }, [props.style]);

  useEffect(() => {
    if (!anno)
      return;
    
    anno.setFilter(props.filter);
  }, [props.filter]);

  return (
    <div ref={el}>
      {children}
    </div>
  )

}
