import type { TextAnnotation } from '@/model';
import type { PaintStyle, Painter } from '../highlight/Painter';

export const createPainter = (provider: any): Painter => {

  // Current colors and selections
  const styles = new Map<string, string>();

  provider.on('selectionChange', (presenceState: any, selection: string | undefined) => {
    console.log('selection change', presenceState, selection);

    if (selection) {
      styles.set(selection, presenceState.color);
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