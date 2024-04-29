export * from './tei';
export * from './TextAnnotator';
export * from './TextAnnotatorPopup';
export * from './TextAnnotatorPlugin';

// Essential re-exports from @annotorious/core
export type {
  Annotation,
  AnnotationBody,
  AnnotationTarget,
  Annotator,
  AnnotatorState,
  Color,
  Filter,
  FormatAdapter,
  HoverState,
  Selection,
  SelectionState,
  Store,
  StoreChangeEvent,
  StoreObserver,
  ParseResult,
  User,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget
} from '@annotorious/core';

export {
  createBody,
  Origin,
  PointerSelectAction
} from '@annotorious/core';

// Essential re-exports from @annotorious/react
export {
 AnnotoriousPlugin
} from '@annotorious/react';

export type { 
  HighlightStyle,
  HighlightStyleExpression,
  TextAnnotation,
  TextAnnotationTarget,
  TextSelector,
  W3CTextAnnotation,
  W3CTextAnnotationTarget,
  W3CTextSelector,
  W3CAnnotationStylesheet,
  TextAnnotator as RecogitoTextAnnotator,
  TextAnnotationStore
} from '@recogito/text-annotator';
