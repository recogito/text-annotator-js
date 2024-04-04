import { v4 as uuidv4 } from 'uuid';
import type { User } from '@annotorious/core';
import type { TextSelector } from '../model';
import { rangeToSelector } from './rangeToSelector';
import type { TextAnnotationStore } from 'src/state';
import { splitAnnotatableRanges } from './splitAnnotatableRanges';

interface Match {

  start: number;

  end: number;

}

const getTextContent = (container: HTMLElement) => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  let text = '';

  while (walker.nextNode()) {
    const node = walker.currentNode;
    text += node.textContent;
  }

  return text;
}

export const annotateMatch = (
  selector: TextSelector[], 
  currentUser: User,
  store: TextAnnotationStore
) => {

  const id = uuidv4();

  console.log('annotating', selector);

  const annotation = {
    id,
    bodies: [],
    target: {
      annotation: id,
      selector: selector,
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
): TextSelector[][] => {
  
  const selectors: TextSelector[][] = [];

  // @ts-ignore window.find is not official standard
  while (window.find(str) === true) {
    const sel = document.getSelection();
    const selectionRange = sel.getRangeAt(0);
    const annotatableRanges = splitAnnotatableRanges(selectionRange);
    
    selectors.push(annotatableRanges.map(r => rangeToSelector(r, container, offsetReferenceSelector)));
  }

  return selectors;
}