import type { ViewportState } from '@annotorious/core';
import { colord } from 'colord';
import type { HighlightPainter } from '../HighlightPainter';
import type { TextAnnotatorState } from 'src/state';
import type { ViewportBounds } from '../viewport';
import { DEFAULT_SELECTED_STYLE, DEFAULT_STYLE, HighlightStyle, HighlightStyleExpression } from '../HighlightStyle';
import { RendererImplementation, createBaseRenderer } from '../baseRenderer';
import type { Highlight } from '../Highlight';

const toCSS = (s?: HighlightStyle) => {
  const backgroundColor = colord(s?.fill || DEFAULT_STYLE.fill)
    .alpha(s?.fillOpacity === undefined ? DEFAULT_STYLE.fillOpacity : s.fillOpacity)
    .toHex();

  const rules = [
    `background-color:${backgroundColor}`,
    s?.underlineThickness ? `text-decoration:underline` : undefined,
    s?.underlineColor ? `text-decoration-color:${s.underlineColor}` : undefined,
    s?.underlineOffset ? `text-underline-offset:${s.underlineOffset}px` : undefined,
    s?.underlineThickness ? `text-decoration-thickness:${s.underlineThickness}px` : undefined
  ].filter(Boolean);

  return rules.join(';');
};

export const createRenderer = (): RendererImplementation => {
  const elem = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(elem);

  let currentRendered = new Set<string>();

  const redraw = (
    highlights: Highlight[],
    viewportBounds: ViewportBounds,
    currentStyle?: HighlightStyleExpression,
    painter?: HighlightPainter
  ) => {
    if (painter)
      painter.clear();

    // Next set of rendered annotation IDs and selections
    const nextRendered = new Set(highlights.map(h => h.annotation.id));

    // Annotations currently in this stylesheet that no longer need rendering
    const toRemove = Array.from(currentRendered).filter(id => !nextRendered.has(id));

    // For simplicity, re-generate the whole stylesheet
    const updatedCSS = highlights.map(h => {
      const base = currentStyle
        ? typeof currentStyle === 'function'
          ? currentStyle(h.annotation, h.state)
          : currentStyle
        : h.state?.selected ? DEFAULT_SELECTED_STYLE : DEFAULT_STYLE;

      // Trigger the custom painter (if any) as a side-effect
      const style = painter ? painter.paint(h, viewportBounds) || base : base;

      return `::highlight(_${h.annotation.id}) { ${toCSS(style)} }`;
    });

    elem.innerHTML = updatedCSS.join('\n');

    // After we have the styles, we need to update the Highlights.
    // Note that the (experimental) CSS Custom Highlight API is not yet
    // available in TypeScript!

    // @ts-ignore
    CSS.highlights.clear();
    // toRemove.forEach(id => CSS.highlights.delete(`_${id}`));

    // Could be improved further by (re-)setting only annotations that
    // have changes.
    highlights.forEach(({ annotation }) => {
      const ranges = annotation.target.selector.map(s => s.range);

      // @ts-ignore
      const highlights = new Highlight(...ranges);

      // @ts-ignore
      CSS.highlights.set(`_${annotation.id}`, highlights);
    });

    currentRendered = nextRendered;
  };

  const setVisible = (visible: boolean) => {
    console.log('setVisible not implemented on CSS Custom Highlights renderer');
  };

  const destroy = () => {
    // Clear all highlights from the Highlight Registry
    // @ts-ignore
    CSS.highlights.clear();

    // Remove the stylesheet
    elem.remove();
  };

  return {
    destroy,
    setVisible,
    redraw
  };

};

export const createHighlightsRenderer = (
  container: HTMLElement,
  state: TextAnnotatorState,
  viewport: ViewportState
) => createBaseRenderer(container, state, viewport, createRenderer());
