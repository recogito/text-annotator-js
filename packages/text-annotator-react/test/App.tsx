import React from 'react';
import { Annotorious } from '@annotorious/react';
import { TextAnnotator, TextAnnotatorPopup, TextAnnotatorPopupProps } from '../src';

const TestPopup = (props: TextAnnotatorPopupProps) => {

  console.log(props.selected);

  return (
    <div className="popup">Test Popup</div>
  )

}

export const App = () => {
  
  return (
    <Annotorious>
      <TextAnnotator element="annotatable">
        <TextAnnotatorPopup 
          popup={props => (
            <TestPopup {...props} />
          )} />
      </TextAnnotator>
    </Annotorious>
  )

}