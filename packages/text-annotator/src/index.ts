export * from './rendering';
export * from './model';
export * from './state';
export * from './utils/annotation';
export * from './utils/dom';
export * from './utils/events';
export * from './utils/highlight';
export * from './selection-handler';
export * from './text-annotator';
export * from './text-annotator-options';

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
  ViewportState,
  W3CAnnotation,
  W3CAnnotationBody,
  W3CAnnotationTarget
} from '@annotorious/core';

export {
  createBody,
  Origin,
  UserSelectAction
} from '@annotorious/core';
