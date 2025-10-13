export const getHighlightClientRects = (range: Range) => {
  const textNodes: Text[] = [];

  // Get all text nodes inside the range's commonAncestorContainer
  const it = document.createNodeIterator(
    range.commonAncestorContainer, 
    NodeFilter.SHOW_TEXT);

  /*
   Filter text nodes that intersect the range. Note that we could
   also include this filter in the node iterator directly.
   But the while loop is faster (!) - possibly due to a function call overhead.
  */
  let currentNode: Text | undefined;
 
  while ((currentNode = it.nextNode() as Text)) {
    if (range.intersectsNode(currentNode)) {
      textNodes.push(currentNode);
    }
  }

  if (textNodes.length < 2) {
    // Trivial case: selection is inside a single text node
    // or empty (shouldn't happen!) - no need to create our own ranges.
    return Array.from(range.getClientRects());
  } else {
    const first = textNodes[0];
    const last = textNodes[textNodes.length - 1];

    const firstRange = document.createRange();
    firstRange.selectNode(first);
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      firstRange.setStart(first, range.startOffset);
    } else {
      const childNode = range.startContainer.childNodes[range.startOffset];
      if (childNode) {
        firstRange.setStartBefore(childNode);
      } else {
        firstRange.setStartAfter(range.startContainer);
      }
    }

    const lastRange = document.createRange();
    lastRange.selectNode(last);
    if (range.endContainer.nodeType === Node.TEXT_NODE) {
      lastRange.setEnd(last, range.endOffset);
    } else {
      const childNode = range.endContainer.childNodes[range.endOffset];
      if (childNode)
        lastRange.setEndBefore(childNode);
      else 
        lastRange.setEndAfter(range.endContainer);
    }

    // Text nodes have no .getClientRects()!
    const getTextClientRects = (t: Text) => {
      const r = document.createRange();
      r.selectNode(t);
      return Array.from(r.getClientRects());
    }

    return [
      ...Array.from(firstRange.getClientRects()),
      ...textNodes.slice(1, -1).flatMap(getTextClientRects),
      ...Array.from(lastRange.getClientRects())
    ];
  }
}
