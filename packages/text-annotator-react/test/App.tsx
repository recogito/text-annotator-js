import React from 'react';
import { Annotorious } from '@annotorious/react';
import { TextAnnotator, TextAnnotatorPopup } from '../src'

export const App = () => {
  
  return (
    <Annotorious>
      <TextAnnotator element="annotatable">
        <TextAnnotatorPopup 
          popup={props => (
            <div>Just a test</div>
          )} />
      </TextAnnotator>
    </Annotorious>
  )

}