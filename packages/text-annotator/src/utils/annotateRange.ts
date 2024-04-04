import { v4 as uuidv4 } from 'uuid';
import type { TextAnnotation } from "src/model";
import type { TextAnnotationStore } from "src/state";
import type { User } from '@annotorious/core';
import { rangeToSelector } from './rangeToSelector';

/**
 * Utility to annotate a DOM range programmatically.
 */
export const annotateRange = (
  range: Range,   
  currentUser: User,
  container: HTMLElement,
  store: TextAnnotationStore,
  offsetReferenceSelector?: string
): TextAnnotation | undefined => {

  const annotation = {
    annotation: uuidv4(),
    creator: currentUser,
    created: new Date(),
    target: {
      selector: [rangeToSelector(range, container, offsetReferenceSelector)]
    }
  };

  console.log(annotation);

  return undefined;
}