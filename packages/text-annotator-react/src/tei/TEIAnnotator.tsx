import { Children, ReactElement, ReactNode, cloneElement, useContext, useEffect } from 'react';
import { AnnotoriousContext, DrawingStyle } from '@annotorious/react';
import { TextAnnotatorOptions, createTextAnnotator, TextAnnotation } from '@recogito/text-annotator';
import { RecogitoTEIAnnotator, TEIPlugin } from '@recogito/text-annotator-tei';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TEIAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode | JSX.Element;

  style?: DrawingStyle | ((annotation: TextAnnotation) => DrawingStyle);

}

export const TEIAnnotator = (props: TEIAnnotatorProps) => {

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = (element: HTMLElement) => {
    const anno = TEIPlugin(createTextAnnotator(element));
    anno.style = props.style;

    // @ts-ignore
    setAnno(anno);
  }

  useEffect(() => {
    if (!anno)
      return;
    
    (anno as unknown as RecogitoTEIAnnotator).style = props.style;
  }, [props.style]);

  return props.children ? 
    Children.toArray(props.children).map(child => 
      cloneElement(child as ReactElement, { onLoad })) : null;

}