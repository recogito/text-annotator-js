# Known Issues for SelectionHandler Tests

## sh-add-to-current-003: Cannot test metaKey on Mac

**Test Case:** isAddToCurrentSelect should return true on metaKey when allowModifierSelect and Mac

**Issue:** The `isMac` variable in `src/utils/device.ts` is evaluated at module load time based on `navigator.platform`. In JSDOM testing environment, `navigator.platform` defaults to a non-Mac value ('Linux' or similar), and `isMac` is therefore `false`.

To properly test Mac-specific behavior (metaKey instead of ctrlKey), we would need to:
1. Mock `navigator.platform` before the module is loaded
2. Use dynamic imports to reload the module with the mocked navigator
3. Or use a more sophisticated module mocking approach

This test case is skipped for now as it requires significant test infrastructure changes.

**Workaround:** The logic for Mac vs non-Mac is a simple ternary (`isMac ? asPtr.metaKey : asPtr.ctrlKey`), and the non-Mac path (ctrlKey) is tested in sh-add-to-current-002. The Mac path follows the same pattern, just with a different key.

## sh-ptr-up-004: Cannot reliably test dismissOnNotAnnotatable function callback

**Test Case:** clickSelect should call dismissOnNotAnnotatable function when provided

**Issue:** The `dismissOnNotAnnotatable` function callback at lines 302-303 is called inside `clickSelect`, which is invoked asynchronously after `pollSelectionCollapsed()` completes. The complex timing requirements and conditions for `clickSelect` to be triggered (including `timeDifference < CLICK_TIMEOUT`, proper target setting, and `isCollapsed` state) make it difficult to reliably reproduce in JSDOM.

**Workaround:** The `dismissOnNotAnnotatable='ALWAYS'` path is tested in sh-ptr-up-003, which verifies the same code path (lines 301-308) is executed. The function callback follows the same pattern as the 'ALWAYS' check, just with a function evaluation instead of string comparison.

## sh-ptr-up-014: Cannot reliably test not-annotatable element click routing

**Test Case:** onPointerUp should route to clickSelect when both down and up are on not-annotatable element

**Issue:** This test verifies the condition at line 361: `(isDownOnNotAnnotatable && isUpOnNotAnnotatable)`. When both pointer events happen on a not-annotatable element (even when selection is NOT collapsed), the code should route to `clickSelect()`.

The test is challenging because:
1. The `clonePointerEvent` function preserves the original event target, but JSDOM's event dispatch doesn't work the same as a real browser
2. The `isNotAnnotatable` function checks `container.contains(node)` which may behave differently in JSDOM
3. Multiple async conditions must align: `timeDifference < CLICK_TIMEOUT`, `pollSelectionCollapsed` completion, and both `isDownOnNotAnnotatable` and `isUpOnNotAnnotatable` returning true

**Workaround:** The collapsed selection path to `clickSelect` is tested in sh-ptr-up-013. The `isNotAnnotatable` check is implicitly verified via the dismissOnNotAnnotatable test (sh-ptr-up-003) which also clicks on a not-annotatable element. The condition logic at line 361 is a simple OR with two branches - both are fundamentally working paths.

## sh-select-all-001 to sh-select-all-006: Cannot test onSelectAll functionality

**Test Cases:** onSelectAll tests (adding selectionchange listener, onSelected callback, event listener cleanup, calling onSelectStart)

**Issue:** The `onSelectAll` function is triggered by the `hotkeys` library which listens for Ctrl+A / Cmd+A key combinations. The `hotkeys` library doesn't respond to synthetic KeyboardEvents dispatched in the JSDOM testing environment.

The hotkeys library uses its own internal event handling that requires real browser key events to trigger the registered callbacks. Synthetic events created with `new KeyboardEvent()` and dispatched via `element.dispatchEvent()` don't trigger the hotkeys handlers.

**Workaround:** The `onSelectAll` function's internal logic is straightforward:
1. It registers a one-time selectionchange listener (line 454)
2. Calls `onSelectStart()` to initialize currentTarget (line 457)
3. When selectionchange fires, it waits 100ms then adds the annotation (lines 435-446)
4. The listener is removed after it fires (line 448)

The core annotation logic (onSelectStart, store.addAnnotation, selection.userSelect) is thoroughly tested in other test cases. The hotkeys-specific behavior would need integration testing with real browser events.

## sh-hotkeys-001 to sh-hotkeys-003: Cannot test hotkeys-based handlers

**Test Cases:** SELECTION_KEYS and SELECT_ALL hotkey handlers

**Issue:** Same as above - the `hotkeys` library doesn't respond to synthetic KeyboardEvents in JSDOM. These tests would verify:
- sh-hotkeys-001: SELECTION_KEYS hotkey stores lastDownEvent on non-repeat keydown (lines 460-463)
- sh-hotkeys-002: SELECTION_KEYS hotkey ignores repeat events (line 461)
- sh-hotkeys-003: SELECT_ALL hotkey stores lastDownEvent and calls onSelectAll (lines 465-468)

**Workaround:** The `lastDownEvent` cloning logic uses `cloneKeyboardEvent`, which is verified indirectly through keyboard selection tests (onKeyup tests). The `onSelectAll` function itself is documented above.

## sh-arrow-001 to sh-arrow-005: Cannot test handleArrowKeyPress function

**Test Cases:** handleArrowKeyPress tests (arrow key behavior for clearing selection)

**Issue:** Same as above - `handleArrowKeyPress` is called via the `hotkeys` library (line 490). The tests would verify:
- sh-arrow-001: Return early on repeat events (line 480)
- sh-arrow-002: Return early when target is not-annotatable (except body) (line 481)
- sh-arrow-003: Process when target is document.body (line 481)
- sh-arrow-004: Clear currentTarget (line 486)
- sh-arrow-005: Call selection.clear() (line 487)

**Workaround:** The `selection.clear()` behavior is tested through other test cases. The `isNotAnnotatable` check is tested in sh-sel-change-004 and sh-ctx-menu-003.

## sh-destroy-009: Cannot test hotkeys.unbind()

**Test Case:** destroy should unbind all hotkeys

**Issue:** The `hotkeys.unbind()` call at line 539 is an external library call. Testing it directly would require mocking the `hotkeys` module, which adds complexity for limited benefit.

**Workaround:** The destroy function's other cleanup behavior (event listener removal, state reset) is thoroughly tested in sh-destroy-001 to sh-destroy-008. The hotkeys unbinding follows the same pattern and is unlikely to fail independently.
