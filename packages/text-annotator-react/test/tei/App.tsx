import React, { useEffect, useState } from 'react';
import { AnnotationBody, Annotorious, useAnnotationStore, useAnnotator } from '@annotorious/react';
import { CETEIcean, TextAnnotatorPopup, TextAnnotatorPopupProps } from '../../src';
import { TextAnnotation, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';
import { TEIAnnotator } from '../../src';

const TestPopup = (props: TextAnnotatorPopupProps) => {

  const store = useAnnotationStore();

  const anno = useAnnotator<VanillaTextAnnotator>();

  const body: AnnotationBody = {
    id: `${Math.random()}`,
    annotation: props.selected[0].id,
    purpose: 'commenting',
    value: 'A Dummy Comment'
  }

  const onClick = () => {
    store.addBody(body);
    anno.state.selection.clear();
  }

  return (
    <div className="popup">
      <input type="text" />
      <button onClick={onClick}>Close</button>
    </div>
  )

}

const MockStorage = () => {

  const anno = useAnnotator<VanillaTextAnnotator>();

  useEffect(() => {
    if (anno) {
      anno.on('createAnnotation', (a: TextAnnotation) => {
        console.log('create', a);

        const versioned = {
          ...a,
          target: {
            ...a.target,
            version: 1
          }
        };
    
        // @ts-ignore
        anno.state.store.updateAnnotation(versioned,'REMOTE');
      });

      anno.on('deleteAnnotation', (annotation: TextAnnotation) => {
        console.log('delete', annotation);
      });
    
      anno.on('selectionChanged', (annotations: TextAnnotation[]) => {
        console.log('selection changed', annotations);
      });
    
      anno.on('updateAnnotation', (annotation: TextAnnotation, previous: TextAnnotation) => {
        console.log('update', annotation, previous);
      });
    }
  }, [anno]);

  return null;

}

export const App = () => {

  const [tei, setTEI] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('sample.xml')
      .then(res => res.text())
      .then(setTEI);
  }, []);

  return (
    <Annotorious>
      <TEIAnnotator>
        <CETEIcean tei={tei} />

        <TextAnnotatorPopup 
          popup={props => (
            <TestPopup {...props} />
          )} />

        <MockStorage />
      </TEIAnnotator>
    </Annotorious>
  )

}