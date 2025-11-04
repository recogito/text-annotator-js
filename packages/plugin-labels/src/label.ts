import { TextAnnotation } from '@recogito/text-annotator';

export interface Label {

  key: string;

  annotations: TextAnnotation[];

  destroy(): void;

}