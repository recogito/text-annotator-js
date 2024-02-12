import { reviveTarget } from '@recogito/text-annotator';
import type { 
  TextAnnotation, 
  TextAnnotationTarget, 
  TextSelector
} from '@recogito/text-annotator';
import type { TEIAnnotation, TEIAnnotationTarget, TEIRangeSelector } from '../TEIAnnotation';

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
const toTEIXPaths = (startPath: string[], endPath: string[], selectedRange: Range) => {
  // For a given node, returns the closest parent that is a TEI element
  const getClosestTEINode = (node: Node | null) => {
    if (!node) return null;

    return (node.nodeName.toLowerCase().indexOf('tei-') === 0) ?
      node : getClosestTEINode(node.parentNode);
  };

  // Helper to compute char offsets between end of XPath and a given reference node
  const getOffsetFromTo = (fromNode: Node, toNode: Node, toOffset: number) => {
    const range = document.createRange();
    range.setStart(fromNode, 0);
    range.setEnd(toNode, toOffset);
    return range.toString().length;
  }

  const startOffset = getOffsetFromTo(
    getClosestTEINode(selectedRange.startContainer),
    selectedRange.startContainer,
    selectedRange.startOffset);

  const endOffset = getOffsetFromTo(
    getClosestTEINode(selectedRange.endContainer),
    selectedRange.endContainer,
    selectedRange.endOffset);

  const start = startPath.join('') + '::' + startOffset;
  const end = endPath.join('') + '::' + endOffset;

  return { start, end }; 
}


/**
 * Using the DOM Range from a (revived!) TextSelector, this function computes
 * the TEIRangeSelector corresponding to that range.
 */
export const rangeToTEIRangeSelector = (selector: TextSelector): TEIRangeSelector => {
  const { range } = selector;

  // XPath segments for Range start and end nodes as a list
  const startPathSegments: string[] = getXPath(range.startContainer);
  const endPathSegments: string[] = getXPath(range.endContainer);

  // TEI XPath expressions
  const { start, end } = toTEIXPaths(startPathSegments, endPathSegments, range);

  return {
    start: selector.start,
    startSelector: {
      type: 'XPathSelector',
      value: start
    },
    end: selector.end,
    endSelector: {
      type: 'XPathSelector',
      value: end
    },
    quote: selector.quote.replace(/\s+/g, ' '),
    range
  };
}

export const textToTEITarget =  (container: HTMLElement) => (t: TextAnnotationTarget): TEIAnnotationTarget => {
  const target = reviveTarget(t, container);
  return {
    ...t,
    selector: target.selector.map(rangeToTEIRangeSelector)
  }
}

export const textToTEIAnnotation = (container: HTMLElement) => (a: TextAnnotation): TEIAnnotation => ({
  ...a,
  target: textToTEITarget(container)(a.target)
})

