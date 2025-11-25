import type { TextAnnotator } from '@recogito/text-annotator';
import type { PresenceProvider } from '@annotorious/core';
import type { PresenceLayerOptions } from './presence-layer-options';
import { createPresenceLayer } from './presence-layer';

export const mountPlugin = (anno: TextAnnotator, opts: PresenceLayerOptions) => {

  const layer = createPresenceLayer(anno, opts);

  // Monkey-patch the annotator, to make the API Annotorious-/legacy compatible 
  const _destroy = anno.destroy;
  anno.destroy = () => {
    layer.destroy();
    _destroy();
  }

  anno.setPresenceProvider = (provider: PresenceProvider) => {
    layer.setProvider(provider);
  }
  
  return layer;
}

export * from './presence-layer';
export * from './presence-layer-options';