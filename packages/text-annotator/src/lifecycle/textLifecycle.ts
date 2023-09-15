import { createLifecyleObserver } from '@annotorious/core';
import type { HoverState, SelectionState } from '@annotorious/core';
import type { TextAnnotation } from '../model';
import type { TextAnnotationStore } from '../state';

export const createTextLifecycleObserver = <T extends unknown>(
  store: TextAnnotationStore, 
  selection: SelectionState<TextAnnotation>, 
  hover: HoverState<TextAnnotation>
) => {
  let visible = new Set<string>();

  const lifecycle = createLifecyleObserver<TextAnnotation, T>(store, selection, hover);

  const onDraw = (annotations: TextAnnotation[]) => {
    const ids = annotations.map(a => a.id);

    if (visible.size !== ids.length || ids.some(id => !visible.has(id))) {
      lifecycle.emit('viewportIntersect', annotations);
    } 

    visible = new Set(ids);
  }

  return { onDraw, lifecycle };
}