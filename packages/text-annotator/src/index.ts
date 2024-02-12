export * from './highlight';
export * from './model';
export * from './state';
export * from './utils/reviveAnnotation';
export * from './presence/PresencePainterOptions';
export * from './TextAnnotator';
export * from './TextAnnotatorOptions';

// Essential re-exports from @annotorious/core
export type {
  Filter
} from '@annotorious/core';

import {
  Origin as _Origin,
} from '@annotorious/core';

export { _Origin as Origin };
