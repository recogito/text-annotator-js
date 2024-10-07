import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Filter } from '@annotorious/react';
import type { FormatAdapter } from '@annotorious/core';
import type { HighlightStyleExpression, TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/dist/text-annotator.css';

export interface TextAnnotatorProps<E extends unknown> extends Omit<TextAnnotatorOptions<TextAnnotation, E>, 'adapter'> {

  children?: ReactNode | JSX.Element;

  adapter?: FormatAdapter<TextAnnotation, E> | ((container: HTMLElement) => FormatAdapter<TextAnnotation, E>) | null;

  filter?: Filter;

  style?: HighlightStyleExpression;

  className?: string;

}

export const TextAnnotator = <E extends unknown>(props: TextAnnotatorProps<E>) => {

  const el = useRef<HTMLDivElement>(null);

  const { className, children, ...opts } = props;

  const { style, filter, user, annotatingEnabled } = opts;

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (!setAnno) return;

    const adapter = typeof opts.adapter === 'function' ? opts.adapter(el.current) : opts.adapter;

    const anno = createTextAnnotator(el.current, { ...opts, adapter });
    setAnno(anno);

    return () => anno.destroy();
  }, [setAnno]);

  useEffect(() => anno?.setStyle(style), [anno, style]);

  useEffect(() => anno?.setFilter(filter), [anno, filter]);

  useEffect(() => anno?.setUser(user), [anno, user]);

  useEffect(() => anno?.setAnnotatingEnabled(annotatingEnabled), [anno, annotatingEnabled]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );

}
