import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Formatter } from '@annotorious/react';
import { TextAnnotator as RecogitoTextAnnotator } from '@recogito/text-annotator';
import { TextAnnotation, TextAnnotatorOptions, createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode;

  formatter?: Formatter;

}

export const TextAnnotator = (props: TextAnnotatorProps) => {

  const el = useRef<HTMLDivElement>(null);

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);
  
  useEffect(() => {    
    const anno = createTextAnnotator(el.current, opts);
    anno.setFormatter(props.formatter);

    // @ts-ignore
    setAnno(anno);
  }, []);

  useEffect(() => {
    if (!anno)
      return;
    
    (anno as unknown as RecogitoTextAnnotator<TextAnnotation>).setFormatter(props.formatter);
  }, [props.formatter]);

  return (
    <div ref={el}>
      {children}
    </div>
  )

}