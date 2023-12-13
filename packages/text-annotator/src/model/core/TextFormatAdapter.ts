import type { Annotation, FormatAdapter, ParseResult } from '@annotorious/core';

export interface TextFormatAdapter<A extends Annotation, T extends unknown> extends Omit<FormatAdapter<A, T>, 'parse'> {

  /**
   * @param serialized - serialized annotation in W3C WebAnnotation Model format
   * @param container - the HTML container of the annotated content,
   *                    Required to locate the content's `range` within the DOM
   */
  parse(serialized: T, container: HTMLElement): ParseResult<A>;

}
