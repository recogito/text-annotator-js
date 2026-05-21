import type { TEIAnnotation, TEIAnnotationTarget, TEIRangeSelector } from '../tei-annotation';
import { reanchor } from './utils';
import type { 
  TextAnnotation, 
  TextAnnotationTarget, 
  TextSelector
} from '@recogito/text-annotator';

const elementCache = new Map<string, Node>();

/**
 * Returns the element corresponding to the given XPath expression.
 */
const resolveElement = (path: string, container: HTMLElement): Node | null => {
  const cached = elementCache.get(path);
  if (!cached) {
    const evaluated = document.evaluate(
      '.' + path, container, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;

    if (evaluated)
      elementCache.set(path, evaluated);
  }

  return elementCache.get(path) || null;
}

/**
 * Computes a stable, lexically-sortable position key for a DOM node relative
 * to a container, incorporating a character offset within that node.
 *
 * Each path segment is the node's **absolute** child index among all siblings
 * (regardless of element type), zero-padded to a fixed width so that
 * lexicographic string comparison (`localeCompare`) faithfully reproduces
 * document order.
 * 
 * Format:  "000002/000000/000005::0000000014"
 *          ^─────────────────^   ^─────────^
 *          one segment per DOM   char offset
 *          level from container
 */
export const toPositionKey = (
  node: Node,
  offset: number,
  container: HTMLElement,
  segmentPad = 6,
  offsetPad  = 10
): string => {
  const segments: number[] = [];

  let current: Node = node;
 
  while (current && current !== container) {
    const parent = current.parentNode;
    if (!parent) break;                 // climbed past the document root – shouldn't happen
 
    // Walk forward through *all* siblings to find the absolute index.
    // This is O(siblings-per-level) but is called once at annotation-load
    // time and the result is persisted, so it never needs to be repeated.
    let absoluteIndex = 0;
    let sibling = parent.firstChild;
    while (sibling && sibling !== current) {
      absoluteIndex++;
      sibling = sibling.nextSibling;
    }
 
    segments.unshift(absoluteIndex);    // prepend so root comes first
    current = parent;
  }
 
  const pathKey   = segments.map(i => i.toString().padStart(segmentPad, '0')).join('/');
  const offsetKey = offset.toString().padStart(offsetPad, '0');
  return `${pathKey}::${offsetKey}`;
}

/**
 * Helper: Returns the given XPath for a DOM node, in the form of 
 * a list of segments.
 * 
 * Note that this method is used recursively,
 */
const getXPath = (node: Node, path: string[] = []) => {
  let xpath: string;
  let count: number;
  let predicate: string;

  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute('xml:id')) {
    path.push('/');
  } else if (node.parentNode) {
    path = getXPath(node.parentNode, path);
  }

  if (node.nodeType === Node.ELEMENT_NODE && node.nodeName.toLowerCase().startsWith('tei-')) {
    const el = node as Element;

    if (el.hasAttribute('xml:id')) {
      predicate = `[@xml:id='${el.getAttribute("xml:id")}']`;
    } else {
      xpath = `count(preceding-sibling::${el.localName})`;
      count = document.evaluate(xpath, node, null, XPathResult.NUMBER_TYPE, null).numberValue + 1;
  
      predicate = `[${count}]`;
    }

    path.push('/');
    path.push(el.getAttribute('data-origname') + predicate);
  }

  return path;
}

/**
 * For the given path sgement lists, this function returns the the
 * start & end XPath expression pair.
 */
const toTEIRange = (container: HTMLElement, startPath: string[], endPath: string[], selectedRange: Range) => {
  
  const findFirstTEIChild = (node: Node): Element | null => {
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT,
      (node) => {
        return (node as Element).nodeName.toLowerCase().startsWith('tei-')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    );
    
    return walker.nextNode() as Element | null;
  }

  // For a given node, returns the closest parent that is a TEI element
  const getClosestTEINode = (node: Node | null): Node | null => {
    if (!node) return null;

    // Edge case: node is the container itself
    if (node === container) {
      return findFirstTEIChild(node);
    } else {
      return (node.nodeName.toLowerCase().indexOf('tei-') === 0) ?
        node : getClosestTEINode(node.parentNode);
    }
  };

  // Helper to compute char offsets between end of XPath and a given reference node
  const getOffsetFromTo = (fromNode: Node, toNode: Node, toOffset: number) => {
    const range = document.createRange();
    range.setStart(fromNode, 0);
    range.setEnd(toNode, toOffset);
    return range.toString().length;
  }

  const startOffset = getOffsetFromTo(
    getClosestTEINode(selectedRange.startContainer)!,
    selectedRange.startContainer,
    selectedRange.startOffset);

  const endOffset = getOffsetFromTo(
    getClosestTEINode(selectedRange.endContainer)!,
    selectedRange.endContainer,
    selectedRange.endOffset);

  return { 
    startPath: startPath.join(''),
    startOffset, 
    endPath: endPath.join(''),
    endOffset
  }; 
}

const parseXPathExpression = (expression: string) => {
  const splitIdx = expression.indexOf('::');

  const pathStr = splitIdx < 0 ? expression : expression.substring(0, splitIdx);
  const path = pathStr
    .replace(/\/([^[/]+)/g, (_, p1) => '/tei-' + p1.toLowerCase())
    .replace(/xml:/g, '');
 
  const offset = splitIdx < 0 ? 0 : parseInt(expression.substring(splitIdx + 2));
  return { path, offset };
}

/**
 * Using the DOM Range from a (revived!) TextSelector, this function computes
 * the TEIRangeSelector corresponding to that range. We need this because
 * the Text Annotator will always produce a TextAnnotation natively.
 */
export const textToTEISelector = (container: HTMLElement) => (selector: TextSelector): TEIRangeSelector => {
  const { range } = selector;

  // XPath segments for Range start and end nodes as a list
  const startPathSegments: string[] = getXPath(range.startContainer);
  const endPathSegments: string[] = getXPath(range.endContainer);

  // TEI XPath expressions + offset
  const { 
    startPath, 
    startOffset, 
    endPath,
    endOffset 
  } = toTEIRange(container, startPathSegments, endPathSegments, range);

  // Lexically sortable position key
  const position = toPositionKey(range.startContainer, startOffset, container);

  return {
    position,
    startSelector: {
      type: 'XPathSelector',
      value: `${startPath}::${startOffset}`
    },
    endSelector: {
      type: 'XPathSelector',
      value: `${endPath}::${endOffset}`
    },
    quote: selector.quote?.replace(/\s+/g, ' '),
    range
  };
}

export const reviveSelector = (selector: TEIRangeSelector, container: HTMLElement): TEIRangeSelector => {
  // Don't revive unncessarily
  if (selector.position && selector.range instanceof Range) return selector;

  const startExpression = selector.startSelector?.value;
  const endExpression = selector.endSelector?.value;

  if (!startExpression || !endExpression) {
    console.error(selector);
    throw new Error('Invalid TEI selector');
  }

  const startParsed = parseXPathExpression(startExpression);
  const endParsed = parseXPathExpression(endExpression);

  // Resolve start XPath against DOM
  const startElement = resolveElement(startParsed.path, container);

  // Don't evaluate twice if start === end element
  const endElement = startParsed.path === endParsed.path
    ? startElement
    : resolveElement(endParsed.path, container);

  if (!startElement || !endElement) {
    console.error(selector);
    throw new Error('Could not resolve XPath');
  }

  // For future use: stop here for lazy rendering!

  const range = document.createRange();

  const reanchorIfNeeded = (parent: Node, offset: number) => {
    if (parent.firstChild instanceof Text && parent.firstChild.length >= offset) {
      return { node: parent.firstChild, offset };
    } else {
      return reanchor(parent.firstChild!, parent, offset);
    } 
  }

  const reanchoredStart = reanchorIfNeeded(startElement, startParsed.offset);
  range.setStart(reanchoredStart.node, reanchoredStart.offset);

  const reanchoredEnd = reanchorIfNeeded(endElement, endParsed.offset);
  range.setEnd(reanchoredEnd.node, reanchoredEnd.offset);

  const position = toPositionKey(reanchoredStart.node, reanchoredStart.offset, container);

  return {
    ...(selector as TEIRangeSelector),
    position,
    range
  };
}

export const reviveTarget = (t: TEIAnnotationTarget, container: HTMLElement) => ({
  ...t,
  selector: t.selector.map(s => reviveSelector(s, container))
});

export const textToTEITarget =  (container: HTMLElement) => (target: TextAnnotationTarget | TEIAnnotationTarget): TEIAnnotationTarget => {
  return {
    ...target,
    selector: target.selector.map(s => 'startSelector' in s ? reviveSelector(s, container) : textToTEISelector(container)(s))
  }
}

export const textToTEIAnnotation = (container: HTMLElement) => (a: TextAnnotation | TEIAnnotation): TEIAnnotation => ({
  ...a,
  target: textToTEITarget(container)(a.target)
})

