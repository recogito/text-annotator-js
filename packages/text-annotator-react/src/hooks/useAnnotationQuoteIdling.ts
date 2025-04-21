import { useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';

import { Origin, useAnnotationStore } from '@annotorious/react';
import { Ignore, type StoreChangeEvent } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationStore, TextAnnotationTarget } from '@recogito/text-annotator';

export const useAnnotationQuoteIdling = (
  annotationId: string | undefined,
  options: { timeout: number } = { timeout: 500 }
) => {
  const store = useAnnotationStore<TextAnnotationStore>();

  const [isIdling, setIdling] = useState(true);

  useEffect(() => {
    if (!store || !annotationId) return;

    let idlingTimeout: ReturnType<typeof setTimeout>;

    const scheduleSetIdling = (event: StoreChangeEvent<TextAnnotation>) => {
      const { changes: { updated } } = event;

      const hasChanged = updated?.some((update) => {
        const { targetUpdated } = update;
        if (targetUpdated) {
          const { oldTarget, newTarget } = targetUpdated;
          return hasTargetQuoteChanged(oldTarget, newTarget);
        }
      });

      if (hasChanged) {
        setIdling(false);

        clearTimeout(idlingTimeout);
        idlingTimeout = setTimeout(() => setIdling(true), options.timeout);
      }
    };

    store.observe(scheduleSetIdling, {
      annotations: annotationId,
      ignore: Ignore.BODY_ONLY,
      origin: Origin.LOCAL
    });

    return () => {
      clearTimeout(idlingTimeout);
      store.unobserve(scheduleSetIdling);
    };
  }, [store, annotationId, options.timeout]);

  return isIdling;
};

const hasTargetQuoteChanged = (oldValue: TextAnnotationTarget, newValue: TextAnnotationTarget) => {
  const { selector: oldSelector } = oldValue;
  const oldQuotes = oldSelector.map(({ quote }) => quote);

  const { selector: newSelector } = newValue;
  const newQuotes = newSelector.map(({ quote }) => quote);

  return !dequal(oldQuotes, newQuotes);
};
