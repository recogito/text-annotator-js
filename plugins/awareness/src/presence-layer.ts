import type { Color, PresentUser } from '@annotorious/core';
import { TextAnnotator } from '@recogito/text-annotator';
import { PresenceLayerOptions } from './presence-layer-options';

import styles from './presence-layer.module.css';

const createCanvas = () => {
  const canvas = document.createElement('canvas');

  canvas.width = 2 * window.innerWidth;
  canvas.height = 2 * window.innerHeight;
  canvas.className = `${styles.container} r6o-presence-layer`;

  const context = canvas.getContext('2d');
  context.scale(2, 2);
  context.translate(0.5, 0.5);

  return canvas;
}

export const createPresenceLayer = (
  anno: TextAnnotator,
  opts: PresenceLayerOptions
)  => {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  document.body.appendChild(canvas);

  const trackedAnnotations = new Map<string, PresentUser>();

  const getAnnotationsForUser = (p: PresentUser) =>
    Array.from(trackedAnnotations.entries())
      .filter(([_, user]) => user.presenceKey === p.presenceKey)
      .map(([id, _]) => id);

  opts.provider.on('selectionChange', (p: PresentUser, selection: string[] | null) => {
    // Remove this user's previous selection
    const currentIds = getAnnotationsForUser(p);

    currentIds.forEach(id => {
      trackedAnnotations.delete(id);
      anno.setStyle(undefined, id);
    });

    // Set new selection (if any)
    if (selection)
      selection.forEach(id => { 
        trackedAnnotations.set(id, p);
        anno.setStyle({ fill: p.appearance.color as Color }, id);
      });
  });  

  const clear = () => {
    const { width, height } = canvas;
    ctx.clearRect(-0.5, -0.5, width + 1, height + 1);
  }

  anno.renderer.on('onRedraw', () => redraw());

  const redraw = () => {
    clear();

    const viewportBounds = anno.element.getBoundingClientRect();

    trackedAnnotations.entries().forEach(([id, user]) => {
      const rects = anno.state.store.getAnnotationRects(id);

      // Draw cursor + label to the presence canvas
      const { height } = rects[0];
      const x = rects[0].x + viewportBounds.left;
      const y = rects[0].y + viewportBounds.top;

      // Draw presence indicator
      ctx.fillStyle = user.appearance.color;
      ctx.fillRect(x - 2, y - 2.5, 2, height + 5);

      // Draw name label
      const metrics = ctx.measureText(user.appearance.label);
      const labelWidth = metrics.width + 6;
      const labelHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
      
      // Sigh... different between FF and Chrome
      const paddingBottom = metrics.fontBoundingBoxAscent ? 8 : 6.5;

      ctx.fillRect(x - 2, y - 2.5 - labelHeight, labelWidth, labelHeight);
      
      ctx.fillStyle = '#fff';
      ctx.fillText(user.appearance.label, x + 1, y - paddingBottom);
    });
  }
  
  const reset = () => {
    canvas.width = 2 * window.innerWidth;
    canvas.height = 2 * window.innerHeight;

    // Note that resizing the canvas resets the context
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }

  // Refresh on resize
  const onResize = () => {
    reset();
    redraw();
  }

  window.addEventListener('resize', onResize);

  const destroy = () => {
    canvas.remove();
    window.removeEventListener('resize', onResize);
  }

  return {
    clear,
    destroy,
    reset
  }
  
}