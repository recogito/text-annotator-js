import { JSX, ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext, Filter } from '@annotorious/react';
import type { FormatAdapter } from '@annotorious/core';
import type { AnnotatingMode, HighlightStyleExpression, TextAnnotation, TextAnnotatorOptions } from '@recogito/text-annotator';
import { createTextAnnotator } from '@recogito/text-annotator';

import '@recogito/text-annotator/text-annotator.css';

export interface TextAnnotatorProps<I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation> extends Omit<TextAnnotatorOptions<I, E>, 'adapter'> {

  children?: ReactNode | JSX.Element;

  adapter?: FormatAdapter<I, E> | ((container: HTMLElement) => FormatAdapter<I, E>) | null;

  annotatingMode?: AnnotatingMode;

  filter?: Filter<I>;

  className?: string;

}

export const TextAnnotator = <I extends TextAnnotation = TextAnnotation, E extends unknown = TextAnnotation>(
  props: TextAnnotatorProps<I, E>
) => {

  const el = useRef<HTMLDivElement>(null);

  const { className, children, ...opts } = props;

  const { style, filter, user, annotatingEnabled, annotatingMode } = opts;

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

  useEffect(() => anno?.setAnnotatingMode(annotatingMode), [anno, annotatingMode]);

  return (
    <div ref={el} className={`r6o-annotatable no-focus-outline ${className}`}>
      {children}
    </div>
  );

}
