<script lang="ts">
  import type { TextAnnotation } from '@/model';
  import { onMount } from 'svelte';
  import type { TextAnnotationStore } from '../state';

  export let container: HTMLElement;

  export let store: TextAnnotationStore;

  let canvas: HTMLCanvasElement;

  let width = container.offsetWidth;

  let height = container.offsetHeight;

  let highlights: TextAnnotation[] = [];

  const reviveRange = (annotation: TextAnnotation): TextAnnotation => {
    const { quote, start, end } = annotation.target.selector;

    const iterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT);

    let runningOffset = 0;

    let range = document.createRange();

    let n = iterator.nextNode();

    // Set start
    while (n !== null) {
      const len = n.textContent.length;

      if (runningOffset + len > start) {
        range.setStart(n, start - runningOffset);
        break;
      }

      runningOffset += len;

      n = iterator.nextNode();
    }

    while (n !== null) {
      const len = n.textContent.length;

      if (runningOffset + len > end) {
        range.setEnd(n, end - runningOffset);
        break;
      }

      runningOffset += len;
      n = iterator.nextNode();
    }

    return {
      ...annotation,
      target: {
        ...annotation.target,
        selector: { quote, start, end, range }
      }
    }
  }

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
          Array.from(selector.range.getClientRects()).forEach(rect => {
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(0, 128, 255, 0.2)';

    const offset = container.getBoundingClientRect();

    const { created, updated, deleted } = event.changes;

    console.log('store change', created, updated, deleted);

    created.forEach(annotation => {
      console.log('Created!')
      const revived = reviveRange(annotation);
      highlights.push(revived);
    });

    updated.forEach(({ oldValue, newValue }) => {
      highlights = highlights.map(annotation => 
        annotation.id === newValue.id ? 
          reviveRange(newValue) : annotation);
    });

    console.log('redrawing annotations', highlights);

    // Just a hack for now
    highlights.forEach(annotation => {
      Array.from(annotation.target.selector.range.getClientRects()).forEach(rect => {
        const { x, y, width, height } = rect;
        context.fillRect(x - offset.x, y - offset.y - 2.5, width, height + 5);
      });
    });
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