import type { DrawingStyle } from '@annotorious/core';
import { colord } from 'colord';
import type { TextAnnotation } from '../../model';
import { DEFAULT_SELECTED_STYLE, DEFAULT_STYLE } from '../defaultStyles';

const toCSS = (s: DrawingStyle) => {
  const backgroundColor = colord(s.fill || DEFAULT_STYLE.fill).alpha(s.fillOpacity || DEFAULT_STYLE.fillOpacity).toHex();
  return `background-color: ${backgroundColor};`
}

const setsEqual = (set1: Set<any>, set2: Set<any>) =>
  set1.size === set2.size && [...set1].every(value => set2.has(value));

export const createHighlights = () => {
  const elem = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(elem);

  let currentRendered = new Set<string>();

  let currentSelected = new Set<string>();

  const refresh = (
    annotations: TextAnnotation[], 
    selected: string[], 
    currentStyle: DrawingStyle | ((annotation: TextAnnotation, selected: boolean) => DrawingStyle)
  ) => {
    // New set of rendered annotation IDs
    const nextRendered = new Set(annotations.map(a => a.id));

    const nextSelected = new Set(selected);

    // New annotations that are not yet in this stylesheet
    const toAdd = annotations.filter(a => !currentRendered.has(a.id));

    // Annotations currently in this stylesheet that should no longer be rendered
    const toRemove = Array.from(currentRendered).filter(id => !nextRendered.has(id));

    const selectionChanged = !setsEqual(currentSelected, nextSelected);

    // if (toAdd.length + toRemove.length === 0 && !selectionChanged)
    //   return; // No change in rendered annotations

    // Change! For simplicity, re-generate the whole stylesheet. It's the
    // DOM insert op that's likely the bottleneck, not the string computation.
    const updatedCSS = annotations.map(annotation => {
      const isSelected = nextSelected.has(annotation.id);

      const style = currentStyle 
        ? typeof currentStyle === 'function' 
          ? currentStyle(annotation, isSelected) 
          : currentStyle 
        : isSelected ? DEFAULT_SELECTED_STYLE : DEFAULT_STYLE;

      return `::highlight(_${annotation.id}) { ${toCSS(style)} }`;
    });

    elem.innerHTML = updatedCSS.join('\n');

    // After we have the styles, we need to update the Highlights.
    // Note that the (experimental) CSS Custom Highlight API is not yet
    // available in TypeScript!

    // @ts-ignore
    toRemove.forEach(id => CSS.highlights.delete(`_${id}`));

    // Could be improved further by (re-)setting only annotations that
    // have changes.
    annotations.forEach(annotation => { 
      const ranges = annotation.target.selector.map(s => s.range);

      // @ts-ignore
      const highlights = new Highlight(...ranges);

      // @ts-ignore
      CSS.highlights.set(`_${annotation.id}`, highlights);
    });

    currentRendered = nextRendered;
    currentSelected = nextSelected;
  }

  const destroy = () => {
    // Clear all highlights from the Highlight Registry
    // @ts-ignore
    CSS.highlights.clear();

    // Remove the stylesheet
    elem.remove();
  }

  return {
    destroy,
    refresh
  }

}