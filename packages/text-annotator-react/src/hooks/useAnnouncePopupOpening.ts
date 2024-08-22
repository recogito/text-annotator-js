import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { Origin, useAnnotationStore, useSelection } from '@annotorious/react';
import type { TextAnnotation } from '@recogito/text-annotator';
import { announce, destroyAnnouncer } from '@react-aria/live-announcer';
import { exhaustiveUniqueRandom } from 'unique-random';

// Generate random numbers that do not repeat until the entire range has appeared
const uniqueRandom = exhaustiveUniqueRandom(1, 300);

export const useAnnouncePopupOpening = (args: { message?: string, floatingOpen: boolean }) => {
  const {
    message = 'Press Tab to move to Notes Dialog',
    floatingOpen
  } = args;

  const store = useAnnotationStore();
  const { event } = useSelection<TextAnnotation>();

  /**
   * Initialize the `LiveAnnouncer` class and
   * its `polite` announcements live area
   */
  useLayoutEffect(() => {
    announce('', 'polite');
    return () => destroyAnnouncer();
  }, []);

  /**
   * Screen reader requires messages to always be unique!
   * Otherwise, the hint will be announced once per page.
   */
  const announcementSeed = useMemo(() => floatingOpen ? uniqueRandom() : 0, [floatingOpen]);

  const announcePopupNavigation = useCallback(() => {
    /**
     * To imitate the uniqueness of the announced message
     * w/o mutating it - we can append spaces at the end.
     */
    const uniqueSpaces = Array.from({ length: announcementSeed }).map(() => ' ').join('');
    announce(`${message} ${uniqueSpaces}`, 'polite');
  }, [message, announcementSeed]);

  const idleTimeoutMs = 700;
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!floatingOpen || event?.type !== 'keydown') return;

    const scheduleIdleAnnouncement = () => {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(announcePopupNavigation, idleTimeoutMs);
    };

    scheduleIdleAnnouncement();
    store.observe(scheduleIdleAnnouncement, { origin: Origin.LOCAL });

    return () => {
      clearTimeout(idleTimeoutRef.current);
      store.unobserve(scheduleIdleAnnouncement);
    };
  }, [floatingOpen, event?.type, announcePopupNavigation, store]);
};
