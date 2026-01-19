import type { Filter, User } from '@annotorious/core';
import type { HighlightStyleExpression } from './highlight';
import type { TextAnnotation } from './model';
import { createTextAnnotator, type TextAnnotator, type AnnotatingMode } from './TextAnnotator';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';

export interface TextAnnotatorCallbackProps<
  I extends TextAnnotation = TextAnnotation,
  E extends unknown = TextAnnotation
> {
  // Container element
  container: HTMLElement;

  // Initial data
  annotations?: I[];

  // Callbacks (synchronously called when internal state changes)
  onAnnotationCreate?: (annotation: E) => void;
  onAnnotationUpdate?: (annotation: E, previous: E) => void;
  onAnnotationDelete?: (annotation: E) => void;
  onSelect?: (annotations: E[]) => void;
  onClick?: (annotation: E, event: PointerEvent) => void;
  onMouseEnter?: (annotation: E) => void;
  onMouseLeave?: (annotation: E) => void;

  // Configuration (passed through to createTextAnnotator)
  filter?: Filter<I>;
  style?: HighlightStyleExpression;
  annotatingEnabled?: boolean;
  annotatingMode?: AnnotatingMode;
  user?: User;
}

export interface TextAnnotatorWithCallbacks<
  I extends TextAnnotation = TextAnnotation,
  E extends unknown = TextAnnotation
> extends TextAnnotator<I, E> {
  // Additional method for external state management
  setAnnotations(annotations: I[]): void;
}

export const createTextAnnotatorWithCallbacks = <
  I extends TextAnnotation = TextAnnotation,
  E extends unknown = TextAnnotation
>(
  props: TextAnnotatorCallbackProps<I, E>
): TextAnnotatorWithCallbacks<I, E> => {
  const options: TextAnnotatorOptions<I, E> = {
    annotatingEnabled: props.annotatingEnabled,
    style: props.style,
    user: props.user
  };

  // Create the standard text annotator
  const annotator = createTextAnnotator<I, E>(props.container, options);

  // Set filter if provided
  if (props.filter) {
    annotator.setFilter(props.filter);
  }

  // Set annotating mode if provided
  if (props.annotatingMode) {
    annotator.setAnnotatingMode(props.annotatingMode);
  }

  // Load initial annotations if provided
  if (props.annotations && props.annotations.length > 0) {
    annotator.addAnnotation(props.annotations);
  }

  // Wire lifecycle events to callbacks
  if (props.onAnnotationCreate) {
    annotator.on('createAnnotation', props.onAnnotationCreate);
  }

  if (props.onAnnotationUpdate) {
    annotator.on('updateAnnotation', props.onAnnotationUpdate);
  }

  if (props.onAnnotationDelete) {
    annotator.on('deleteAnnotation', props.onAnnotationDelete);
  }

  if (props.onSelect) {
    annotator.on('selectionChanged', props.onSelect);
  }

  if (props.onClick) {
    annotator.on('clickAnnotation', props.onClick);
  }

  if (props.onMouseEnter) {
    annotator.on('mouseEnterAnnotation', props.onMouseEnter);
  }

  if (props.onMouseLeave) {
    annotator.on('mouseLeaveAnnotation', props.onMouseLeave);
  }

  // Add setAnnotations method for external state sync
  const setAnnotations = (annotations: I[]) => {
    annotator.clearAnnotations();
    if (annotations.length > 0) {
      annotator.addAnnotation(annotations);
    }
  };

  return {
    ...annotator,
    setAnnotations
  };
};
