import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext } from '@annotorious/react';
import type { Filter, HighlightStyleExpression } from '@recogito/text-annotator';
import { 
  createPDFAnnotator, 
  type PDFAnnotator as VanillaPDFAnnotator, 
  type PDFScale, 
  type PDFAnnotatorOptions,
  type PDFAnnotation 
} from '@recogito/pdf-annotator';

import '@recogito/pdf-annotator/pdf-annotator.css';
import './pdf-annotator.css';

export type PDFAnnotatorProps = PDFAnnotatorOptions & {

  children?: ReactNode;

  filter?: Filter;

  style?: HighlightStyleExpression<PDFAnnotation>

  pdfUrl: string;

  pageSize?: PDFScale | number;

  onRendered?(): void;

}

export const PDFAnnotator = (props: PDFAnnotatorProps) => {

  const { children, style, pdfUrl, ...opts } = props;

  const el = useRef<HTMLDivElement>(null);

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {     
    if (!el.current) return;

    let cancelled = false;
    let instance: VanillaPDFAnnotator | undefined;
    
    createPDFAnnotator(el.current, pdfUrl, opts)
      .then(anno => {
        if (cancelled) {
          anno.destroy();
          return;
        }
        
        instance = anno;
        anno.setStyle(props.style);
        setAnno(anno);

        props.onRendered?.();
      }).catch(error => {
        if (!cancelled) console.error(error);
      });

    return () => {
      cancelled = true;

      if (instance) {
        setAnno(undefined);
        instance.destroy();
      }
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (props.pageSize && anno)
      (anno as VanillaPDFAnnotator).setScale(props.pageSize);
  }, [props.pageSize])

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

  return (
    <div 
      ref={el} 
      className="r6o-pdf-container">
      {children}
    </div>
  )

}