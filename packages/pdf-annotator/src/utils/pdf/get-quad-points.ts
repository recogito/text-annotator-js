import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

interface Point { x: number, y: number };

const clientPointToPDFPoint = (pt: Point, page: pdfjsViewer.PDFPageView, viewerElement: HTMLDivElement): Point => {
  // Points y is relative to viewerElement!
  const canvas = page.canvas as HTMLCanvasElement;

  const viewerElementBounds = viewerElement.getBoundingClientRect();
  const canvasBounds = canvas.getBoundingClientRect();

  const canvasOffsetY = canvasBounds.top - viewerElementBounds.top;
  const canvasOffsetX = canvasBounds.left - viewerElementBounds.left;
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;

  // Point XY in pixels, relative to canvas
  const offsetX = pt.x - canvasOffsetX;
  const offsetY = pt.y - canvasOffsetY;

  // PDF viewport height, width and scale
  const { height, width, scale } = page.viewport;

  // Canvas and PDF coords are flipped in Y axis
  const bottom = canvas.offsetHeight - offsetY;

  const pdfX = width * offsetX / canvasWidth / scale;
  const pdfY = height * bottom / canvasHeight / scale;

  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  return { x: round(pdfX), y: round(pdfY) };
}

const rectToQuadPoints = (rect: DOMRect, page: pdfjsViewer.PDFPageView, viewerElement: HTMLDivElement) => {
  // QuadPoint-compliant. The (Adobe) spec says: starting bottom-left, counter-clockwise.
  // The (Adobe) implementation does: bottom-left, bottom-right, top-left, top-right. Yay.
  // https://github.com/highkite/pdfAnnotate?tab=readme-ov-file#quadpoints
  // https://stackoverflow.com/questions/9855814/pdf-spec-vs-acrobat-creation-quadpoints
  const p1 = { x: rect.left, y: rect.bottom };
  const p2 = { x: rect.right, y: rect.bottom };
  const p3 = { x: rect.left, y: rect.top };
  const p4 = { x: rect.right, y: rect.top };

  const pdfPoints = [p1, p2, p3, p4].map(pt => clientPointToPDFPoint(pt, page, viewerElement));

  return pdfPoints.reduce<number[]>((qp, point) => {
    return [...qp, point.x, point.y];
  },[]);
}

export const getQuadPoints = (rects: DOMRect[], page: pdfjsViewer.PDFPageView, viewerElement: HTMLDivElement) =>
  rects.reduce<number[]>((qp, rect) => [...qp, ...rectToQuadPoints(rect, page, viewerElement)], []);