/**
 * Need to manually iterate over the cloned node's children
 * to check if the target node is contained within.
 * Unfortunately, we cannot use `.contains` method,
 * because the cloned node is detached from the DOM.
 */
const clonedNodeContains = (clonedNode: Node, targetNode: Node) => {
  if (clonedNode.isEqualNode(targetNode)) {
    return true;
  }

  for (let child of clonedNode.childNodes) {
    if (clonedNodeContains(child, targetNode)) {
      return true;
    }
  }

  return false;
};

export const rangeContains = <T extends Node>(range: Range, node: T) => {
  const rangeContents = range.cloneContents();
  return clonedNodeContains(rangeContents, node);
};
