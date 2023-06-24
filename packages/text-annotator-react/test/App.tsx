import React, { useEffect } from 'react';
import { AnnotationBody, Annotorious, useAnnotationStore, useAnnotator } from '@annotorious/react';
import { TextAnnotator, TextAnnotatorPopup, TextAnnotatorPopupProps } from '../src';
import { TextAnnotator as RecogitoJS, TextAnnotation } from '@recogito/text-annotator';

const TestPopup = (props: TextAnnotatorPopupProps) => {

  const r = useAnnotator();

  const store = useAnnotationStore();

  const body: AnnotationBody = {
    id: `${Math.random()}`,
    annotation: props.selected[0].id,
    purpose: 'commenting',
    value: 'A Dummy Comment'
  }

  const onClick = () => {
    store.addBody(body);
    r.selection.clear();
  }

  return (
    <div className="popup">
      <input type="text" />
      <button onClick={onClick}>Close</button>
    </div>
  )

}

const MockStorage = () => {

  const r = useAnnotator<RecogitoJS>();

  useEffect(() => {
    if (r) {
      r.on('createAnnotation', (annotation: TextAnnotation) => {
        console.log('create', annotation);
      });

      r.on('deleteAnnotation', (annotation: TextAnnotation) => {
        console.log('delete', annotation);
      });
    
      r.on('selectionChanged', (annotations: TextAnnotation[]) => {
        console.log('selection changed', annotations);
      });
    
      r.on('updateAnnotation', (annotation: TextAnnotation, previous: TextAnnotation) => {
        console.log('update', annotation, previous);
      });
    }
  }, [r]);

  return null;

}

export const App = () => {
  
  return (
    <Annotorious>
      <TextAnnotator
        element="annotatable">
        <TextAnnotatorPopup 
          popup={props => (
            <TestPopup {...props} />
          )} />

        <MockStorage />
      </TextAnnotator>
    </Annotorious>
  )

}