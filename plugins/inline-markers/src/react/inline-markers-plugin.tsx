import { useEffect, useRef } from 'react';
import type { TextAnnotator } from '@recogito/text-annotator';
import { AnnotoriousPlugin, type TextAnnotationLike, type TextAnnotatorPlugin } from '@recogito/react-text-annotator';
import { InlineMarkersExtension } from '../inline-markers-extension';

import '@recogito/text-annotator/text-annotator.css';
import '../index.css';

export interface InlineMarkersPluginProps {

  showMarkers?: boolean;

}

export const InlineMarkersPlugin = ({ showMarkers = true }: InlineMarkersPluginProps) => {
  const extensionRef = useRef<ReturnType<typeof InlineMarkersExtension> | undefined>(undefined);

  const pluginRef = useRef<TextAnnotatorPlugin<TextAnnotator<TextAnnotationLike>>>(annotator => {
    // console.debug('[inline-markers-react] Initializing plugin', annotator);

    const extension = InlineMarkersExtension({ showMarkers });

    extensionRef.current = extension;
    annotator.setRenderer(extension.Renderer);

    return {
      unmount: () => {
        // console.debug('[inline-markers-react] unmounting');
        
        // @ts-ignore
        annotator.setRenderer();
        extension.destroy();
      }
    };
  });

  useEffect(() => {
    extensionRef.current?.setShowMarkers(showMarkers);
  }, [showMarkers]);

  return (
    <AnnotoriousPlugin plugin={pluginRef.current} />
  )

}
