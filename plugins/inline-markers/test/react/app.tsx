import { useState } from 'react';
import { Annotorious } from '@annotorious/react';
import { TextAnnotator } from '@recogito/react-text-annotator';
import { InlineMarkersPlugin } from '../../src/react';

export const App = () => {
  const [showMarkers, setShowMarkers] = useState(true);

  return (
    <main>
      <header>
        <h1>Inline markers</h1>
        <button onClick={() => setShowMarkers(show => !show)}>
          {showMarkers ? 'Hide markers' : 'Show markers'}
        </button>
      </header>

      <Annotorious>
        <TextAnnotator
          selectionMode="all"
          mergeHighlights={{ horizontalTolerance: 30 }}>

          <InlineMarkersPlugin showMarkers={showMarkers} />

          <p>
            Tell me, O muse, of that ingenious hero who travelled far and wide 
            after he had sacked the famous town of Troy. Many cities did he 
            visit, and many were the nations with whose manners and customs 
            he was acquainted; moreover he suffered much by sea while trying 
            to save his own life and bring his men safely home; but do what 
            he might he could not save his men, for they perished through 
            their own sheer folly in eating the cattle of the Sun-god Hyperion; 
            so the god prevented them from ever reaching home. Tell me, too, 
            about all these things, O daughter of Jove, from whatsoever 
            source you may know them.
          </p>
        </TextAnnotator>
      </Annotorious>
    </main>
  )

}
