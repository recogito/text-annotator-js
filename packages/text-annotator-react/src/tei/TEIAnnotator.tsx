import { Children, ReactElement, ReactNode, cloneElement, useContext, useEffect } from 'react';
import { AnnotoriousContext, Formatter } from '@annotorious/react';
import { TextAnnotatorOptions, createTextAnnotator } from '@recogito/text-annotator';
import { RecogitoTEIAnnotator, TEIPlugin } from '@recogito/text-annotator-tei';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TEIAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode;

  formatter?: Formatter;

}

export const TEIAnnotator = (props: TEIAnnotatorProps) => {

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = (element: HTMLElement) => {
    const anno = TEIPlugin(createTextAnnotator(element));
    anno.setFormatter(props.formatter);

    // @ts-ignore
    setAnno(anno);
  }

  useEffect(() => {
    if (!anno)
      return;
    
    (anno as unknown as RecogitoTEIAnnotator).setFormatter(props.formatter);
  }, [props.formatter]);

  return props.children ? 
    Children.toArray(props.children).map(child => 
      cloneElement(child as ReactElement, { onLoad })) : null;

}