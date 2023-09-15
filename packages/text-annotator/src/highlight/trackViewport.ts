import type { ViewportState } from '@annotorious/core';
import type { TextAnnotation } from '../model';

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