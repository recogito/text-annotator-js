import React from 'react';
import { Recogito, TextAnnotator } from '../src';

export const App = () => {

  return (
    <Recogito>
      <TextAnnotator element="annotatable" />
    </Recogito>
  )

}