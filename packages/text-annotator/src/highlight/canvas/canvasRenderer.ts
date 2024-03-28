import type { ViewportBounds } from '../viewport';
import { debounce } from '../../utils';
import type { HighlightStyle } from '../HighlightStyle';
import { DEFAULT_SELECTED_STYLE, DEFAULT_STYLE, HighlightStyleExpression } from '../HighlightStyle';
import type { HighlightPainter } from '../HighlightPainter';
import { createBaseRenderer, type RendererImplementation } from '../baseRenderer';
import type { Highlight } from '../Highlight';
import type { TextAnnotatorState } from 'src/state';
import type { ViewportState } from '@annotorious/core';

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.className = 'r6o-highlight-layer bg';
  return canvas;
}

const resetCanvas = (canvas: HTMLCanvasElement, highres?: boolean) => {
  canvas.width = highres ? 2 * window.innerWidth : window.innerWidth;
  canvas.height = highres ? 2 * window.innerHeight : window.innerHeight;

  if (highres) {
    // Note that resizing the canvas resets the context
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }
}

const createRenderer = (container: HTMLElement): RendererImplementation => {

  container.classList.add('r6o-annotatable');

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  container.insertBefore(canvas, container.firstChild);

  const redraw = (   
    highlights: Highlight[], 
    viewportBounds: ViewportBounds,
    currentStyle?: HighlightStyleExpression,
    painter?: HighlightPainter
  ) => requestAnimationFrame(() => {

    const { width, height } = canvas;

    // New render loop - clear canvases
    ctx.clearRect(-0.5, -0.5, width + 1, height + 1);

    if (painter)
      painter.clear();

    const { top, left } = viewportBounds;
    
    highlights.forEach(h => {
      const base: HighlightStyle = currentStyle 
        ? typeof currentStyle === 'function' 
          ? currentStyle(h.annotation, h.state) 
          : currentStyle 
        : h.state?.selected 
          ? DEFAULT_SELECTED_STYLE 
          : DEFAULT_STYLE;

      // Trigger the custom painter (if any) as a side-effect
      const style = painter ? painter.paint(h, viewportBounds) || base : base;

      // Offset annotation rects by current scroll position
      const offsetRects = h.rects.map(({ x, y, width, height }) => ({ 
        x: x + left, 
        y: y + top, 
        width, 
        height 
      }));

      ctx.fillStyle = style.fill;
      ctx.globalAlpha = style.fillOpacity || 1;
      
      offsetRects.forEach(({ x, y, width, height }) => ctx.fillRect(x, y - 2.5, width, height + 5));

      if (style.underlineColor) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = style.underlineColor;

        offsetRects.forEach(({ x, y, width, height }) => {
          ctx.beginPath();
          ctx.moveTo(x, y + height + 4);
          ctx.lineTo(x + width, y + height + 4);
          
          // Draw the Path
          ctx.stroke();
        });
      }
    });
  });  

  const onResize = debounce(() => {
    resetCanvas(canvas);
  });

  window.addEventListener('resize', onResize);

  const setVisible = (visible: boolean) => {
    console.log('setVisible not implemented on Canvas renderer');
  }

  const destroy = () => {
    container.removeChild(canvas);

    window.removeEventListener('resize', onResize);
  }

  return {
    destroy,
    setVisible,
    redraw
  }

}

export const createCanvasRenderer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => createBaseRenderer(container, state, viewport, createRenderer(container));
