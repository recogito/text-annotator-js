import React, { useEffect } from 'react';
import { useAnnotations, useAnnotator } from '@annotorious/react';
import { PDFAnnotator } from '../src';
import { PDFAnnotation, PDFAnnotator as VanillaPDFAnnotator } from '@recogito/pdf-annotator';
import { TextAnnotationPopup } from '@recogito/react-text-annotator';

export const App = () => {

  const anno = useAnnotator<VanillaPDFAnnotator>();

  const annotations = useAnnotations<PDFAnnotation>();

  useEffect(() => {
    if (anno)
      anno.loadAnnotations('annotations.json');
  }, [anno]);

  const onClick = (annotation: PDFAnnotation) => {
    anno.setSelected(annotation.id);
    anno.scrollIntoView(annotation);
  }

  return (
    <>
      <PDFAnnotator 
        pdfUrl="compressed.tracemonkey-pldi-09.pdf" />

      <TextAnnotationPopup 
        asPortal
        popup={() => (
        <span>Hello World!</span>
      )} />

      <ul className="annotation-list not-annotatable">
        {annotations.map(annotation => (
          <li key={annotation.id} onClick={() => onClick(annotation)}>
            {annotation.target.selector[0].pageNumber} : {annotation.target.selector[0].quote}
          </li>
        ))}
      </ul>
    </>
  )

}