import type { TextAnnotation } from '../model';

export interface ViewportBounds {
  top: number;
  left: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const getViewportBounds = (container: HTMLElement): ViewportBounds => {
  const { top, left } = container.getBoundingClientRect();

  const { innerWidth, innerHeight } = window;

  const minX = - left;
  const minY = - top;
  const maxX = innerWidth - left;
  const maxY = innerHeight - top;

  return { top, left, minX, minY, maxX, maxY };
}

/**
 * Tracks which annotations are visible in the viewport.
 * Returns a callback that should be called after each redraw.
 */
export const createViewportTracker = (onViewportChange: (ids: string[]) => void) => {
  let visible = new Set<string>();

  return (annotations: TextAnnotation[]) => {
    const ids = annotations.map(a => a.id);

    if (visible.size !== ids.length || ids.some(id => !visible.has(id))) {
      onViewportChange(ids);
    }

    visible = new Set(ids);
  }
}
