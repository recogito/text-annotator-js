import { ReactNode, useContext, useEffect } from 'react';
import { TextAnnotatorOptions, RecogitoJS } from '@recogito/text-annotator';
import { AnnotoriousContext } from '@annotorious/react';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps = TextAnnotatorOptions & {

  element: string,

  children?: ReactNode;

}

export const TextAnnotator = (props: TextAnnotatorProps) => {

  const { element, ...opts } = props;

  const { setAnno } = useContext(AnnotoriousContext);
  
  useEffect(() => {
    const el = element ? document.getElementById(element) : null;
    const r = RecogitoJS(el, opts);
    setAnno(r);
  }, []);

  return props.children ? <>{props.children}</> : null;

}