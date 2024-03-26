export * from './tei';
export * from './TextAnnotator';
export * from './TextAnnotatorPopup';

// Re-export essential Types for convenience
export type {
  AnnotoriousPlugin
} from '@annotorious/react';

export type { 
  TextAnnotation,
  TextAnnotator as RecogitoTextAnnotator
} from '@recogito/text-annotator';
