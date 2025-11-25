# Recogito React PDF Annotator

## Installation

```sh
npm install @recogito/pdf-annotator @annotorious/react @recogito/react-pdf-annotator
```

## Quick Start

```jsx
import { Annotorious } from '@annotorious/react';
import { PDFAnnotator } from '@recogito/react-pdf-annotator';

export const App = () => {

  return (
    <Annotorious>
      <PDFAnnotator 
        pdfUrl="compressed.tracemonkey-pldi-09.pdf" />
    </Annotorious>
  )

}
```

## Selection Popup

The `TextAnnotationPopup` from the Recogito Text Annotator package is fully compatible with the PDF annotator.

```jsx
import { Annotorious } from '@annotorious/react';
import { PDFAnnotator } from '@recogito/react-pdf-annotator';
import { TextAnnotationPopup } from '@recogito/react-text-annotator';

export const App = () => {

  return (
    <Annotorious>
      <PDFAnnotator 
        pdfUrl="compressed.tracemonkey-pldi-09.pdf" />

      <TextAnnotationPopup
          asPortal
          popup={props => (<div>Hello World</div>)} />
    </Annotorious>
  )

}
```

## Hooks

The PDF annotator supports all Annotorious hooks, exactly [like the text annotator](https://github.com/recogito/text-annotator-js/tree/main/packages/text-annotator-react#hooks).