import type { TextSelector } from '@recogito/text-annotator';
import type { TEIRangeSelector } from './TEIAnnotation';

const getXPath = (node: Node, path: string[] = []) => {
  let xpath: string;
  let count: number;
  let predicate: string;

  if (node.nodeType == Node.ELEMENT_NODE && (node as Element).hasAttribute('xml:id')) {
    path.push('/');
  } else if (node.parentNode) {
    path = getXPath(node.parentNode, path);
  }

  if (node.nodeType == Node.ELEMENT_NODE && node.nodeName.toLowerCase().startsWith("tei-")) {
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

const toTEIPaths = (container: Element, startPath: string[], endPath: string[], selectedRange: Range) => {
  const pathStart = `${container.nodeName.toLowerCase()}[@id='${container.id}']`;

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

export const rangeToXPathRangeSelector = (container: Element, selector: TextSelector): TEIRangeSelector => {
  const { range } = selector;

  const startDOMPath = getXPath(range.startContainer);
  const endDOMPath = getXPath(range.endContainer);

  const { start, end } = toTEIPaths(container, startDOMPath, endDOMPath, range);

  return {
    type: 'RangeSelector',
    startSelector: {
      type: 'XPathSelector',
      value: start
    },
    endSelector: {
      type: 'XPathSelector',
      value: end
    },
    quote: selector.quote,
    range
  };
}