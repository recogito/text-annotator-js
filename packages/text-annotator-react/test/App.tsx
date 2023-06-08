import React from 'react';
import { Annotorious } from '@annotorious/react';
import { TextAnnotator, TextAnnotatorPopup } from '../src'

export const App = () => {
  
  return (
    <Annotorious>
      <TextAnnotator element="annotatable">
        <TextAnnotatorPopup />
      </TextAnnotator>
    </Annotorious>
  )

}