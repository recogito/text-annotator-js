# Recogito Text Annotator

A JavaScript library for adding interactive text annotation functionality to web applications.

```sh
npm install @recogito/text-annotator
```

## Quick Start

```js
import { createTextAnnotator } from '@recogito/text-annotator';

const anno = createTextAnnotator(document.getElementById('content'));

// Load annotations from a file
anno.loadAnnotations('annotations.json');

// Listen to user events
anno.on('createAnnotation', annotation => {
  console.log('new annotation', annotation);
});     
```

## Configuration Options

```js
const anno = createTextAnnotator(element, options);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `annotatingEnabled` | `boolean` | `true` | Enable or disable annotation creation. |
| `dismissOnNotAnnotatable` | `'NEVER' \| 'ALWAYS' \| function` | `'NEVER'` | Controls whether the current selection is dismissed when clicking outside annotatable content |
| `selectionMode` | `'shortest' \| 'all'` | `'shortest'` | When clicking overlapping annotations: select shortest or all |
| `style` | `HighlightStyleExpression` | `undefined` | Custom styling function for highlights |
| `user` | `User` | anonymous guest | Current user information, automatically added to created annotations |

## API

### Annotator Methods

#### `getAnnotations(): TextAnnotation[]`
Returns all annotations.

```js
const annotations = anno.getAnnotations();
```

#### `setAnnotations(annotations: TextAnnotation[]): void`
Replaces all annotations with the given array.

```js
anno.setAnnotations(loadedAnnotations);
```

#### `loadAnnotations(url: string): Promise<TextAnnotation[]>`
Loads annotations from a URL.

```js
await anno.loadAnnotations('/api/annotations.json');
```
#### `addAnnotation(annotation: TextAnnotation): void`
Adds a single annotation programmatically.

```js
anno.addAnnotation(newAnnotation);
```

#### `updateAnnotation(annotation: TextAnnotation): void`
Updates an existing annotation.

```js
anno.updateAnnotation(modifiedAnnotation);
```

#### `removeAnnotation(annotationOrId: TextAnnotation | string): void`
Removes an annotation by object or ID.

```js
anno.removeAnnotation('annotation-id');
```

#### `getSelected(): TextAnnotation[]`
Returns currently selected annotations.

```js
const selected = anno.getSelected();
```

#### `setSelected(annotationOrId?: string | string[]): void`
Programmatically select annotation(s). Pass `undefined` or no argument to clear selection.

```js
anno.setSelected('annotation-id');
anno.setSelected(['id-1', 'id-2']);
anno.setSelected(); // Clear selection
```

#### `scrollIntoView(annotationOrId: TextAnnotation | string): boolean`
Scrolls the annotation into view. Returns `true` if successful, `false` if annotation is not currently rendered.

```js
anno.scrollIntoView('annotation-id');
```

#### `getUser(): User`
Returns the current user.

```js
const user = anno.getUser();
```

#### `setUser(user: User): void`
Sets the current user.

```js
anno.setUser({ id: 'new-user@example.com', name: 'John' });
```

#### `setFilter(filter?: Filter): void`
Applies a filter function to control which annotations are displayed.

```js
anno.setFilter(annotation => 
  annotation.bodies.some(b => b.purpose === 'commenting')
);
```

#### `setStyle(style?: HighlightStyleExpression): void`
Updates the highlighting style function.

```js
anno.setStyle(annotation => ({
  backgroundColor: annotation.bodies[0]?.purpose === 'tagging' ? 'yellow' : 'lightblue'
}));
```

#### `setVisible(visible: boolean): void`
Shows or hides all annotations.

```js
anno.setVisible(false); // Hide all highlights
```

#### `destroy(): void`
Destroys the annotator instance and cleans up all event listeners.

```js
anno.destroy();
```


## License

The Recogito Text Annotator is licensed under the [BSD 3-Clause](LICENSE) license. 

