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
Bulk-adds annotations. If `replace` is `true` (default), all existing annotations are removed first. If `false`, the new annotations are appended to existing ones.

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
Programmatically select annotation(s). Passing `undefined` or no argument will clear selection.

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
Fired when the user creates a new annotation.

```js
// Example: save new annotations to a backend
anno.on('createAnnotation', annotation => {
  console.log('Created:', annotation);

  fetch('/my-api/annotations', {
    method: 'POST',
    body: JSON.stringify(annotation)
  });
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
Fired when the selection was changed by the user.

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

## Annotation Format

The Text Annotator data model aligns closely with the [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/), but with a few key differences to optimize for performance and ease of use. Every annotation in Annotorious is represented by a JavaScript object with the following structure:

```json
{
  "id": "67a427d7-afc3-474a-bdab-1e2ea8dc78f6",
  "bodies": [],
  "target": {
    "selector": [{
      "quote": "Tell me, O muse",
      "start": 48,
      "end": 63
    }],
    "creator": {
        "id": "zD62eVrpvJgMEEWuPpPS"
    },
    "created": "2025-09-30T07:28:54.973Z",
    "updated": "2025-09-30T07:28:56.158Z"
  }
}
```

* `id` - a unique identifier for the annotation. The ID can be any alphanumeric string. Annotations created by users will receive a globally unique UUID automatically.

* `target` - the target represents the text range that the annotation is associated with. The `selector` provides the selected `quote` and character offsets for `start` and `end`.

* `bodies` are designed to carry application-specific payload, such as comments, tags, or other metadata associated with the annotation.

## Annotation Styling

You can customize the appearance of highlights using the `style` config option or `setStyle()` method.

```js
const anno = createTextAnnotator(element, {
  style: {
    fill: '#ffeb3b',
    fillOpacity: 0.25,
    underlineStyle: 'dashed',
    underlineColor: '#7d7208ff',
    underlineOffset: 0,
    underlineThickness: 2
  }
});
```

You can provide a function to style annotations based on their properties. The style function receives three arguments:
- `annotation` - the annotation object
- `state` - an object with `selected` and `hovered` boolean properties
- `zIndex` - the stacking order (useful for layering effects on overlapping annotations)

```js
anno.setStyle((annotation, state, zIndex) => {
  const hasTag = annotation.bodies.some(b => b.purpose === 'tagging');
  
  return {
    fill: hasTag ? '#ffeb3b' : '#bbdefb',
    fillOpacity: state.hovered ? 0.35 : 0.2,
    underlineColor: hasTag ? '#f57f17' : undefined
  };
});
```

## License

The Recogito Text Annotator is licensed under the [BSD 3-Clause](LICENSE) license. 

