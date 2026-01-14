# Test Plan: SelectionHandler and Renderer Tests

## Overview
Add comprehensive tests for the interaction handlers (SelectionHandler) and renderer components in the text-annotator-js library.

## Test File Organization

```
packages/text-annotator/test/
├── SelectionHandler.test.ts         # SelectionHandler tests
├── highlight/
│   ├── Renderer.test.ts             # Base renderer tests
│   └── span/
│       └── spansRenderer.test.ts    # SpansRenderer tests
└── helpers/
    ├── mockState.ts                 # Mock TextAnnotatorState factory
    ├── mockLifecycle.ts             # Mock Lifecycle factory
    ├── selectionHelpers.ts          # Selection API simulation
    └── eventHelpers.ts              # Event creation utilities
```

## Files to Create

### 1. Test Helpers (`test/helpers/`)

#### `mockState.ts`
- `createMockStore()` - Mock store with getAnnotation, addAnnotation, updateTarget, deleteAnnotation, getAt, getIntersecting, observe, unobserve
- `createMockSelection()` - Mock selection state with selected, userSelect, clear, subscribe
- `createMockHover()` - Mock hover state with current, set, subscribe
- `createMockViewport()` - Mock viewport state
- `createMockState()` - Combined factory

#### `mockLifecycle.ts`
- `createMockLifecycle()` - Mock with emit, on, off methods

#### `selectionHelpers.ts`
- `createMockDOMSelection()` - Mock document.getSelection() return value
- `createTextRange()` - Create DOM Range for testing
- `setupValidSelection()` - Helper to setup non-collapsed selection
- `setupCollapsedSelection()` - Helper for collapsed selection

#### `eventHelpers.ts`
- `createPointerEvent()` - PointerEvent factory with defaults
- `createKeyboardEvent()` - KeyboardEvent factory
- `dispatchSelectionChange()` - Dispatch selectionchange event
- `createTestContainer()` - Create DOM container for tests
- `cleanupContainer()` - Remove test container

### 2. SelectionHandler Tests (`test/SelectionHandler.test.ts`)

#### Configuration Tests
- `setAnnotatingEnabled(false)` prevents new annotations
- `setAnnotatingEnabled(true)` re-enables annotations
- `setAnnotatingMode()` updates mode correctly
- `setFilter()` stores filter for click selection
- `setUser()` updates creator on new annotations

#### Pointer Event Tests
- Track left click (button === 0)
- Reject right click (button === 2)
- Create annotation on valid selection after pointerup
- Click-select existing annotation on collapsed selection
- Clear selection when clicking empty area
- Handle `dismissOnNotAnnotatable='ALWAYS'`
- Handle `dismissOnNotAnnotatable` function

#### Selection Change Tests (debounced at 10ms)
- Debounce selection changes at 10ms
- Ignore selection when anchorNode is null (iOS edge case)
- Ignore selection outside container
- Handle collapsed selection (clears currentTarget)
- Delete annotation on collapse if not in modify mode
- Call onSelectStart for Chrome/iOS workaround
- Call onSelectStart for Firefox collapsed selection workaround
- Trim range to container boundaries
- Skip whitespace-only selections
- Split ranges around not-annotatable elements

#### Annotation Modification Tests
- ADD_TO_CURRENT mode merges new selection with existing
- ADD_TO_CURRENT preserves original annotation metadata
- REPLACE_CURRENT mode replaces existing annotation selection
- allowModifierSelect triggers ADD_TO_CURRENT on Ctrl+select
- allowModifierSelect triggers ADD_TO_CURRENT on Meta+select (Mac)

#### Keyboard Event Tests
- Finalize selection on Shift key release
- Ignore when annotating disabled
- Clear selection on arrow key without Shift
- Ignore repeated key events
- Ignore arrow keys on not-annotatable elements
- Process arrow keys when target is document.body

#### Context Menu Tests
- Process selection on context menu (Chrome Android workaround)
- Ignore collapsed selection on context menu

#### Cleanup Tests
- Remove all event listeners on destroy
- Clear debounced handlers
- Unbind hotkeys
- Reset internal state

### 3. Base Renderer Tests (`test/highlight/Renderer.test.ts`)

#### Hover State Tests
- Set hover when over annotation
- Clear hover when moving off annotation
- Not hover if UserSelectAction is NONE
- Apply filter to hover detection

#### Redraw Tests
- Debounce redraws at 10ms
- Compute highlights with selection state
- Compute highlights with hover state
- Apply filter to intersecting annotations
- Pass lazy=true on scroll
- Call painter.clear() before redraw

#### Observer Tests
- Trigger redraw on store changes
- Trigger redraw on selection change
- Trigger redraw on hover change

#### Resize/Mutation Tests
- Recalculate positions and redraw on resize
- Reset painter on resize
- Trigger lazy redraw on external DOM mutations
- Not redraw on internal mutations

#### API Tests
- setStyle() updates style and triggers redraw
- setFilter() updates filter and triggers non-lazy redraw
- setPainter() updates painter and triggers redraw
- setVisible() delegates to implementation

#### Cleanup Tests
- Remove pointermove listener
- Call implementation destroy
- Unsubscribe from store
- Disconnect observers

### 4. SpansRenderer Tests (`test/highlight/span/spansRenderer.test.ts`)

#### Initialization Tests
- Add r6o-annotatable class to container
- Create highlight layer as first child

#### Redraw Tests
- Create span elements for each rect
- Set correct position styles on spans
- Set data-annotation attribute
- Sort highlights by creation date (oldest first)
- Skip redraw when lazy=true and no changes (dequal)
- Redraw when highlights change even if lazy=true
- Clear highlight layer before redraw

#### Z-Index Computation Tests
- Compute z-index based on overlap length
- Handle non-overlapping annotations
- Handle multi-line annotations

#### Styling Tests
- Apply backgroundColor from style
- Apply underline styles (borderStyle, borderColor, borderBottomWidth, paddingBottom)
- Use style function with annotation, state, and zIndex

#### Painter Integration Tests
- Call painter even when lazy and no changes

#### Visibility Tests
- Add hidden class when visible=false
- Remove hidden class when visible=true

#### Cleanup Tests
- Remove highlight layer from DOM on destroy

## Implementation Approach

### Phase 1: Create Test Helpers
1. Create `test/helpers/` directory
2. Implement mock factories for state, lifecycle, and options
3. Implement selection and event helper utilities

### Phase 2: SelectionHandler Tests
1. Create `test/SelectionHandler.test.ts`
2. Implement configuration tests
3. Implement pointer event tests
4. Implement selection change tests
5. Implement annotation modification tests
6. Implement keyboard event tests
7. Implement context menu tests
8. Implement cleanup tests

### Phase 3: Renderer Tests
1. Create `test/highlight/Renderer.test.ts`
2. Implement hover state tests
3. Implement redraw tests
4. Implement observer tests
5. Implement resize/mutation tests
6. Implement API tests
7. Implement cleanup tests

### Phase 4: SpansRenderer Tests
1. Create `test/highlight/span/spansRenderer.test.ts`
2. Implement initialization tests
3. Implement redraw tests
4. Implement z-index computation tests
5. Implement styling tests
6. Implement visibility and cleanup tests

## Handling Async/Debounced Behavior

Use Vitest fake timers:
```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// Advance past debounce (10ms) then run animation frames
await vi.advanceTimersByTimeAsync(15);
await vi.runAllTimersAsync();
```

For pollSelectionCollapsed (50ms max polling):
```typescript
await vi.advanceTimersByTimeAsync(60);
```

## Verification

Run tests with:
```bash
cd packages/text-annotator && npm test
```

Expected: All new tests pass alongside existing W3CTextFormatAdapter tests.
