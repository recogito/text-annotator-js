import type { PresenceProvider, PresentUser, ViewportState } from '@annotorious/core';
import type { Rect } from '../state';
import type { TextAnnotation } from '../model';
import type { PresencePainterOptions } from './PresencePainterOptions';

const createCanvas = (className: string, highres?: boolean) => {
  const canvas = document.createElement('canvas');
  canvas.width = highres ? 2 * window.innerWidth : window.innerWidth;
  canvas.height = highres ? 2 * window.innerHeight : window.innerHeight;
  canvas.className = className;

  if (highres) {
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }

  return canvas;
}

export const createPresenceLayer = (
  container: HTMLElement, 
  provider: PresenceProvider,
  opts: PresencePainterOptions = {}
) => {
  const presenceCanvas = createCanvas('r6o-presence-layer', true);
  const ctx = presenceCanvas.getContext('2d');

  container.appendChild(presenceCanvas);

  const trackedAnnotations = new Map<string, PresentUser>();

  provider.on('selectionChange', (p: PresentUser, selection: string[] | null) => {
    console.log('selection change', p, selection);
    /*
    // Remove this user's previous selection
    const currentIds = getAnnotationsForUser(p);
    currentIds.forEach(id => trackedAnnotations.delete(id));

    // Set new selection (if any)
    if (selection)
      selection.forEach(id => trackedAnnotations.set(id, p));
    */
  });  

  const paint = (
    annotation: TextAnnotation,
    rects: Rect[]
  ) => {
    if (opts.font)
      ctx.font = opts.font;

    const user = trackedAnnotations.get(annotation.id);
    if (user) {
      const { x, y, height } = rects[0];

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
    }
  }

  return {
    paint
  }

}