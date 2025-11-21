import { Children, JSX, ReactElement, ReactNode, cloneElement, useCallback, useContext, useEffect } from 'react';
import { AnnotoriousContext, Filter } from '@annotorious/react';
import { createTEIAnnotator } from '@recogito/text-annotator-tei';
import type { AnnotatingMode, TextAnnotatorOptions } from '@recogito/text-annotator';

import '@recogito/text-annotator/text-annotator.css';

export type TEIAnnotatorProps = TextAnnotatorOptions & {

  children?: ReactNode | JSX.Element;

  annotatingMode?: AnnotatingMode;

  filter?: Filter;

}

export const TEIAnnotator = (props: TEIAnnotatorProps) => {

  const { children, ...opts } = props;

  const { anno, setAnno } = useContext(AnnotoriousContext);

  const onLoad = useCallback((element: HTMLElement) => {
    // @ts-ignore
    const anno = createTEIAnnotator(element, opts);
    setAnno(anno);
  }, []);

  useEffect(() => anno?.setStyle(props.style), [anno, props.style]);

  useEffect(() => anno?.setFilter(props.filter), [anno, props.filter]);

  useEffect(() => anno?.setUser(opts.user), [anno, opts.user]);

  useEffect(() => anno?.setAnnotatingEnabled(opts.annotatingEnabled), [anno, opts.annotatingEnabled]);

  useEffect(() => anno?.setAnnotatingMode(opts.annotatingMode), [anno, opts.annotatingMode]);

  return props.children ? (
    <>
      {Children.toArray(props.children).map(child => 
        cloneElement(child as ReactElement, { onLoad } as any))}
    </>
  ) : null;

}
