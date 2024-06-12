export const whitespaceOrEmptyRegex = /^\s*$/;

export const isWhitespaceOrEmpty = (range: Range): boolean => whitespaceOrEmptyRegex.test(range.toString())
