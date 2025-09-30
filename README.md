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
| `annotatingEnabled` | `boolean` | `true` | Enable or disable interactive creation of new annotations. |
| `dismissOnNotAnnotatable` | `'NEVER' \| 'ALWAYS' \| function` | `'NEVER'` | Controls whether the current selection is dismissed when clicking outside of annotatable content. |
| `selectionMode` | `'shortest' \| 'all'` | `'shortest'` | When the user selects overlapping annotations: select all or only the shortest. |
| `style` | `HighlightStyleExpression` | `undefined` | Custom styling function for highlights. |
| `user` | `User` | anonymous guest | Current user information, automatically added to created or updated annotations. |

## Annotator API

### Methods

#### `getAnnotations(): TextAnnotation[]`
Returns all annotations.

```js
const annotations = anno.getAnnotations();
```

#### `getAnnotationById(id: string): TextAnnotation`
Returns the annotations with the given ID.

```js
const annotation = anno.getAnnotationById('annotation-id');
```

#### `setAnnotations(annotations: TextAnnotation[], replace = true): void`
Bulk-adds the annotations with the given array. If `replace` is set to `true` (default), previous annotations will be deleted. Otherwise, the annotations will be appended.

```js
anno.setAnnotations(annotations);
```

#### `loadAnnotations(url: string, replace = true): Promise<TextAnnotation[]>`
Loads annotations from a URL.

```js
await anno.loadAnnotations('/annotations.json');
```

#### `addAnnotation(annotation: TextAnnotation): void`
Adds a single annotation programmatically.

```js
anno.addAnnotation(annotation);
```

#### `updateAnnotation(updated: TextAnnotation): void`
Updates an existing annotation. (The original annotation with the same ID will be replaced.)

```js
anno.updateAnnotation(updated);
```

#### `removeAnnotation(annotationOrId: TextAnnotation | string): void`
Removes an annotation by object or ID.

```js
anno.removeAnnotation('annotation-id');
```

#### `clearAnnotations(): void`
Removes all annotations.

```js
anno.clearAnnotations();
```

#### `getSelected(): TextAnnotation[]`
Returns currently selected annotations.

```js
const selected = anno.getSelected();
```

#### `setSelected(annotationOrId?: string | string[]): void`
Programmatically select annotation(s). Passing `undefined` or no argument will clear selection. You can

```js
anno.setSelected('annotation-id');
anno.setSelected(['id-1', 'id-2']);
```

#### `cancelSelected(): void`
Programmatically cancel the current selection.

```js
anno.cancelSelected();
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
  fill: annotation.bodies[0]?.purpose === 'tagging' ? 'yellow' : 'lightblue',
  fillOpacity: 0.25
}));
```

#### `setVisible(visible: boolean): void`
Shows or hides all annotations.

```js
anno.setVisible(false); 
```

#### `undo(): void`

Programmatically undo the last user edit.

```js
anno.undo();
```

#### `redo(): void`

Programmatically redo the last undone user edit.

```js
anno.redo();
```

#### `destroy(): void`
Destroys the annotator instance and cleans up all event listeners.

```js
anno.destroy();
```

### Events

Listen to annotation lifecycle events using `on()` and remove listeners with `off()`.

#### `createAnnotation`
Fired when a the user creates a new annotation.

```js
anno.on('createAnnotation', annotation => {
  console.log('Created:', annotation);
});
```

#### `updateAnnotation`
Fired when the user updates an annotation. Receives the updated annotation and the previous version.

```js
anno.on('updateAnnotation', (annotation, previous) => {
  console.log('Updated:', annotation, 'was:', previous);
});
```

#### `deleteAnnotation`
Fired when the user deletes an annotation.

```js
anno.on('deleteAnnotation', annotation => {
  console.log('Deleted:', annotation);
});
```

#### `selectionChanged`
Fired when an the selection was changed by the user.

```js
anno.on('selectionChanged', annotations => {
  console.log('Selected:', annotations);
});
```

**Remove event listeners:**
```js
const handler = annotation => console.log(annotation);
anno.on('createAnnotation', handler);
anno.off('createAnnotation', handler);
```

## License

The Recogito Text Annotator is licensed under the [BSD 3-Clause](LICENSE) license. 

