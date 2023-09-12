import { Children, ReactElement, ReactNode, cloneElement, useContext, useEffect } from 'react';
import { TextAnnotatorOptions, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';
import { RecogitoTEIAnnotator } from '@recogito/text-annotator-tei';
import { TEIPlugin } from '@recogito/text-annotator-tei';
import { AnnotoriousContext, Formatter } from '@annotorious/react';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TEIAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode;

  formatter?: Formatter;

}

export const TEIAnnotator = (props: TEIAnnotatorProps) => {

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = (element: HTMLElement) => {
    const anno = TEIPlugin(VanillaTextAnnotator(element));
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