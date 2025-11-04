import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';
import type { Label } from './label';
import { createLabelFactory } from './labelFactory';
import { getKey, groupAnnotationsBySelectedRange } from './utils';

export const mountPlugin = (r: TextAnnotator) => {

  const factory = createLabelFactory(r);

  let inView: Label[] = [];

  r.on('viewportIntersect', annotations => {
    const keyedAnnotations = annotations.map(annotation => ({ annotation, key: getKey(annotation) }));

    const getByKeys = (keys: string[]) =>
      keyedAnnotations.filter(k => keys.includes(k.key)).map(k => k.annotation);

    const currentKeys = [...new Set(inView.map(l => l.key))];
    const nextKeys = [...new Set(annotations.map(a => getKey(a)))];

    const keysToAdd = [...nextKeys].filter(key => !currentKeys.includes(key));
    const keysToRemove = [...currentKeys].filter(key => !nextKeys.includes(key));
    const keysToUpdate = [...currentKeys].filter(key => nextKeys.includes(key))
      // Check for actual changes on each key
      .filter(key => {
        const currentAnnotations = inView.find(l => l.key === key)?.annotations || [];
        const nextAnnotations = keyedAnnotations.filter(k => k.key === key).map(k => k.annotation);

        const currentIds = currentAnnotations.map(a => a.id);
        const nextIds = new Set(nextAnnotations.map(a => a.id));

        return currentIds.length !== nextIds.size || !currentIds.every(id => nextIds.has(id));
      });

    // Destroy labels that need removing or updating
    if (keysToRemove.length + keysToUpdate.length > 0) {
      const keysToDestroy = new Set([...keysToRemove, ...keysToUpdate]);
      const labelsToDestroy = inView.filter(l => keysToDestroy.has(l.key));

      inView = inView.filter(l => !keysToDestroy.has(l.key));

      labelsToDestroy.forEach(l => l.destroy());
    }

    // Create labels that need adding or updating
    if (keysToAdd.length + keysToUpdate.length > 0) {      
      const keysToCreate = new Set([...keysToAdd, ...keysToUpdate]);
      const annotationsToAdd = keyedAnnotations.filter(k => keysToCreate.has(k.key)).map(k => k.annotation);

      const labels = groupAnnotationsBySelectedRange(annotationsToAdd)
        .filter(group  => group.length > 1)
        .map(group => factory.createLabel(group));

      inView = [...inView, ...labels];
    }
  });

}