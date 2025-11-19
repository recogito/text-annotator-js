import type { ViewportState } from '@annotorious/core';
import type { TextAnnotation } from '@/model';

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

export const trackViewport = (viewport: ViewportState) => {
  let visible = new Set<string>();

  const onDraw = (annotations: TextAnnotation[]) => {
    const ids = annotations.map(a => a.id);

    if (visible.size !== ids.length || ids.some(id => !visible.has(id))) {
      viewport.set(ids);
    } 

    visible = new Set(ids);
  }

  return onDraw;

}