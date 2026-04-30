export const mergeRanges = (ranges: Range[]): Range[] => {
  if (ranges.length === 0) return [];
  if (ranges.length === 1) return [ranges[0]];

  // Sort by start position
  ranges.sort((a, b) => {
    const cmp = a.compareBoundaryPoints(Range.START_TO_START, b);
    if (cmp !== 0) return cmp;

    // If equal, sort by end position
    return a.compareBoundaryPoints(Range.END_TO_END, b);
  });

  const [first, ...rest] = ranges;

  const result = rest.reduce<{ merged: Range[], current: Range }>((acc, next) => {
    // Check if current and next overlap or are adjacent (current.end >= next.start)
    const comparison = acc.current.compareBoundaryPoints(Range.START_TO_END, next);

    if (comparison >= 0) {
      // Ranges overlap/touch - merge
      const endComparison = acc.current.compareBoundaryPoints(Range.END_TO_END, next);
      if (endComparison < 0) {
        // Next extends beyond current - extend current's end
        acc.current.setEnd(next.endContainer, next.endOffset);
      }

      // Otherwise current already encompasses next, no change needed
      return acc;
    } else {
      // Disjoint - save current and start new range
      acc.merged.push(acc.current);
      acc.current = next.cloneRange();
      return acc;
    }
  }, { merged: [], current: first.cloneRange() });

  return [...result.merged, result.current];
}