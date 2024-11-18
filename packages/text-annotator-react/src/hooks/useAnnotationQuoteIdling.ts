import { useEffect, useState } from 'react';
import { dequal } from 'dequal/lite';

import { Origin, useAnnotationStore } from '@annotorious/react';
import { Ignore, type StoreChangeEvent } from '@annotorious/core';
import type { TextAnnotation, TextAnnotationStore } from '@recogito/text-annotator';

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
        if (!targetUpdated) return false;

        const {
          oldTarget: { selector: oldSelector },
          newTarget: { selector: newSelector }
        } = targetUpdated;

        // The generic type support in the `Update` was added in https://github.com/annotorious/annotorious/pull/476

        // @ts-expect-error: requires generic `TextSelector` type support
        const oldQuotes = oldSelector.map(({ quote }) => quote);
        // @ts-expect-error: requires generic `TextSelector` type support
        const newQuotes = newSelector.map(({ quote }) => quote);

        return dequal(oldQuotes, newQuotes);
      });

      if (!hasChanged) return;

      setIdling(false);

      clearTimeout(idlingTimeout);
      idlingTimeout = setTimeout(() => setIdling(true), options.timeout);
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
