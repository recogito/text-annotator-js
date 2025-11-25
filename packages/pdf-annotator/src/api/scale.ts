import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';
import type { PDFScale } from '../PDFScale';

// Zoom/scale-related Annotator API function implementations

export const setScale = (viewer: PDFViewer) => (size: PDFScale | number) => { 
  if (typeof size === 'number')
    viewer.currentScale = size;
  else
    viewer.currentScaleValue = size;  

  return viewer.currentScale;
}