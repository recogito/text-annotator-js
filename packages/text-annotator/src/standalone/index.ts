// Core components
export { createSelectionHandler } from './SelectionHandler';
export type {
  SelectionHandler,
  SelectionHandlerOptions,
  AnnotatingMode,
  DismissOnNotAnnotatable
} from './SelectionHandler';

export { createBaseRenderer } from './Renderer';
export type {
  Renderer,
  RendererFactory,
  RendererImplementation
} from './Renderer';

// Proxies
export * from './proxies';

// Types
export * from './types';

// Model
export * from './model';

// Highlight types
export * from './highlight';

// Utils (selective exports for common needs)
export {
  debounce,
  isMac,
  isNotAnnotatable,
  isRangeAnnotatable,
  NOT_ANNOTATABLE_CLASS,
  NOT_ANNOTATABLE_SELECTOR
} from './utils';
