import React, { FC, useCallback, useEffect } from 'react';
import { AnnotationBody, Annotorious, useAnnotationStore, useAnnotator } from '@annotorious/react';
import { TextAnnotationPopup, TextAnnotationPopupContentProps, TextAnnotator } from '../src';
import { W3CTextFormat, type TextAnnotation, type TextAnnotator as RecogitoTextAnnotator } from '@recogito/text-annotator';

const TestPopup: FC<TextAnnotationPopupContentProps> = (props) => {

  const { annotation } = props;

  const store = useAnnotationStore();
  const r = useAnnotator<RecogitoTextAnnotator>();

  const body: AnnotationBody = {
    id: `${Math.random()}`,
    annotation: annotation.id,
    purpose: 'commenting',
    value: 'A Dummy Comment'
  };

  const onClick = () => {
    store!.addBody(body);
    r.cancelSelected();
  };

  return (
    <div className="popup">
      <input type="text" />
      <button onClick={onClick}>Close</button>
    </div>
  );

}

const MockStorage: FC = () => {

  const r = useAnnotator<RecogitoTextAnnotator>();

  useEffect(() => {
    if (!r) return;

    const handleCreateAnnotation = (annotation: TextAnnotation) => console.log('create', annotation);
    r.on('createAnnotation', handleCreateAnnotation);

    const handleDeleteAnnotation = (annotation: TextAnnotation) => console.log('delete', annotation);
    r.on('deleteAnnotation', handleDeleteAnnotation);

    const handleSelectionChanged = (annotations: TextAnnotation[]) => console.log('selection changed', annotations);
    r.on('selectionChanged', handleSelectionChanged);

    const handleUpdateAnnotation = (annotation: TextAnnotation, previous: TextAnnotation) => console.log('update', annotation, previous);
    r.on('updateAnnotation', handleUpdateAnnotation);

    return () => {
      r.off('createAnnotation', handleCreateAnnotation);
      r.off('deleteAnnotation', handleDeleteAnnotation);
      r.off('selectionChanged', handleSelectionChanged);
      r.off('updateAnnotation', handleUpdateAnnotation);
    };
  }, [r]);

  return null;

};

export const App: FC = () => {
  const w3cAdapter = useCallback((container: HTMLElement) => W3CTextFormat('https://www.gutenberg.org', container), []);

  return (
    <Annotorious>
      <TextAnnotator
        adapter={w3cAdapter}>
        <p>
          Tell me, O muse, of that ingenious hero who travelled far and wide
          after he had sacked the famous town of Troy. Many cities did he
          visit, and many were the nations with whose manners and customs
          he was acquainted; moreover he suffered much by sea while trying
          to save his own life and bring his men safely home; but do what
          he might he could not save his men, for they perished through their
          own sheer folly in eating the cattle of the Sun-god Hyperion; so the
          god prevented them from ever reaching home. Tell me, too, about all
          these things, O daughter of Jove, from whatsoever source you may know them.
        </p>

        <p>
          So now all who escaped death in battle or by shipwreck had got
          safely home except Ulysses, and he, though he was longing to return
          to his wife and country, was detained by the goddess Calypso, who
          had got him into a large cave and wanted to marry him. But as years
          went by, there came a time when the gods settled that he should go
          back to Ithaca; even then, however, when he was among his own people,
          his troubles were not yet over; nevertheless all the gods had now begun
          to pity him except Neptune, who still persecuted him without ceasing
          and would not let him get home.
        </p>

        <p>
          Tell me, O muse, of that ingenious hero who travelled far and wide
          after he had sacked the famous town of Troy. Many cities did he
          visit, and many were the nations with whose manners and customs
          he was acquainted; moreover he suffered much by sea while trying
          to save his own life and bring his men safely home; but do what
          he might he could not save his men, for they perished through their
          own sheer folly in eating the cattle of the Sun-god Hyperion; so the
          god prevented them from ever reaching home. Tell me, too, about all
          these things, O daughter of Jove, from whatsoever source you may know them.
        </p>

        <p>
          So now all who escaped death in battle or by shipwreck had got
          safely home except Ulysses, and he, though he was longing to return
          to his wife and country, was detained by the goddess Calypso, who
          had got him into a large cave and wanted to marry him. But as years
          went by, there came a time when the gods settled that he should go
          back to Ithaca; even then, however, when he was among his own people,
          his troubles were not yet over; nevertheless all the gods had now begun
          to pity him except Neptune, who still persecuted him without ceasing
          and would not let him get home.
        </p>

        <p>
          Tell me, O muse, of that ingenious hero who travelled far and wide
          after he had sacked the famous town of Troy. Many cities did he
          visit, and many were the nations with whose manners and customs
          he was acquainted; moreover he suffered much by sea while trying
          to save his own life and bring his men safely home; but do what
          he might he could not save his men, for they perished through their
          own sheer folly in eating the cattle of the Sun-god Hyperion; so the
          god prevented them from ever reaching home. Tell me, too, about all
          these things, O daughter of Jove, from whatsoever source you may know them.
        </p>

        <p>
          So now all who escaped death in battle or by shipwreck had got
          safely home except Ulysses, and he, though he was longing to return
          to his wife and country, was detained by the goddess Calypso, who
          had got him into a large cave and wanted to marry him. But as years
          went by, there came a time when the gods settled that he should go
          back to Ithaca; even then, however, when he was among his own people,
          his troubles were not yet over; nevertheless all the gods had now begun
          to pity him except Neptune, who still persecuted him without ceasing
          and would not let him get home.
        </p>

        <p>
          Tell me, O muse, of that ingenious hero who travelled far and wide
          after he had sacked the famous town of Troy. Many cities did he
          visit, and many were the nations with whose manners and customs
          he was acquainted; moreover he suffered much by sea while trying
          to save his own life and bring his men safely home; but do what
          he might he could not save his men, for they perished through their
          own sheer folly in eating the cattle of the Sun-god Hyperion; so the
          god prevented them from ever reaching home. Tell me, too, about all
          these things, O daughter of Jove, from whatsoever source you may know them.
        </p>

        <p>
          So now all who escaped death in battle or by shipwreck had got
          safely home except Ulysses, and he, though he was longing to return
          to his wife and country, was detained by the goddess Calypso, who
          had got him into a large cave and wanted to marry him. But as years
          went by, there came a time when the gods settled that he should go
          back to Ithaca; even then, however, when he was among his own people,
          his troubles were not yet over; nevertheless all the gods had now begun
          to pity him except Neptune, who still persecuted him without ceasing
          and would not let him get home.
        </p>

        <p>
          Tell me, O muse, of that ingenious hero who travelled far and wide
          after he had sacked the famous town of Troy. Many cities did he
          visit, and many were the nations with whose manners and customs
          he was acquainted; moreover he suffered much by sea while trying
          to save his own life and bring his men safely home; but do what
          he might he could not save his men, for they perished through their
          own sheer folly in eating the cattle of the Sun-god Hyperion; so the
          god prevented them from ever reaching home. Tell me, too, about all
          these things, O daughter of Jove, from whatsoever source you may know them.
        </p>

        <p>
          So now all who escaped death in battle or by shipwreck had got
          safely home except Ulysses, and he, though he was longing to return
          to his wife and country, was detained by the goddess Calypso, who
          had got him into a large cave and wanted to marry him. But as years
          went by, there came a time when the gods settled that he should go
          back to Ithaca; even then, however, when he was among his own people,
          his troubles were not yet over; nevertheless all the gods had now begun
          to pity him except Neptune, who still persecuted him without ceasing
          and would not let him get home.
        </p>
      </TextAnnotator>

      <TextAnnotationPopup
        arrow
        arrowProps={{
          fill: '#000000'
        }}
        popup={
          props => (<TestPopup {...props} />)
        }
      />

      <MockStorage />
    </Annotorious>
  );

};
