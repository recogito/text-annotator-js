// Simple macOS detection without external dependencies
// navigator.platform returns "MacIntel" or "MacPPC" on macOS
export const isMac = typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac');
