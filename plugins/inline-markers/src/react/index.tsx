import { useEffect, useRef } from 'react';
import { AnnotoriousPlugin, TextAnnotation, type TextAnnotatorPlugin } from '@recogito/react-text-annotator';
import { InlineMarkersExtension } from '../inline-markers-renderer';

import '@recogito/text-annotator/text-annotator.css';
import '../index.css';
import { TEIAnnotation } from '@recogito/text-annotator-tei';

export interface InlineMarkersPluginProps {

  showMarkers?: boolean;

}

export const InlineMarkersPlugin = ({ showMarkers = true }: InlineMarkersPluginProps) => {
  const extensionRef = useRef<ReturnType<typeof InlineMarkersExtension> | undefined>(undefined);

  const pluginRef = useRef<TextAnnotatorPlugin<TextAnnotation | TEIAnnotation>>(annotator => {
    const extension = InlineMarkersExtension({ showMarkers });

    extensionRef.current = extension;
    annotator.setRenderer(extension.Renderer);

    return {
      unmount: extension.destroy
    };
  });

  useEffect(() => {
    extensionRef.current?.setShowMarkers(showMarkers);
  }, [showMarkers]);

  return <AnnotoriousPlugin plugin={pluginRef.current} />;
};
