import type { W3CTextAnnotation } from '../../../src/model/w3c';

export const textAnnotation: W3CTextAnnotation = {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  type: 'Annotation',
  id: 'http://www.example.com/annotation/ccf99248-e2a0-4fea-9869-46da99390a9b',
  body: {
    type: 'TextualBody',
    value: 'A comment about a content'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: [
      {
        type: 'TextQuoteSelector',
        exact: 'But as years',
        prefix: 'arry him. ',
        suffix: 'went by, '
      },
      {
        type: 'TextPositionSelector',
        start: 922,
        end: 934
      },
    ]
  }
};

export const incompleteTextAnnotation: W3CTextAnnotation = {
  ...textAnnotation,
  target: {
    ...textAnnotation.target,
    // @ts-ignore
    selector: textAnnotation.target.selector[0] // Only the `Text Quote Selector`
  }
};

export const textAnnotations: W3CTextAnnotation[] = [textAnnotation, incompleteTextAnnotation];
