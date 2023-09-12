import type { Formatter, PresenceProvider, PresentUser } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { HighlightPainter } from '../highlight';
import type { PresencePainterOptions } from './PresencePainterOptions';
import { defaultPainter } from '../highlight';

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

  const paint = (
    annotation: TextAnnotation, 
    rects: DOMRect[], 
    context: CanvasRenderingContext2D, 
    isSelected?: boolean,
    formatter?: Formatter
  ) => {
    if (opts.font)
      context.font = opts.font;

    const user = trackedAnnotations.get(annotation.id);
    if (user) {
      const { x, y, height } = rects[0];

      // Draw presence indicator
      context.fillStyle = user.appearance.color;
      context.fillRect(x - 2, y - 2.5, 2, height + 5);

      // Draw name label
      const metrics = context.measureText(user.appearance.label);
      const labelWidth = metrics.width + 6;
      const labelHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
      
      // Sigh... different between FF and Chrome
      const paddingBottom = metrics.fontBoundingBoxAscent ? 8 : 6.5;

      context.fillRect(x - 2, y - 2.5 - labelHeight, labelWidth, labelHeight);
      
      context.fillStyle = '#fff';
      context.fillText(user.appearance.label, x + 1, y - paddingBottom);

      context.fillStyle = isSelected ? user.appearance.color + '62' : user.appearance.color + '33';
      rects.forEach(({ x, y, width, height }) => context.fillRect(x, y - 2.5, width, height + 5));
    } else {
      defaultPainter.paint(annotation, rects, context, isSelected, formatter);
    }
  }

  return { paint };
  
}