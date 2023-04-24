import type { PresenceProvider, PresentUser } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { PaintStyle, Painter } from '../highlight/Painter';

export const createPainter = (provider: PresenceProvider): Painter => {

  // Current colors and selections
  const styles = new Map<string, string>();

  provider.on('selectionChange', (user: PresentUser, selection: string[]) => {
    if (selection) {
      selection.forEach(annotationId => {
        styles.set(annotationId, user.color);
      });
    } else {
      // TODO
    }
  });  

  const paint = (annotation: TextAnnotation): PaintStyle => {
    // Hack
    return {
      fill: styles.has(annotation.id) ? styles.get(annotation.id) + '33' : null
    };
  }

  return paint;
  
}