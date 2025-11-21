import { TextAnnotation } from '@recogito/text-annotator';

export interface InlineMarker {

  remove(): void;

}

export const createInlineMarker = (annotations: TextAnnotation[]): InlineMarker => {

  const marker = document.createElement('marker');
  marker.className = 'r6o-annotation-start';

  const span = document.createElement('span');
  span.className = 'a9s-annotation';
  span.dataset.count = annotations.length > 1 ? `${annotations.length}` : '';
  
  marker.appendChild(span);

  annotations[0].target.selector.map(selector => {
    selector.range.insertNode(marker);
  });

  const remove = () => {
    marker.remove();
  }

  return {
    remove
  }

}