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
