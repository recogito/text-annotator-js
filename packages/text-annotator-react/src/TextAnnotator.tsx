import { ReactNode, useContext, useEffect, useRef } from 'react';
import { TextAnnotatorOptions, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';
import { AnnotoriousContext } from '@annotorious/react';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode;

}

export const TextAnnotator = (props: TextAnnotatorProps) => {

  const el = useRef<HTMLDivElement>(null);

  const { children, ...opts } = props;

  const { setAnno } = useContext(AnnotoriousContext);
  
  useEffect(() => {    
    const anno = VanillaTextAnnotator(el.current, opts);
    // @ts-ignore
    setAnno(anno);
  }, []);

  return (
    <div ref={el}>{children}</div>
  )

}