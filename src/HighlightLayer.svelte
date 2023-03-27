<script lang="ts">
  import { onMount } from 'svelte';
  import type { TextAnnotationStore } from './state';

  export let container: HTMLElement;

  export let store: TextAnnotationStore;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    container.classList.add('r6o-annotatable');
  });

  store.observe(event => {
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 128, 255, 0.3)';

    const offset = container.getBoundingClientRect();


    const { created, updated, deleted } = event.changes;

    console.log('store change', created, updated, deleted);

    created.forEach(annotation => {
      const { selector } = annotation.target;

      // Just a hack for now
      Array.from(selector.getClientRects()).forEach(rect => {
        const { x, y, width, height } = rect;
        context.fillRect(x - offset.x, y - offset.y, width, height);
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
  width={container.offsetWidth}
  height={container.offsetHeight} />

<style>
  :global(.r6o-annotatable, .r6o-annotatable *) {
    position: relative;
  }

  :global(.r6o-annotatable ::selection) {
    background-color: transparent;
  }

  .r6o-annotation-canvas {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
</style>