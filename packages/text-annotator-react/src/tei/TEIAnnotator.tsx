import { Children, ReactElement, ReactNode, cloneElement, useCallback, useContext, useEffect } from 'react';
import { AnnotoriousContext, Filter } from '@annotorious/react';
import { TEIPlugin } from '@recogito/text-annotator-tei';
import { createTextAnnotator, HighlightStyleExpression } from '@recogito/text-annotator';
import type { TextAnnotatorOptions } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TEIAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode | JSX.Element;

  filter?: Filter;

  style?: HighlightStyleExpression

}

export const TEIAnnotator = (props: TEIAnnotatorProps) => {

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = useCallback((element: HTMLElement) => {
    const anno = TEIPlugin(createTextAnnotator(element, opts));
    setAnno(anno);
  }, []);

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

  return props.children ? (
    <>
      {Children.toArray(props.children).map(child => 
        cloneElement(child as ReactElement, { onLoad }))}
    </>
  ) : null;

}
