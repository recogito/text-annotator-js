import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, DrawingStyle } from '@annotorious/react';
import { TextAnnotator as RecogitoTextAnnotator } from '@recogito/text-annotator';
import { TextAnnotation, TextAnnotatorOptions, createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps<E extends unknown> = TextAnnotatorOptions<E> & {

  children?: ReactNode | JSX.Element; 

  style?: DrawingStyle | ((annotation: TextAnnotation) => DrawingStyle);

}

export const TextAnnotator = <E extends unknown>(props: TextAnnotatorProps<E>) => {

  const el = useRef<HTMLDivElement>(null);

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);
  
  useEffect(() => {    
    const anno = createTextAnnotator(el.current, opts);
    anno.style = props.style;

    // @ts-ignore
    setAnno(anno);
  }, []);

  useEffect(() => {
    if (!anno)
      return;
    
    (anno as unknown as RecogitoTextAnnotator<TextAnnotation>).style = props.style;
  }, [props.style]);

  return (
    <div ref={el}>
      {children}
    </div>
  )

}