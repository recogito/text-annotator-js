export * from './tei';
export * from './hooks';
export * from './TextAnnotator';
export * from './TextAnnotationPopup';
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
  UserSelectActionExpression,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget
} from '@annotorious/core';

export {
  createBody,
  Origin,
  UserSelectAction
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

export {
  W3CTextFormat
} from '@recogito/text-annotator';

export type {
  RecogitoTEIAnnotator,
  TEIAnnotation,
  TEIAnnotationTarget,
  TEIRangeSelector
} from '@recogito/text-annotator-tei';
