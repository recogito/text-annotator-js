export const whitespaceOrEmptyRegex = /^\s*$/;

export const isRangeWhitespaceOrEmpty = (range: Range): boolean => whitespaceOrEmptyRegex.test(range.toString())

export const isNodeWhitespaceOrEmpty = (node: Node): boolean => whitespaceOrEmptyRegex.test(node.textContent || '')
