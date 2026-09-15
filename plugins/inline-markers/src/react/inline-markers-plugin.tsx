import { useEffect, useRef } from 'react';
import type { TextAnnotator } from '@recogito/text-annotator';
import { AnnotoriousPlugin, type TextAnnotationLike, type TextAnnotatorPlugin } from '@recogito/react-text-annotator';
import { InlineMarkersExtension } from '../inline-markers-renderer';

import '@recogito/text-annotator/text-annotator.css';
import '../index.css';

export interface InlineMarkersPluginProps {

  showMarkers?: boolean;

}

export const InlineMarkersPlugin = ({ showMarkers = true }: InlineMarkersPluginProps) => {
  const extensionRef = useRef<ReturnType<typeof InlineMarkersExtension> | undefined>(undefined);

  const pluginRef = useRef<TextAnnotatorPlugin<TextAnnotator<TextAnnotationLike>>>(annotator => {
    const extension = InlineMarkersExtension({ showMarkers });

    console.debug('Initializing Recogito Inline Markers plugin');

    extensionRef.current = extension;
    annotator.setRenderer(extension.Renderer);

    return {
      unmount: extension.destroy
    };
  });

  useEffect(() => {
    extensionRef.current?.setShowMarkers(showMarkers);
  }, [showMarkers]);

  return (
    <AnnotoriousPlugin plugin={pluginRef.current} />
  )

}
