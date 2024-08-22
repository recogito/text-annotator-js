import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { Origin, useAnnotationStore, useSelection } from '@annotorious/react';
import type { TextAnnotation } from '@recogito/text-annotator';
import { announce, destroyAnnouncer } from '@react-aria/live-announcer';
import { exhaustiveUniqueRandom } from 'unique-random';

interface AnnouncePopupOpeningArgs {
    message?: string;
    floatingOpen: boolean;
    disabled?: boolean;
}

export const useAnnouncePopupNavigation = (args: AnnouncePopupOpeningArgs) => {
  const {
    message = 'Press Tab to move to Notes Dialog',
    floatingOpen,
    disabled = false
  } = args;

  const store = useAnnotationStore();
  const { event } = useSelection<TextAnnotation>();

  // Generate random numbers that do not repeat until the entire 1-10000 range has appeared
  const uniqueRandom = useCallback(exhaustiveUniqueRandom(1, 10000), []);

  /**
   * Initialize the `LiveAnnouncer` class and
   * its `polite` announcements live area
   */
  useLayoutEffect(() => {
    if (!message) return;

    announce('', 'polite');
    return () => destroyAnnouncer();
  }, [message]);

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
    if (disabled || !floatingOpen || !message) return;

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
  }, [floatingOpen, event?.type, message, announcePopupNavigation, store]);
};
