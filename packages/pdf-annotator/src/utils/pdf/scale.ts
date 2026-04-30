import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

// Zoom/scale-related Annotator API function implementations

export type PDFScale = 
  'auto' |
  'page-fit' |
  'page-width' |
  'page-actual';

export const setScale = (viewer: PDFViewer) => (size: PDFScale | number) => { 
  if (typeof size === 'number')
    viewer.currentScale = size;
  else
    viewer.currentScaleValue = size;  

  return viewer.currentScale;
}