export const reanchor = (originalNode: Node, parentNode: Node, originalOffset: number) => {
  let node = originalNode;

  let offset = originalOffset;

  const it = document.createNodeIterator(parentNode, NodeFilter.SHOW_TEXT);

  let currentNode = it.nextNode();

  let run = true;

  do {
    if (currentNode instanceof Text) {
      if (currentNode.length < offset) {
        offset -= currentNode.length;
      } else {
        node = currentNode;
        run = false;
      }
    }

    currentNode = it.nextNode();
  } while (currentNode && run);

  return { node, offset };
};