import { ReactNode, useContext, useEffect, useRef } from 'react';
import { AnnotoriousContext } from '@annotorious/react';
import { Filter, TextAnnotatorOptions, HighlightStyleExpression } from '@recogito/text-annotator';
import { createPDFAnnotator, PDFAnnotator as VanillaPDFAnnotator, PDFScale, PDFAnnotation } from '@recogito/pdf-annotator';

import '@recogito/pdf-annotator/pdf-anntator.css';
import './PDFAnnotator.css';

export type PDFAnnotatorProps = TextAnnotatorOptions<PDFAnnotation, PDFAnnotation> & {

  children?: ReactNode;

  filter?: Filter;

  style?: HighlightStyleExpression

  pdfUrl: string;

  pageSize?: PDFScale | number;

  onRendered?(): void;

}

export const PDFAnnotator = (props: PDFAnnotatorProps) => {

  const { children, style, pdfUrl, ...opts } = props;

  const el = useRef<HTMLDivElement>(null);

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {     
    createPDFAnnotator(el.current, pdfUrl, opts)
      .then(anno => {
        
        anno.setStyle(props.style);
        setAnno(anno);

        props.onRendered && props.onRendered();
      });
  }, []);

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