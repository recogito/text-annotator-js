export const isOutsideContainer = (container: Node, node: Node): boolean => {
  return !container.contains(node);
}