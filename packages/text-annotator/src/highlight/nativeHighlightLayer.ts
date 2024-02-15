import type { DrawingStyle, Filter, StoreChangeEvent, ViewportState } from '@annotorious/core';
import type { TextAnnotatorState } from '../state';
import type { TextAnnotation } from 'src/model';
import type { HighlightPainter } from './HighlightPainter';

export const createHighlightLayer = (
  container: HTMLElement, 
  state: TextAnnotatorState,
  viewport: ViewportState
) => {
  const { store, selection, hover } = state;

  let currentStyle: DrawingStyle | ((annotation: TextAnnotation, selected?: boolean) => DrawingStyle) | undefined;

  let currentFilter: Filter | undefined;

  const stylesheet = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(stylesheet);

  const onPointerMove = (event: PointerEvent) => {
    const {x, y} = container.getBoundingClientRect();

    const hit = store.getAt(event.clientX - x, event.clientY - y);
    const isVisibleHit = hit && (!currentFilter || currentFilter(hit));

    if (isVisibleHit) {
      if (hover.current !== hit.id) {
        container.classList.add('hovered');
        hover.set(hit.id);
      }
    } else {
      if (hover.current) {
        container.classList.remove('hovered');
        hover.set(null);
      }
    }
  }

  const redraw = () => {
    // TODO
  }

  const setDrawingStyle = (style: DrawingStyle | ((a: TextAnnotation, selected?: boolean) => DrawingStyle)) => {
    // TODO
  }

  const setFilter = (filter?: Filter) => {
    // TODO
  } 

  const onStoreChange = (event: StoreChangeEvent<TextAnnotation>) =>  {
    const { created, updated } = event.changes;

    created.forEach(annotation => {
      // Just a hack - create highlights for all Created text ranges
      // @ts-ignore
      const highlight = new Highlight(annotation.target.selector.range);

      stylesheet.innerHTML += `::highlight(_${annotation.id}) { background-color: red; }\n`;

      // @ts-ignore
      CSS.highlights.set(`_${annotation.id}`, highlight);
    });

    updated.forEach(({ newValue }) => {
      // @ts-ignore
      const highlight = new Highlight(newValue.target.selector.range);

      // @ts-ignore
      CSS.highlights.set(`_${newValue.id}`, highlight);
    });

  };

  store.observe(onStoreChange);

  const destroy = () => {
    // TODO
  }



  return {
    destroy,
    redraw,
    setDrawingStyle,
    setFilter,
    setPainter: (painter: HighlightPainter) => console.log(painter)
  }
}