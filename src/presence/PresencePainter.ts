import type { PresenceProvider, PresentUser } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { Painter } from '../highlight/Painter';

export const createPainter = (provider: PresenceProvider): Painter => {

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
    const user = trackedAnnotations.get(annotation.id);
    if (user) {
      const { x, y, height } = rects[0];

      // Draw presence indicator
      context.fillStyle = user.color;
      context.fillRect(x - offset.x - 2, y - offset.y - 2.5, 2, height + 5);

      // Draw name label
      const label =
        user.user.name || user.user.email?.substring(0, user.user.email.indexOf('@')) || user.user.id;

      const { width } = context.measureText(label);
      context.fillRect(x - offset.x - 2, y - offset.y - 16.5, width + 8, 14.5);
      
      context.fillStyle = '#fff';
      context.fillText(label, x - offset.x + 1.5, y - offset.y - 5.5);
      
      return { fill: user.color + '33' };
    } else {
      return { fill: 'rgba(0, 128, 255, 0.2)' }
    }
  }

  return paint;
  
}