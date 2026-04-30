import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

export const zoomIn = (viewer: PDFViewer) => (percentage?: number) => {
  const factor = viewer.currentScale + (percentage || 10) / 100;
  viewer.currentScale = Math.min(50, factor);
  return viewer.currentScale;
}

export const zoomOut = (viewer: PDFViewer) => (percentage?: number) => {
  const factor = viewer.currentScale - (percentage || 10) / 100;
  viewer.currentScale = factor;
  return viewer.currentScale;
}