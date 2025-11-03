import { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';

import style from './label.module.css';

export interface Label {

  annotations: TextAnnotation[];

  destroy(): void;

}

export const createLabelFactory = (r: TextAnnotator) => {
  const { element } = r;
  const { store } = r.state;
  
  const createLabel = (annotations: TextAnnotation[]): Label => {
    if (annotations.length === 0) return;

    const { x, y } = store.getAnnotationBounds(annotations[0].id);

    const el = document.createElement('div');
    el.className = style.container;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    el.innerHTML = `${annotations.length}`;

    el.addEventListener('click', () => console.log('clicked', annotations));

    element.appendChild(el);

    const destroy = () => {
      el.remove();
    }

    return { annotations, destroy };
  }

  return {
    createLabel
  }

}