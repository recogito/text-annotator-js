import React, { useEffect, useRef, useState } from 'react';

import { AnnotationBody, Annotorious, useAnnotationStore, useAnnotator } from '@annotorious/react';
import { TextAnnotation, TextAnnotator as VanillaTextAnnotator } from '@recogito/text-annotator';

import { TEIAnnotator, CETEIcean, TextAnnotatorPopup, TextAnnotatorPopupProps } from '../../src';

const TestPopup = (props: TextAnnotatorPopupProps) => {

  const store = useAnnotationStore();
  const anno = useAnnotator<VanillaTextAnnotator>();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const body: AnnotationBody = {
    id: `${Math.random()}`,
    annotation: props.selected[0].annotation.id,
    purpose: 'commenting',
    value: 'A Dummy Comment'
  };

  const onClick = () => {
    store.addBody(body);
    anno.cancelSelected();
  };

  useEffect(() => {
    const { current: inputEl } = inputRef;
    if (!inputEl) return;

    setTimeout(() => inputEl.focus({ preventScroll: true }));
  }, []);

  return (
    <div className="popup">
      <input ref={inputRef} type="text" />
      <button onClick={onClick}>Close</button>
    </div>
  );

};

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

};

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
          )}
        />

        <MockStorage />
      </TEIAnnotator>
    </Annotorious>
  );

};
