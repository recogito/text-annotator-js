import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';
import type { Label } from './label';
import { createLabelFactory } from './labelFactory';

export const mountPlugin = (r: TextAnnotator) => {

  const factory = createLabelFactory(r);

  let inView: Label[] = [];

  const groupAnnotationsBySelectedRange = (annotations: TextAnnotation[]): TextAnnotation[][] => {
    const groupMap = new Map<string, TextAnnotation[]>();

    annotations.forEach(annotation => {
      const rangeKey = annotation.target.selector
        .map(selector => `${selector.start}-${selector.end}`)
        .join(':');
      
      if (!groupMap.has(rangeKey)) groupMap.set(rangeKey, []);
      groupMap.get(rangeKey)!.push(annotation);
     });

    return Array.from(groupMap.values());
  }

  const addLabels = (annotations: TextAnnotation[]) => {
    const grouped = groupAnnotationsBySelectedRange(annotations);
    
    const toAdd = grouped.map(annotations => factory.createLabel(annotations));
    inView = [...inView, ...toAdd];
  }

  const removeLabels = (labels: Label[]) => {
    inView = inView.filter(l => !labels.includes(l));
    labels.forEach(l => l.destroy());
  }

  r.on('viewportIntersect', annotations => {
    const currentIds = new Set(inView.flatMap(a => a.annotations.map(a => a.id)));
    const nextIds = new Set(annotations.map(a => a.id));

    const toAdd = annotations.filter(a => !currentIds.has(a.id));
    const toRemove = inView.filter(l => !nextIds.has(l.annotations[0].id));

    if (toAdd.length > 0) addLabels(toAdd);
    if (toRemove.length > 0) removeLabels(toRemove);
  });

}