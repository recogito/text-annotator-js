import { TextAnnotation } from '@recogito/text-annotator';

export interface Label {

  annotations: TextAnnotation[];

  destroy(): void;

}