export * from './tei';
export * from './TextAnnotator';
export * from './TextAnnotatorPopup';

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

import { 
  createBody as _createBody,
  Origin as _Origin,
  PointerSelectAction as _PointerSelectAction
} from '@annotorious/core'; 

export const PointerSelectAction = _PointerSelectAction;
export const createBody = _createBody;
export const Origin = _Origin;

// Essential re-exports from @annotorious/react
export {
 AnnotoriousPlugin
} from '@annotorious/react';

export type { 
  TextAnnotation,
  TextAnnotationTarget,
  TextAnnotator as RecogitoTextAnnotator,
  TextSelector
} from '@recogito/text-annotator';
