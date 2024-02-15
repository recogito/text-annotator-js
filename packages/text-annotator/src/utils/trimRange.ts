export const trimRange = (range: Range): Range => {
  const { startContainer, endContainer } = range;

  const isTextRange = 
    startContainer.nodeType === Node.TEXT_NODE && 
    endContainer.nodeType === Node.TEXT_NODE;

  if (isTextRange)
    return range;

  if (startContainer.nodeType !== Node.TEXT_NODE) {
    const nextContainer = startContainer.nextSibling || startContainer.parentNode;
          
    // Get first text child in next container
    const nextText = nextContainer?.nodeType === Node.TEXT_NODE ?
      nextContainer :
      Array.from(nextContainer!.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).shift();

    range.setEnd(nextText!, 0);
  }

  if (endContainer.nodeType !== Node.TEXT_NODE) {
    const prevContainer = endContainer.previousSibling || endContainer.parentNode;
         
    // Get last text child in previous container
    const prevText = prevContainer?.nodeType === Node.TEXT_NODE ?
      prevContainer :
      Array.from(prevContainer!.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).pop();

    range.setEnd(prevText!, prevText?.textContent?.length || 0);
  }

  return range;
}
