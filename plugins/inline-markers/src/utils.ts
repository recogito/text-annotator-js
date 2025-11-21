import { Highlight } from '@recogito/text-annotator';

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

export const groupByPosition = (highlights: Highlight[]): HighlightGroup[] => {
  const groupedByPosition = new Map<number, Map<number, Highlight[]>>(); 

  highlights.forEach(highlight => {
    const selectors = highlight.annotation.target.selector;

    selectors.forEach(selector => {
      const startingHere = groupedByPosition.get(selector.start) || new Map<number, Highlight[]>();
      const startingAndEndingHere = startingHere.get(selector.end) || [];

      startingAndEndingHere.push(highlight);
      startingHere.set(selector.end, startingAndEndingHere);

      groupedByPosition.set(selector.start, startingHere);
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