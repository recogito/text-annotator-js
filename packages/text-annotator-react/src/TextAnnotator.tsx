import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Filter, FormatAdapter } from '@annotorious/react';
import type { HighlightStyle, TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export interface TextAnnotatorProps<E extends unknown> extends Omit<TextAnnotatorOptions<E>, 'adapter'>  {

  children?: ReactNode | JSX.Element;

  adapter?: FormatAdapter<TextAnnotation, E> | ((container: HTMLElement) => FormatAdapter<TextAnnotation, E>) | null;

  filter?: Filter;

  style?: HighlightStyle;

}

export const TextAnnotator = <E extends unknown>(props: TextAnnotatorProps<E>) => {

  const el = useRef<HTMLDivElement>(null);

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (!setAnno) return;

    const adapter = typeof opts.adapter === 'function' ? opts.adapter(el.current) : opts.adapter;

    const anno = createTextAnnotator(el.current, { ...opts, adapter });
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
    <div ref={el}>
      {children}
    </div>
  )

}
