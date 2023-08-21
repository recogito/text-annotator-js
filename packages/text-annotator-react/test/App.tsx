import React, { useEffect } from 'react';
import { AnnotationBody, Annotorious, useAnnotationStore, useAnnotator, useSelection } from '@annotorious/react';
import { TextAnnotator, TextAnnotatorPopup, TextAnnotatorPopupProps } from '../src';
import { TextAnnotation, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';

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
      anno.on('createAnnotation', (annotation: TextAnnotation) => {
        console.log('create', annotation);
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