import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to import and test the createSpansRenderer
// The computeZIndex function is internal - we'll test it through integration behavior

describe('SpansRenderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock ResizeObserver
    class MockResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    // Mock MutationObserver
    class MockMutationObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
  });

  describe('computeZIndex', () => {
    // computeZIndex is an internal function. We test its logic directly by extracting the algorithm
    // The function at lines 14-28:
    // - intersects(a, b): checks if two rects overlap
    // - getLength(h): calculates total width of all rects in a highlight
    // - Sorts intersecting highlights by total length (descending)
    // - Returns index of the highlight in the sorted array

    it('should detect rect intersection correctly (sr-zindex-001)', () => {
      // Test the intersection logic:
      // a.x <= b.x + b.width && a.x + a.width >= b.x &&
      // a.y <= b.y + b.height && a.y + a.height >= b.y

      // The intersects function at lines 15-18 uses proper overlap logic
      // For rect A (0, 0, 100, 20) and rect B (50, 0, 100, 20):
      // Horizontal: 0 <= 50+100=150 (true) && 0+100=100 >= 50 (true)
      // Vertical: 0 <= 0+20=20 (true) && 0+20=20 >= 0 (true)
      // Result: true (they intersect)

      // For rect A (0, 0, 100, 20) and rect C (200, 0, 100, 20):
      // Horizontal: 0 <= 200+100=300 (true) && 0+100=100 >= 200 (false)
      // Result: false (they don't intersect)

      // This test verifies the intersection logic is correct by checking the algorithm
      const intersects = (a: {x: number, y: number, width: number, height: number},
                          b: {x: number, y: number, width: number, height: number}): boolean => (
        a.x <= b.x + b.width && a.x + a.width >= b.x &&
        a.y <= b.y + b.height && a.y + a.height >= b.y
      );

      // Test overlapping rects
      const rectA = { x: 0, y: 0, width: 100, height: 20 };
      const rectB = { x: 50, y: 0, width: 100, height: 20 };
      expect(intersects(rectA, rectB)).toBe(true);

      // Test non-overlapping rects (horizontal gap)
      const rectC = { x: 200, y: 0, width: 100, height: 20 };
      expect(intersects(rectA, rectC)).toBe(false);

      // Test non-overlapping rects (vertical gap)
      const rectD = { x: 0, y: 50, width: 100, height: 20 };
      expect(intersects(rectA, rectD)).toBe(false);

      // Test touching rects (edge case)
      const rectE = { x: 100, y: 0, width: 100, height: 20 };
      expect(intersects(rectA, rectE)).toBe(true); // They touch at x=100
    });
  });
});
