import { TextAnnotation } from '@recogito/text-annotator';

export const getKey = (annotation: TextAnnotation) =>
  annotation.target.selector
    .map(selector => `${selector.start}-${selector.end}`)
    .join(':');

export const groupAnnotationsBySelectedRange = (annotations: TextAnnotation[]): TextAnnotation[][] => {
  const groupMap = new Map<string, TextAnnotation[]>();

  annotations.forEach(annotation => {
    const key = getKey(annotation);
    
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(annotation);
  });

  return Array.from(groupMap.values());
}

