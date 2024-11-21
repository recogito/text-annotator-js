import React, { FC, useEffect, useRef, useState } from 'react';
import { AnnotationBody, Annotorious, useAnnotationStore, useAnnotator } from '@annotorious/react';
import { TextAnnotation, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';
import { 
  TEIAnnotator, 
  CETEIcean, 
  type TextAnnotationPopupContentProps, 
  TextAnnotationPopup 
} from '../../src';

const TestPopup: FC<TextAnnotationPopupContentProps> = (props) => {

  const { annotation } = props;

  const store = useAnnotationStore();
  const r = useAnnotator<VanillaTextAnnotator>();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const body: AnnotationBody = {
    id: `${Math.random()}`,
    annotation: annotation.id,
    purpose: 'commenting',
    value: 'A Dummy Comment'
  };

  const onClick = () => {
    store?.addBody(body);
    r.cancelSelected();
  };

  return (
    <div className="popup">
      <input ref={inputRef} type="text" />
      <button onClick={onClick}>Close</button>
    </div>
  );

};

const MockStorage = () => {

  const r = useAnnotator<VanillaTextAnnotator>();

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

};

export const App: FC = () => {

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

        <TextAnnotationPopup
          popup={props => (
            <TestPopup {...props} />
          )}
        />

        <MockStorage />
      </TEIAnnotator>
    </Annotorious>
  );

};
