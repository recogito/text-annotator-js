# Recogito Text Annotator: TEI/XML Extension

An extension to the Text Annotator to work with TEI/XML using [CETEIcean](https://github.com/TEIC/CETEIcean).

## Installation

```sh
npm install CETEIcean @recogito/text-annotator @recogito/text-annotator-tei
```

## Quick Start

```js
import CETEI from 'CETEIcean';
import { createTextAnnotator } from '@recogito/text-annotator';
import { TEIPlugin } from '@recogito/text-annotator-tei';

window.onload = async function () {
  const CETEIcean = new CETEI();

  CETEIcean.getHTML5('paradise-lost.xml', data => {
    document.getElementById('content').appendChild(data);

    const anno = TEIPlugin(createTextAnnotator(document.getElementById('content')));
  });
}
```

## Annotation Format

The TEI plugin adds XPath expressions for the annotation start and end to the `target.selector`.

```json
{
  "id": "33e0bcb2-801e-4b61-82c5-fa8daaa92dae",
  "bodies": [],
  "target": {
    "selector": [{
      "start": 1878,
      "startSelector": {
        "type": "XPathSelector",
        "value": "//text[@xml:id='text-1']/body[1]/div[1]/div[1]/lg[1]/l[1]::0"
      },
      "end": 1904,
      "endSelector": {
        "type": "XPathSelector",
        "value": "//text[@xml:id='text-1']/body[1]/div[1]/div[1]/lg[1]/l[1]::26"
      },
      "quote": "Of Mans First Disobedience"
    }],
    "creator": {
      "id": "miBoI4WgDjdPYGTfJ5P0"
    },
    "created": "2025-09-30T08:38:16.566Z",
    "updated": "2025-09-30T08:38:17.092Z"
  }
}
```
