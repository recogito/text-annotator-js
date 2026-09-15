# Text Annotator Inline Markers

An extension to the Recogito Text- and TEI-Annotators that renders inline markers 
when multiple annotations start at the same place, in order to provide better
visibility.

![Screenshot of the Recogito Text Annotator Inline Markers extension](inline-markers.png "Example annotated text with inline markers on overlapping annotations")

## Usage

```js
import { createTextAnnotator } from '@recogito/text-annotator';
import { InlineMarkersExtension } from '@recogito/text-annotator-plugin-inline-markers';

import '@recogito/text-annotator/text-annotator.css';

const ext = InlineMarkersExtension();

const r = createTextAnnotator(contentContainer, {
  // Replace default renderer with this extension
  renderer: ext.Renderer
});

// Toggle marker visibility:
// ext.setShowMarkers(false);
```

