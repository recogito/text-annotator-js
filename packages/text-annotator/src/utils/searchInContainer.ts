import { v4 as uuidv4 } from 'uuid';
import type { User } from '@annotorious/core';
import type { TextSelector } from '../model';
import { rangeToSelector } from './rangeToSelector';
import { reviveSelector } from "./reviveSelector";
import type { TextAnnotationStore } from 'src/state';

interface Match {

  start: number;

  end: number;

}

export const annotateMatch = (
  selector: TextSelector, 
  currentUser: User,
  store: TextAnnotationStore
) => {

  const id = uuidv4();

  const annotation = {
    id,
    bodies: [],
    target: {
      annotation: id,
      selector: [selector],
      creator: currentUser,
      created: new Date()
    }
  }

  store.addAnnotation(annotation);
}

export const searchInContainer = (
  str: string, 
  container: HTMLElement,
  offsetReferenceSelector?: string
): TextSelector[] => {
  const text = container.innerText;

  const matches: Match[] = [];

  let index = 0;

  let startIndex = 0;

  while ((index = text.indexOf(str, startIndex)) !== -1) {
    let endIndex = index + str.length;

    matches.push({ start: index, end: endIndex });

    startIndex = endIndex;
  }

  const selectors = matches.map(m => reviveSelector({
    quote: str,
    start: m.start,
    end: m.end,
    range: undefined
  }, container));

  // Re-align the ranges with the offset reference, in case there is one!
  return offsetReferenceSelector
    ? selectors.map(s => rangeToSelector(s.range, container, offsetReferenceSelector))
    : selectors;
}