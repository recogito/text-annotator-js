import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Filter } from '@annotorious/react';
import type { FormatAdapter } from '@annotorious/core';
import type { HighlightStyleExpression, TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';


export interface TextAnnotatorProps<E extends unknown> extends Omit<TextAnnotatorOptions<E>, 'adapter'>  {

  children?: ReactNode | JSX.Element;

  adapter?: FormatAdapter<TextAnnotation, E> | ((container: HTMLElement) => FormatAdapter<TextAnnotation, E>) | null;

  filter?: Filter;

  style?: HighlightStyleExpression

  className?: string;

}

export const TextAnnotator = <E extends unknown>(props: TextAnnotatorProps<E>) => {

  const el = useRef<HTMLDivElement>(null);

  const { className, children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (!setAnno) return;

    const adapter = typeof opts.adapter === 'function' ? opts.adapter(el.current) : opts.adapter;

    const anno = createTextAnnotator(el.current, { ...opts, adapter });
    setAnno(anno);

    return () => anno.destroy();
  }, [setAnno]);

  useEffect(() => anno?.setStyle(props.style), [anno, props.style]);

  useEffect(() => anno?.setFilter(props.filter), [anno, props.filter]);

  useEffect(() => anno?.setAnnotatingEnabled(props.annotatingEnabled), [anno, props.annotatingEnabled]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );

}
