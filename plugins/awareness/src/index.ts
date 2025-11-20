import { TextAnnotator } from '@recogito/text-annotator';
import { createPresenceLayer } from './presence-layer';
import { PresenceLayerOptions } from './presence-layer-options';

export const mountPlugin = (anno: TextAnnotator, opts: PresenceLayerOptions) =>
  createPresenceLayer(anno, opts);

export * from './presence-layer';
export * from './presence-layer-options';