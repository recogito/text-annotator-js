import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
  PointerEvent,
  useRef,
  MutableRefObject,
  CSSProperties
} from 'react';
import { useAnnotator, useSelection } from '@annotorious/react';
import { type TextAnnotation, type TextAnnotator } from '@recogito/text-annotator';
import {
  autoUpdate,
  inline,
  offset,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react';
import { createPortal } from 'react-dom';

interface TextAnnotationPopupProps<TRefElement extends HTMLElement> {

  focusMessage?: string;

  popup(props: TextAnnotatorPopupProps<TRefElement>): ReactNode;

}

export interface TextAnnotatorPopupProps<TRefElement extends HTMLElement = HTMLElement> {

  ref: MutableRefObject<TRefElement | null>;

  selected: { annotation: TextAnnotation, editable?: boolean }[];

}

export const TextAnnotatorPopup = <TRefElement extends HTMLElement = HTMLElement>(props: TextAnnotationPopupProps<TRefElement>) => {

  const { popup, focusMessage } = props;

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();
  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);

  const { refs, floatingStyles, update, context } = useFloating({
    placement: 'top',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      setOpen(open);
      if (!open && reason === 'escape-key') {
        r?.cancelSelected();
      }
    },
    middleware: [
      offset(10),
      inline(),
      flip(),
      shift({ mainAxis: false, crossAxis: true, padding: 10 })
    ],
    whileElementsMounted: autoUpdate
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  const selectedKey = selected.map(a => a.annotation.id).join('-');
  useEffect(() => {
    // Ignore all selection changes except those accompanied by a user event.
    if (selected.length > 0 && event) {
      setOpen(event.type === 'pointerup' || event.type === 'keydown');
    }

    // Close the popup if the selection is cleared
    if (selected.length === 0 && isOpen) {
      setOpen(false);
    }
  }, [isOpen, event, selectedKey]);

  useEffect(() => {
    if (!isOpen || !annotation) return;

    const {
      target: {
        selector: [{ range }]
      }
    } = annotation;

    refs.setPositionReference({
      getBoundingClientRect: range.getBoundingClientRect.bind(range),
      getClientRects: range.getClientRects.bind(range)
    });
  }, [isOpen, annotation, refs]);

  // Prevent text-annotator from handling the irrelevant events triggered from the popup
  const getStopEventsPropagationProps = useCallback(
    () => ({ onPointerUp: (event: PointerEvent<HTMLDivElement>) => event.stopPropagation() }),
    []
  );

  useEffect(() => {
    const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

    const mutationObserver = new MutationObserver(() => update());
    mutationObserver.observe(document.body, config);

    window.document.addEventListener('scroll', update, true);

    return () => {
      mutationObserver.disconnect();
      window.document.removeEventListener('scroll', update, true);
    }
  }, [update]);

  const popupContentRef = useRef<TRefElement | null>(null);
  const popupAnnouncerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const { current: popupContent } = popupContentRef;
    if (!popupContent)
      return;

    if (!isOpen || !event)
      return;

    let announcementTimout: ReturnType<typeof setTimeout>;

    if (event.type === 'pointerup') {
      /**
       * When the selection "finishes" using the pointer device,
       * we can immediately focus on the popup content.
       * That's useful to quickly write down a note or pick a highlight color
       */
      popupContent.focus();
    } else if (event.type === 'keydown') {
      announcementTimout = setTimeout(() => {
        /**
         * When the selection is performed using the keyboard, there's no certain "finished" state.
         * Even after we show the popup, users might want to continue selecting text.
         * Therefore, we shouldn't shift the focus from the page,
         * but make a recommendation on how to navigate to the popup.
         */
        const { current: popupAnnouncer } = popupAnnouncerRef;
        if (popupAnnouncer) {
          popupAnnouncer.textContent = focusMessage;
        }
      }, 25)
    }

    return () => {
      clearTimeout(announcementTimout);
    }
  }, [isOpen, event]);

  return isOpen && selected.length > 0 ? (
    <>
      <div
        className="annotation-popup text-annotation-popup not-annotatable"
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        {...getStopEventsPropagationProps()}>
        {popup({ ref: popupContentRef, selected })}
      </div>
      {focusMessage && createPortal(
        <span ref={popupAnnouncerRef} style={visuallyHiddenStyles} aria-live="assertive" aria-atomic />,
        document.body
      )}
    </>
  ) : null;

}

const visuallyHiddenStyles: CSSProperties = {
  position: 'absolute',
  height: '1px',
  width: '1px',
  clipPath: 'inset(50%)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
};
