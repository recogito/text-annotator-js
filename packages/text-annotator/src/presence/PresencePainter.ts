import type { PresenceProvider, PresentUser } from '@annotorious/core';
import type { HighlightPainter, HighlightPainterStyle } from '../highlight';
import type { PresencePainterOptions } from './PresencePainterOptions';
import type { TextAnnotation } from '../model';
import type { Rect } from '../state';
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
    rects: Rect[], 
    bg: CanvasRenderingContext2D, 
    fg: CanvasRenderingContext2D,
    isSelected?: boolean,
    style?: HighlightPainterStyle
  ) => {
    if (opts.font)
      fg.font = opts.font;

    const user = trackedAnnotations.get(annotation.id);
    if (user) {
      const { x, y, height } = rects[0];

      // Draw presence indicator
      fg.fillStyle = user.appearance.color;
      fg.fillRect(x - 2, y - 2.5, 2, height + 5);

      // Draw name label
      const metrics = fg.measureText(user.appearance.label);
      const labelWidth = metrics.width + 6;
      const labelHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
      
      // Sigh... different between FF and Chrome
      const paddingBottom = metrics.fontBoundingBoxAscent ? 8 : 6.5;

      fg.fillRect(x - 2, y - 2.5 - labelHeight, labelWidth, labelHeight);
      
      fg.fillStyle = '#fff';
      fg.fillText(user.appearance.label, x + 1, y - paddingBottom);

      bg.fillStyle = user.appearance.color;
      bg.globalAlpha = isSelected ? 0.45 : 0.18;
      rects.forEach(({ x, y, width, height }) => bg.fillRect(x, y - 2.5, width, height + 5));
    } else {
      defaultPainter.paint(annotation, rects, bg, fg, isSelected, style);
    }
  }

  return { paint };
  
}
