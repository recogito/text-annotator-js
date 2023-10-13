export * from './highlight';
export * from './model';
export * from './state';
export * from './presence/PresencePainterOptions';
export * from './TextAnnotator';
export * from './TextAnnotatorOptions';

// Re-export essentials from @annotorious/core utilities for convenience
export * from '@annotorious/core/src/model';

import {   
  Origin as _Origin,
} from '@annotorious/core/src/state';

export const Origin = _Origin;