<script lang="ts">
    import type { TextAnnotation } from '@/model';
  import { onMount } from 'svelte';
  import type { TextAnnotationStore } from '../state';

  export let container: HTMLElement;

  export let store: TextAnnotationStore;

  let canvas: HTMLCanvasElement;

  let width = container.offsetWidth;

  let height = container.offsetHeight;

  const highlights: TextAnnotation[] = [];

  onMount(() => {
    container.classList.add('r6o-annotatable');

    const resizeObserver = new ResizeObserver((entries) => {
      width = container.offsetWidth;
      height = container.offsetHeight;

      const offset = container.getBoundingClientRect();

      highlights.forEach(annotation => {
        const { selector } = annotation.target;

        requestAnimationFrame(() => {
          const context = canvas.getContext('2d');
          context.fillStyle = 'rgba(0, 128, 255, 0.3)';
          
          // Just a hack for now
          Array.from(selector.getClientRects()).forEach(rect => {
            const { x, y, width, height } = rect;
            context.fillRect(x - offset.x, y - offset.y, width, height);
          });
        });
      });
    });

    resizeObserver.observe(container);
  });

  store.observe(event => {
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 128, 255, 0.2)';

    const offset = container.getBoundingClientRect();

    const { created, updated, deleted } = event.changes;

    console.log('store change', created, updated, deleted);

    created.forEach(annotation => {
      const { selector } = annotation.target;

      highlights.push(annotation);
    
      // Just a hack for now
      Array.from(selector.getClientRects()).forEach(rect => {
        const { x, y, width, height } = rect;
        context.fillRect(x - offset.x, y - offset.y - 2.5, width, height + 5);
      });
    });


    /*
    created.forEach(annotation => stage.addAnnotation(annotation));
    updated.forEach(({ oldValue, newValue }) => stage.updateAnnotation(oldValue, newValue));
    deleted.forEach(annotation => stage.removeAnnotation(annotation));
    
    stage.redraw();
    */
  });
</script>

<canvas
  bind:this={canvas} 
  class="r6o-annotation-canvas"
  width={width}
  height={height} />

<style>
  :global(.r6o-annotatable, .r6o-annotatable *) {
    position: relative;
  }

  .r6o-annotation-canvas {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
</style>