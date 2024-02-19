import { ForwardedRef, forwardRef, ReactNode, useContext, useEffect, useRef } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { AnnotoriousContext, DrawingStyle, Filter } from '@annotorious/react';
import type { TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export type TextAnnotatorProps<E extends unknown> = TextAnnotatorOptions<E> & {

  children?: ReactNode | JSX.Element;

  filter?: Filter;

  style?: DrawingStyle | ((annotation: TextAnnotation) => DrawingStyle);

}

export const TextAnnotator = forwardRef(<E extends unknown>(props: TextAnnotatorProps<E>, ref: ForwardedRef<HTMLDivElement>) => {

  const containerElRef = useRef<HTMLDivElement | null>(null);

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    const { current: containerEl } = containerElRef;
    if (!containerEl || !setAnno) return;

    const anno = createTextAnnotator(containerEl, opts);
    anno.setStyle(props.style);
    setAnno(anno);

    return () => anno.destroy();
  }, [setAnno]);

  useEffect(() => {
    if (!anno) return;

    anno.setStyle(props.style);
  }, [anno, props.style]);

  useEffect(() => {
    if (!anno) return;
    
    anno.setFilter(props.filter);
  }, [anno, props.filter]);

  return (
    <div ref={mergeRefs([containerElRef, ref])}>
      {children}
    </div>
  )

});
