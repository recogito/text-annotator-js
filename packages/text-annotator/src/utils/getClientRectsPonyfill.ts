/**
 * Wraps a DOM range CLEVERLY! If the range spans multiple
 * elements, it's broken apart appropriately, and each segment
 * is wrapped 
 */
const wrapRange = (range: Range) => {
  const {
    commonAncestorContainer,
    startContainer,
    startOffset,
    endContainer,
    endOffset
  } = range;

  const originalChildren = commonAncestorContainer.childNodes;

  // Function to reverse the wrapping operation
  const unwrap = () =>
    (commonAncestorContainer as Element).replaceChildren(...originalChildren);

  // Shorthand
  const surround = (range: Range) => {
    const wrapper = document.createElement('SPAN');
    range.surroundContents(wrapper);
    return wrapper;
  };

  if (startContainer === endContainer) {
    // Trivial case
    return { unwrap, nodes: [surround(range)] };
  } else {
    // Not-so-trivial case - we need to break the range 
    // apart and create sub-ranges for each segment

    // Start by wrapping text segments in start and end nodes
    const startRange = document.createRange();
    startRange.selectNodeContents(startContainer);
    startRange.setStart(startContainer, startOffset);
    const startNode = surround(startRange);

    const endRange = document.createRange();
    endRange.selectNode(endContainer);
    endRange.setEnd(endContainer, endOffset);
    const endNode = surround(endRange);

    // And wrap nodes in between, if any
    const textNodesBetween = getTextNodesBetween(range);

    const innerNodes = textNodesBetween.reverse().map(node => {
      const wrapper = document.createElement('SPAN');
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
      return wrapper;
    });

    return { unwrap, nodes: [startNode, ...innerNodes, endNode] };
  }

}

/**
 * Returns a list of all text nodes between the start
 * and end node of the range. Start and end node themselves 
 * are NOT INCLUDED!
 */
const getTextNodesBetween = (range: Range): Node[] => {
  const { 
    commonAncestorContainer, 
    startContainer, 
    endContainer 
  } = range;

  const ni = document.createNodeIterator(commonAncestorContainer, NodeFilter.SHOW_TEXT);

  let n = ni.nextNode();

  let take = false;
  
  const nodesBetween: Node[] = [];

  while (n != null) {
    if (n === endContainer)
      take = false;

    if (take)
      nodesBetween.push(n);

    if (n === startContainer)
      take = true;

    n = ni.nextNode()
  }

  return nodesBetween;
}

export const getClientRectsPonyfill = (range: Range) => {
  const { startContainer, endContainer } = range;

  if (startContainer === endContainer) {
    return Array.from(range.getClientRects());
  } else {
    const { unwrap, nodes } = wrapRange(range);

    const rects = nodes.reduce((rects, node) => {
      return [...rects, ...node.getClientRects()];
    }, [] as DOMRect[]);
  
    unwrap();
    
    return rects;
  }
}