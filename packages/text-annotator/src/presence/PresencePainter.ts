import type { Color, PresenceProvider, PresentUser } from '@annotorious/core';
import type { AnnotationRects } from '../state';
import type { HighlightStyle, HighlightPainter } from '../highlight';
import type { PresencePainterOptions } from '../presence';
import type { ViewportBounds } from '../highlight/viewport';

const createCanvas = () => {
  const canvas = document.createElement('canvas');

  // Retina resolution for crisp font rendering
  canvas.width = 2 * window.innerWidth;
  canvas.height = 2 * window.innerHeight;
  canvas.className = 'r6o-highlight-layer presence';

  const context = canvas.getContext('2d');
  context.scale(2, 2);
  context.translate(0.5, 0.5);

  return canvas;
}

export const createPresencePainter = (
  container: HTMLElement, 
  provider: PresenceProvider, 
  opts: PresencePainterOptions = {}
): HighlightPainter => {

  const canvas = createCanvas();

  const ctx = canvas.getContext('2d');

  document.body.appendChild(canvas);

  const trackedAnnotations = new Map<string, PresentUser>();

  const getAnnotationsForUser = (p: PresentUser) =>
    Array.from(trackedAnnotations.entries())
      .filter(([id, user]) => user.presenceKey === p.presenceKey)
      .map(([id, _]) => id);

  provider.on('selectionChange', (p: PresentUser, selection: string[] | null) => {
    // Remove this user's previous selection
    const currentIds = getAnnotationsForUser(p);
    currentIds.forEach(id => trackedAnnotations.delete(id));

    // Set new selection (if any)
    if (selection)
      selection.forEach(id => trackedAnnotations.set(id, p));
  });  

  const clear = () => {
    const { width, height } = canvas;
    ctx.clearRect(-0.5, -0.5, width + 1, height + 1);
  }

  const paint = (
    highlight: AnnotationRects, 
    viewportBounds: ViewportBounds,
    isSelected?: boolean
  ): HighlightStyle | undefined => {
    if (opts.font)
      ctx.font = opts.font;

    const user = trackedAnnotations.get(highlight.annotation.id);
    if (user) {
      // Draw cursor + label to the presence canvas
      const { height } = highlight.rects[0];
      const x = highlight.rects[0].x + viewportBounds.left;
      const y = highlight.rects[0].y + viewportBounds.top;

      // Draw presence indicator
      ctx.fillStyle = user.appearance.color;
      ctx.fillRect(x - 2, y - 2.5, 2, height + 5);

      // Draw name label
      const metrics = ctx.measureText(user.appearance.label);
      const labelWidth = metrics.width + 6;
      const labelHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
      
      // Sigh... different between FF and Chrome
      const paddingBottom = metrics.fontBoundingBoxAscent ? 8 : 6.5;

      ctx.fillRect(x - 2, y - 2.5 - labelHeight, labelWidth, labelHeight);
      
      ctx.fillStyle = '#fff';
      ctx.fillText(user.appearance.label, x + 1, y - paddingBottom);

      // Return modfied style for the renderer
      return { 
        fill: user.appearance.color as Color,
        fillOpacity: isSelected ? 0.45 : 0.18
      }
    }
  }
  
  const reset = () => {
    canvas.width = 2 * window.innerWidth;
    canvas.height = 2 * window.innerHeight;

    // Note that resizing the canvas resets the context
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }

  const destroy = () => {
    canvas.remove();
  }

  return {
    clear,
    destroy,
    paint,
    reset
  }
  
}
