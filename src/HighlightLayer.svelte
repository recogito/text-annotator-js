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
    const { created, updated, deleted } = event.changes;

    console.log('store change', created, updated, deleted);
    
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

  .r6o-annotation-canvas {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
</style>