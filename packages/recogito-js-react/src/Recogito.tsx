import { ReactNode } from 'react';
import { Annotorious } from '@annotorious/react';

import '@recogito/recogito-js/dist/text-annotator.css';

export const Recogito = (props: { children: ReactNode }) => {

  return (
    <Annotorious>
      {props.children}
    </Annotorious>
  )

}