# Recogito PDF Annotator

A JavaScript library for PDF annotation, using [PDF.js](https://mozilla.github.io/pdf.js/) and the [Recogito Text Annotator](https://github.com/recogito/text-annotator-js).

Also available: [React wrapper](packages/pdf-annotator-react)

![Animated screenshot of the Recogito PDF Annotator](/animated-screenshot.gif "Animated screenshot of the Recogito PDF Annotator")

## Installation

```sh
npm install @recogito/pdf-annotator
```

## Quick Start

```js
import { createPDFAnnotator } from '@recogito/pdf-annotator';

var anno = await createPDFAnnotator(
  document.getElementById('container');, 
  'compressed.tracemonkey-pldi-09.pdf'
);

// Load annotations from a file
anno.loadAnnotations('annotations.json');

// Listen to user events
anno.on('createAnnotation', annotation => {
  console.log('new annotation', annotation);
});     
```

## Configuration Options

```js
const anno = createPDFAnnotator(element, url, options);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `annotatingEnabled` | `boolean` | `true` | Enable or disable interactive creation of new annotations. |
| `dismissOnNotAnnotatable` | `'NEVER' \| 'ALWAYS' \| function` | `'NEVER'` | Controls whether the current selection is dismissed when clicking outside of annotatable content. |
| `mergeHighlights` | `object` | `undefined` | Merge adjacent highlights. Options: `horizontalTolerance` and `verticalTolerance` (in pixels) |
| `selectionMode` | `'shortest' \| 'all'` | `'shortest'` | When the user selects overlapping annotations: select all or only the shortest. |
| `style` | `HighlightStyleExpression` | `undefined` | Custom styling function for highlights. |
| `user` | `User` | anonymous guest | Current user information, automatically added to created or updated annotations. |

## Annotator API

### Properties

#### `currentScale: number`
The current numeric scale value of the PDF viewer.

```js
console.log(anno.currentScale);
```

#### `currentScaleValue: string`
The current scale setting value of the PDF viewer.

```js
console.log(anno.currentScaleValue); // e.g. 'page-fit'
```

### Methods

The PDF annotator supports all the API methods of the [underlying text annotator instance](https://github.com/recogito/text-annotator-js#annotator-api). The following additional methods are available:

#### `setScale(size: PDFScale | number): void`
Sets the PDF viewer scale.

```js
anno.setScale(2);
anno.setScale('page-fit');
```

#### `zoomIn(percentage? number): void`
Zoom the PDF viewer by a given percentage (default: 10).

```js
anno.zoomIn();
```

#### `zoomOut(percentage? number): void`
Zoom the PDF viewer out by a given percentage (default: 10).

```js
anno.zoomOut();
```

### Events

The PDF annotator supports all the events of the [underlying text annotator instance](https://github.com/recogito/text-annotator-js#events).

## Annotation Format

The PDF annotator adds additional properties to the annotation target selector.

```json
{ 
  "id": "cd18fb18-b0e9-44f4-a11d-39a35f830fb4",
  "bodies": [],
  "target": {
    "selector": [{
      "quote": "We present a trace-based compilation technique",
      "start": 3589,
      "end": 3635,
      "pageNumber": 1,
      "quadpoints": [
        328.95,
        276.11,
        510.17,
        276.11,
        328.95,
        286.55,
        510.17,
        286.55
      ]
    }],
    "created": "2025-09-30T10:28:25.987Z",
    "updated": "2025-09-30T10:28:27.561Z"
  }
}
```

* `pageNumber` - the PDF page number where the annotation is located.

* `quadPoints` - the bounding box rectangle(s) of the annotation, in PDF [quadpoint format](https://www.adobe.com/devnet-docs/dcsdk_io/viewSDK/howtos_comments.html).

## Annotation Styling

The PDF annotator supports the [same styling properties as the text annotator](https://github.com/recogito/text-annotator-js#annotation-styling).

```js
const anno = createPDFAnnotator(element, url, {
  style: (annotation, state, z) => {
    const hasTag = annotation.bodies.some(b => b.purpose === 'tagging');

    return {
      fill: hasTag ? '#ffeb3b' : '#bbdefb',
      fillOpacity: state.hovered ? 0.35 : 0.2,
      underlineColor: hasTag ? '#f57f17' : undefined,
      underlineThickness: 1
    }
  }
});
```

## License

The Recogito Text Annotator is licensed under the [BSD 3-Clause](LICENSE) license. 
