 /*   // https://www.benpickles.com/articles/51-finding-a-dom-nodes-common-ancestor-using-javascript
    getCommonAncestor : function(node1, node2) {
      var parents = function(node) {
            var nodes = [ node ];
            for (; node; node = node.parentNode) {
              nodes.unshift(node);
            }
            return nodes;
          },

          parents1 = parents(node1),
          parents2 = parents(node2);

      // No common ancestor
      if (parents1[0] !== parents2[0]) return;

      for (var i=0; i<parents1.length; i++) {
        if (parents1[i] !== parents2[i]) return parents1[i - 1];
      }
    },
*/

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

export const rangeToXPathSelector = (container: Element, selectedRange: Range) => {

  const startDOMPath = getXPath(selectedRange.startContainer);
  const endDOMPath = getXPath(selectedRange.endContainer);

  const { start, end } = toTEIPaths(container, startDOMPath, endDOMPath, selectedRange);

  return {
    type: 'RangeSelector',
    startSelector: {
      type: 'XPathSelector',
      value: start
    },
    endSelector: {
      type: 'XPathSelector',
      value: end
    }
  };
};