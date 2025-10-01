import { useEffect, useState } from 'react';
import { Origin, useAnnotationStore } from '@annotorious/react';
import { Ignore, type StoreChangeEvent } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationStore, TextAnnotationTarget } from '@recogito/text-annotator';

export const useAnnotationQuoteIdle = (
  annotationId: string | undefined,
  options: { timeout: number } = { timeout: 250 }
) => {
  const store = useAnnotationStore<TextAnnotationStore>();

  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    if (!store || !annotationId) return;

    let idleTimeout: ReturnType<typeof setTimeout>;

    const scheduleSetIsIdle = (event: StoreChangeEvent<TextAnnotation>) => {
      const { changes: { updated } } = event;

      const hasChanged = updated?.some(update => {
        const { targetUpdated } = update;
        if (targetUpdated) {
          const { oldTarget, newTarget } = targetUpdated;
          return hasQuoteChanged(oldTarget, newTarget);
        }
      });

      if (hasChanged) {
        setIsIdle(false);
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => setIsIdle(true), options.timeout);
      }
    };

    store.observe(scheduleSetIsIdle, {
      annotations: annotationId,
      ignore: Ignore.BODY_ONLY,
      origin: Origin.LOCAL
    });

    return () => {
      clearTimeout(idleTimeout);
      store.unobserve(scheduleSetIsIdle);
    };
  }, [store, annotationId, options.timeout]);

  return isIdle;
};

const hasQuoteChanged = (oldValue: TextAnnotationTarget, newValue: TextAnnotationTarget) => {
  const { selector: oldSelector } = oldValue;
  const oldQuotes = oldSelector.map(({ quote }) => quote);

  const { selector: newSelector } = newValue;
  const newQuotes = newSelector.map(({ quote }) => quote);

  return oldQuotes.join() !== newQuotes.join();
};
