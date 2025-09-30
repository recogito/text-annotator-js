# Recogito React Text Annotator

## Installation

```sh
npm install @recogito/text-annotator @annotorious/react @recogito/react-text-annotator
```

## Quick Start

```jsx
import { Annotorious } from '@annotorious/react';
import { TextAnnotator } from '@recogito/react-text-annotator';

export const App = () => {

  return (
    <Annotorious>
      <TextAnnotator>
        <p>
          Tell me, O muse, of that ingenious hero who travelled far and wide
          after he had sacked the famous town of Troy. Many cities did he
          visit, and many were the nations with whose manners and customs
          he was acquainted; moreover he suffered much by sea while trying
          to save his own life and bring his men safely home; but do what
          he might he could not save his men, for they perished through their
          own sheer folly in eating the cattle of the Sun-god Hyperion; so the
          god prevented them from ever reaching home. Tell me, too, about all
          these things, O daughter of Jove, from whatsoever source you may know them.
        </p>
      </TextAnnotator>
    </Annotorious>
  )

}
```

## Selection Popup

You can create a custom selection popup with the `TextAnnotationPopup` helper component.

```jsx
import { Annotorious } from '@annotorious/react';
import { TextAnnotator, TextAnnotationPopup } from '@recogito/react-text-annotator';

export const App = () => {

  return (
    <Annotorious>
      <TextAnnotator>
        <p>
          ...
        </p>

        <TextAnnotationPopup
          asPortal
          popup={props => (<div>Hello World</div>)} />
      </TextAnnotator>
    </Annotorious>
  )

}
```

## Hooks

The Recogito Text Annotator leverages the [Annotorious](https://annotorious.dev) framework underneath the hood. All of the [Annotorious hooks](https://annotorious.dev/react/hooks-reference/) are available:

#### useAnnotator
Provides access to the Text Annotator instance.

```js
const anno = useAnnotator();
```

#### useAnnotatorUser
Provides the current annotator user set via the anno.setUser() method, if any.

```js
const user: User = useAnnotatorUser();
```

#### useSelection
Provides the current selection state object and, optionally, the associated pointer event.

```js
const { selected, event } = useSelection();
```

#### useViewportState
Provides the annotations currently visible in the viewport. This hook will respond to scrolling and resizing the annotation area. You can optionally debounce this hook, to limit re-rendering.

```js
const annotations: ImageAnnotation[] = useViewportState(debounceMillis: number);
```

## TEI/XML

The React wrapper includes utility components for the [TEI extension](../extension-tei).

```jsx
import { useEffect, useState } from 'react';
import { Annotorious } from '@annotorious/react';
import { TEIAnnotator, CETEIcean } from '@recogito/react-text-annotator';

export const App = () => {

  const [tei, setTEI] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('paradise-lost.xml')
      .then(res => res.text())
      .then(setTEI);
  }, []);

  return (
    <Annotorious>
      <TEIAnnotator>
        <CETEIcean tei={tei} />
      </TEIAnnotator>
    </Annotorious>
  );

}
```