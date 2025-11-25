import { serializeW3CBodies } from '@annotorious/core';
import type { FormatAdapter, ParseResult } from '@annotorious/core';
import type { PDFAnnotation } from '../PDFAnnotation';
import type { W3CPDFAnnotation } from './W3CPDFAnnotation';

export type W3CPDFFormatAdapter = FormatAdapter<PDFAnnotation, W3CPDFAnnotation>;

/**
 * @param source - the IRI of the annotated content
 * @param container - the HTML container of the annotated content,
 *                    Required to locate the content's `range` within the DOM
 */
export const W3CTextFormat = (
  source: string
): W3CPDFFormatAdapter => ({
  parse: (serialized) => parseW3CPDFAnnotation(serialized),
  serialize: (annotation) => serializeW3CPDFAnnotation(annotation, source)
});

export const parseW3CPDFAnnotation = <E extends W3CPDFAnnotation = W3CPDFAnnotation>(
  annotation: E
): ParseResult<PDFAnnotation> => {

  // TODO
  throw 'Not implemented';

};

const quadpointsToViewrect = (qp: number[]): number[] => {
  let minX = qp[0];
  let maxX = qp[0];
  let minY = qp[1];
  let maxY = qp[1];
  
  for (let i = 0; i < qp.length; i += 2) {
    const x = qp[i];
    const y = qp[i + 1];
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return [
    minX, // x
    minY, // y
    maxX - minX, // w
    maxY - minY // h
  ]
}

export const serializeW3CPDFAnnotation = <I extends PDFAnnotation = PDFAnnotation, E extends W3CPDFAnnotation = W3CPDFAnnotation>(
  annotation: I,
  source: string
): E => {
  const { bodies, target, ...rest } = annotation;

  const {
    selector,
    creator,
    created,
    updated,
    ...targetRest
  } = target;

  const w3cTargets = selector.map(s => {
    const { id, quote, pageNumber, start, end, quadpoints } = s;

    const w3cSelectors: any = [{
      type: 'TextQuoteSelector',
      exact: quote
    }, {
      type: 'TextPositionSelector',
      start,
      end
    }]
    
    if (quadpoints) {
      const viewrect = quadpointsToViewrect(quadpoints);
      w3cSelectors.push({
        type: 'FragmentSelector',
        conformsTo: 'http://www.w3.org/TR/media-frags/',
        value: `page=${pageNumber}&viewrect=${viewrect.join(',')}`
      });
    }

    return {
      ...targetRest,
      id,
      source,
      selector: w3cSelectors
    };
  });

  return {
    ...rest,
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: annotation.id,
    type: 'Annotation',
    body: serializeW3CBodies(annotation.bodies),
    creator,
    created: created?.toISOString(),
    modified: updated?.toISOString(),
    target: w3cTargets
  } as unknown as E;

};
