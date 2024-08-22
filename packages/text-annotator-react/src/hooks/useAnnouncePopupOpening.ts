import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { Origin, useAnnotationStore, useSelection } from '@annotorious/react';
import type { TextAnnotation } from '@recogito/text-annotator';
import { announce, clearAnnouncer, destroyAnnouncer } from '@react-aria/live-announcer';
import { exhaustiveUniqueRandom } from 'unique-random';

// Generate random numbers that do not repeat until the entire range has appeared
const uniqueRandom = exhaustiveUniqueRandom(1, 300);

export const useAnnouncePopupOpening = (args: { floatingOpen: boolean }) => {
  const { floatingOpen } = args;

  const store = useAnnotationStore()
  const { event } = useSelection<TextAnnotation>();

  /**
   * Initialize the `LiveAnnouncer` helper
   * and append live areas to the DOM
   */
  useLayoutEffect(() => {
    announce('', 'polite');
    return () => destroyAnnouncer()
  }, [])


  const announcePopupNavigation = useCallback(() => {
    /**
     * Screen reader requires messages to always be unique!
     * Otherwise, the hint will be announced only a single time.
     * To imitate the uniqueness w/o mutating the message - we can append spaces at the end.
     */
    const spaces = Array.from({ length: uniqueRandom() }).map(() => ' ').join('');
    announce(`Press Tab to move to Highlights and Comments Dialog ${spaces}`, 'polite');
  }, []);

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!floatingOpen || event?.type !== 'keydown') return;

    const scheduleIdleAnnouncement = () => {
      const { current: idleTimeout } = idleTimeoutRef;
      if (idleTimeout)
        clearTimeout(idleTimeout);

      idleTimeoutRef.current = setTimeout(announcePopupNavigation, 1000);
    }

    scheduleIdleAnnouncement()
    store.observe(scheduleIdleAnnouncement, { origin: Origin.LOCAL });

    return () => store.unobserve(scheduleIdleAnnouncement)
  }, [store, announcePopupNavigation, floatingOpen, event?.type]);
};
