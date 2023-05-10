import React from 'react';
import { Annotorious } from '@annotorious/react';
import { TextAnnotator } from '../src'

export const App = () => {
  
  return (
    <Annotorious>
      <TextAnnotator element="annotatable" />
    </Annotorious>
  )

}