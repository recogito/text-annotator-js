export * from './highlight';
export * from './model';
export * from './state';
export * from './utils';
export * from './presence/PresencePainterOptions';
export * from './TextAnnotator';
export * from './TextAnnotatorOptions';

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
