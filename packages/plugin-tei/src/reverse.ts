import type { TEIRangeSelector } from './TEIAnnotation';

const xpathToRange = (path: string, container: Element) => {
  const offsetIdx = path.indexOf('::');

  // CETEIcean-specific: prefix all path elements with 'tei-'!
  const normalized = 
    path.substring(0, offsetIdx).replace(/\/([^[/]+)/g, (_, p1) => {
      return "/tei-" + p1.toLowerCase();
    }).replace(/xml:/g, '');

  const parentNode = document.evaluate('.' + normalized,
    container, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (parentNode.firstChild.nodeType !== Node.TEXT_NODE)
    console.warn('XPath not pointing to text node', path);

  const node = parentNode.firstChild;

  const offset = parseInt(path.substring(offsetIdx + 2));

  return { node, offset };
}

export const teiSelectorToRange = (selector: TEIRangeSelector, container: Element) => {
  const start = xpathToRange(selector.startSelector.value, container);
  const end = xpathToRange(selector.endSelector.value, container)
  
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);

  return range;
}
