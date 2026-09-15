import { Highlight, TextSelector, TextSelectorLike } from '@recogito/text-annotator';
import { TEIRangeSelector } from '@recogito/text-annotator-tei';

/**
 * Highlights in a group all start at the same position.
 * Internally, they are grouped by whether they also 
 * end at the same position;
 * 
 * TODO eventually, this will have to be based
 * on selectors rather than highlights!
 */
export type HighlightGroup = {

  start: number;

  subgroups: {

    end: number;

    highlights: Highlight[];

  }[];

}

/** TEMPORARY **/
export const isTextSelector = (selector: TextSelectorLike): selector is TextSelector =>
  'start' in selector && 'end' in selector; 

export const isTEIRangeSelector = (selector: TextSelectorLike): selector is TEIRangeSelector =>
  'position' in selector && (selector as TEIRangeSelector).startSelector?.type === 'XPathSelector' && (selector as TEIRangeSelector).endSelector?.type === 'XPathSelector';

export const groupByPosition = (highlights: Highlight[]): HighlightGroup[] => {
  const groupedByPosition = new Map<any, Map<number, Highlight[]>>(); 

  highlights.forEach(highlight => {
    const selectors = highlight.annotation.target.selector;

    selectors.forEach(selector => {
      if (isTEIRangeSelector(selector)) {
        const startingHere = groupedByPosition.get(selector.position) || new Map<any, Highlight[]>();
        const startingAndEndingHere = startingHere.get(selector.quote.length) || [];

        startingAndEndingHere.push(highlight);

        startingHere.set(selector.quote.length, startingAndEndingHere);

        groupedByPosition.set(selector.position, startingHere);
      } else if (isTextSelector(selector)) {
        const startingHere = groupedByPosition.get(selector.start) || new Map<number, Highlight[]>();
        const startingAndEndingHere = startingHere.get(selector.end) || [];

        startingAndEndingHere.push(highlight);
        startingHere.set(selector.end, startingAndEndingHere);

        groupedByPosition.set(selector.start, startingHere);
      }
    });
  });

  return [...groupedByPosition.entries()].map(([start, startingHere]) => ({
    start,
    subgroups: [...startingHere.entries()].map(([end, highlights]) => ({
      end,
      highlights
    }))
  } as HighlightGroup));
}