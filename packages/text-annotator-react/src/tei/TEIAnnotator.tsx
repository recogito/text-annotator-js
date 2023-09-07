import { Children, ReactElement, ReactNode, cloneElement, useContext } from 'react';
import { TextAnnotatorOptions, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';
import { TEIPlugin } from '@recogito/text-annotator-tei';
import { AnnotoriousContext } from '@annotorious/react';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TEIAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode;

}

export const TEIAnnotator = (props: TEIAnnotatorProps) => {

  const { setAnno } = useContext(AnnotoriousContext);

  const onLoad = (element: HTMLElement) => {
    const anno = TEIPlugin(VanillaTextAnnotator(element));
    // @ts-ignore
    setAnno(anno);
  }

  return props.children ? 
    Children.toArray(props.children).map(child => 
      cloneElement(child as ReactElement, { onLoad })) : null;

}