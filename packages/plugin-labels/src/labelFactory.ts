import { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';
import { Label } from './label';

import style from './label.module.css';
import { getKey } from './utils';

export const createLabelFactory = (r: TextAnnotator) => {
  const { element } = r;
  const { store } = r.state;
  
  const createLabel = (annotations: TextAnnotation[]): Label => {
    if (annotations.length === 0) return;

    const { x, y, width } = store.getAnnotationBounds(annotations[0].id);

    const el = document.createElement('div');
    el.className = style.container;
    el.style.left = `${x + width}px`;
    el.style.top = `${y}px`;

    el.innerHTML = `${annotations.length}`;

    el.addEventListener('click', () => console.log('clicked', annotations));

    element.appendChild(el);

    const destroy = () => {
      el.remove();
    }

    const key = getKey(annotations[0]);

    return { key, annotations, destroy };
  }

  return {
    createLabel
  }

}