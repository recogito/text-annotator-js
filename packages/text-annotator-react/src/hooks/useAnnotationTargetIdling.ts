import { Origin, useAnnotationStore } from '@annotorious/react';
import { useEffect, useState } from 'react';
import { Ignore } from '@annotorious/core';

export const useAnnotationTargetIdling = (
  annotationId: string | undefined,
  options: { timeout: number } = { timeout: 500 }
) => {
  const store = useAnnotationStore();

  const [isIdling, setIdling] = useState(true);

  useEffect(() => {
    if (!annotationId) return;

    let idlingTimeout: ReturnType<typeof setTimeout>;

    const scheduleSetIdling = () => {
      setIdling(false);

      clearTimeout(idlingTimeout);
      idlingTimeout = setTimeout(() => setIdling(true), options.timeout);
    };

    store.observe(
      scheduleSetIdling,
      {
        annotations: annotationId,
        ignore: Ignore.BODY_ONLY,
        origin: Origin.LOCAL
      }
    );
    return () => {
      clearTimeout(idlingTimeout);
      store.unobserve(scheduleSetIdling);
    };
  }, [annotationId]);

  return isIdling;
};
