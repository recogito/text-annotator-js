import type { PresenceProvider, PresentUser } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { HighlightPainter } from '../highlight';
import type { PresencePainterOptions } from './PresencePainterOptions';

export const createPainter = (provider: PresenceProvider, opts: PresencePainterOptions = {}): HighlightPainter => {

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

  const paint = (annotation: TextAnnotation, rects: DOMRect[], context: CanvasRenderingContext2D, offset: DOMRect) => {
    if (opts.font)
      context.font = opts.font;

    const user = trackedAnnotations.get(annotation.id);
    if (user) {
      const { x, y, height } = rects[0];

      // Draw presence indicator
      context.fillStyle = user.appearance.color;
      context.fillRect(x - offset.x - 2, y - offset.y - 2.5, 2, height + 5);

      // Draw name label
      const metrics = context.measureText(user.appearance.label);
      const textWidth = metrics.width;
      const textHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;

      context.fillRect(x - offset.x - 2, y - offset.y - textHeight - 4, textWidth + 8, textHeight + 2);
      
      context.fillStyle = '#fff';
      context.fillText(user.appearance.label, x - offset.x + 1, y - offset.y - 6.5);
      
      return { fill: user.appearance.color + '33' };
    } else {
      return { fill: 'rgba(0, 128, 255, 0.2)' }
    }
  }

  return paint;
  
}