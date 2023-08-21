import { ReactNode, useContext, useEffect } from 'react';
import { TextAnnotatorOptions, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';
import { TEIPlugin } from '@recogito/text-annotator-tei';
import { AnnotoriousContext } from '@annotorious/react';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps = TextAnnotatorOptions & {

  element: string,

  children?: ReactNode;

}

export const TextAnnotator = (props: TextAnnotatorProps) => {

  const { element, children, ...opts } = props;

  const { setAnno } = useContext(AnnotoriousContext);
  
  useEffect(() => {
    const el = element ? document.getElementById(element) : null;
    
    const anno = TEIPlugin(VanillaTextAnnotator(el, opts));
    setAnno(anno);
  }, []);

  return children ? <>{children}</> : null;

}