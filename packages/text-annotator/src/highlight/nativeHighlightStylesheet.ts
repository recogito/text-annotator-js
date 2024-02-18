import type { DrawingStyle } from '@annotorious/core';
import { colord } from 'colord';
import type { TextAnnotation } from '../model';

const DEFAULT_STYLE: DrawingStyle = { fill: 'rgb(0, 128, 255)', fillOpacity: 0.18 };

const DEFAULT_SELECTED_STYLE: DrawingStyle = { fill: 'rgb(0, 128, 255)', fillOpacity: 0.45 };

const toCSS = (s: DrawingStyle) => {
  const backgroundColor = colord(s.fill || DEFAULT_STYLE.fill).alpha(s.fillOpacity || DEFAULT_STYLE.fillOpacity).toHex();
  return `background-color: ${backgroundColor};`
}

export const createStylesheet = () => {

  const elem = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(elem);

  let rendered = new Set<string>();

  const refresh = (
    annotations: TextAnnotation[], 
    selected: string[], 
    currentStyle: DrawingStyle | ((annotation: TextAnnotation, selected: boolean) => DrawingStyle)
  ) => {
    const css = annotations.map(annotation => {
      const isSelected = selected.includes(annotation.id);

      const style = currentStyle 
        ? typeof currentStyle === 'function' 
          ? currentStyle(annotation, isSelected) 
          : currentStyle 
        : isSelected ? DEFAULT_SELECTED_STYLE : DEFAULT_STYLE;

      return `::highlight(_${annotation.id}) { ${toCSS(style)} }`;
    });

    elem.innerHTML = css.join('\n');

    // Remove rendered
    // @ts-ignore
    // Array.from(rendered).forEach(id => CSS.highlights.delete(`_${id}`));

    annotations.forEach(annotation => {
      // Just a hack - create highlights for all Created text ranges
      // @ts-ignore
      const highlight = new Highlight(annotation.target.selector.range);

      // @ts-ignore
      CSS.highlights.set(`_${annotation.id}`, highlight);
    });
  }

  return {
    refresh
  }

}