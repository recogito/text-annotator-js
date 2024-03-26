import { AnnotatorPlugin, AnnotoriousPlugin } from '@annotorious/react';
import type { TextAnnotator } from '@recogito/text-annotator';

export type TextAnnotatorPlugin<T extends unknown = TextAnnotator> = AnnotatorPlugin<T>;
export { AnnotoriousPlugin as TextAnnotatorPlugin }
