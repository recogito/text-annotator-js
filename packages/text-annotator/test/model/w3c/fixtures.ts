import type { W3CTextAnnotation } from '../../../src';

export const textAnnotation: W3CTextAnnotation = {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  type: 'Annotation',
  id: 'http://www.example.com/annotation/ccf99248-e2a0-4fea-9869-46da99390a9b',
  created: '2023-01-28T12:00:00Z',
  creator: {
    type: 'Person',
    id: 'qn7zdU8XD6ZPDBMXdc7w',
    name: 'Oleksandr'
  },
  body: [
    {
      type: 'TextualBody',
      value: 'A comment about a content'
    }
  ],
  target: [
    {
      source: 'http://www.example.com/source/1',
      selector: [
        {
          type: 'TextQuoteSelector',
          exact: 'But as years',
          prefix: 'arry him. ',
          suffix: ' went by, '
        },
        {
          type: 'TextPositionSelector',
          start: 945,
          end: 957
        },
      ]
    }
  ]
};

export const incompleteTextAnnotation: W3CTextAnnotation = {
  ...textAnnotation,
  target: [
    {
      ...textAnnotation.target[0],
      selector: textAnnotation.target[0].selector[0] // Only the `Text Quote Selector`
    }
  ]
};
