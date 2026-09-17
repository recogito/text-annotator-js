import { RevivedTextAnnotationLike } from '@recogito/text-annotator';

export interface InlineMarker {

  remove(): void;

}

export const createInlineMarker = (annotations: RevivedTextAnnotationLike[]): InlineMarker => {
  console.debug('[inline-markers] creating marker');
  console.debug(annotations);

  const marker = document.createElement('marker');
  marker.className = 'r6o-annotation-start';

  const span = document.createElement('span');
  span.className = 'a9s-annotation';
  span.dataset.count = annotations.length > 1 ? `${annotations.length}` : '';
  
  marker.appendChild(span);

  console.debug('[inline-markers] appending to', annotations[0].target.selector[0]);
  annotations[0].target.selector[0].range.insertNode(marker);

  const remove = () => {
    marker.remove();
  }

  return {
    remove
  }

}