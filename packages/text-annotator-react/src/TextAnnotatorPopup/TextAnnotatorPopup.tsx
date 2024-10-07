import { FC, PointerEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile } from './isMobile';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  inline,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from '@floating-ui/react';

import { useAnnotator, useSelection } from '@annotorious/react';
import type { TextAnnotation, TextAnnotator } from '@recogito/text-annotator';

import { useAnnouncePopupNavigation } from '../hooks';
import './TextAnnotatorPopup.css';

interface TextAnnotationPopupProps {

  popupNavigationMessage?: string;

  ariaCloseWarning?: string;

  popup(props: TextAnnotationPopupContentProps): ReactNode;

}

export interface TextAnnotationPopupContentProps {

  annotation: TextAnnotation;

  editable?: boolean;

  event?: PointerEvent;

}

export const TextAnnotatorPopup: FC<TextAnnotationPopupProps> = (props) => {

  const { popup, popupNavigationMessage } = props;

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();

  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);
  const handleClose = () => r?.cancelSelected();

  const [isFloatingFocused, setFloatingFocused] = useState(false);
  const handleFloatingFocus = () => setFloatingFocused(true);
  const handleFloatingBlur = () => setFloatingFocused(false);
  useEffect(() => {
    if (!isOpen) handleFloatingBlur();
  }, [isOpen, handleFloatingBlur]);

  const { refs, floatingStyles, update, context } = useFloating({
    placement: isMobile() ? 'bottom' : 'top',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      if (!open && (reason === 'escape-key' || reason === 'focus-out')) {
        setOpen(open);
        handleClose();
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

  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    setOpen(
      // Selected annotation exists and has a selector?
      annotation?.target.selector &&
      // Selector not empty? (Annotations from plugins, general defensive programming)
      annotation.target.selector.length > 0 &&
      // Range not collapsed? (E.g. lazy loading PDFs. Note that this will have to
      // change if we switch from ranges to pre-computed bounds!)
      !annotation.target.selector[0].range.collapsed
    );
  }, [annotation]);

  useEffect(() => {
    if (isOpen && annotation) {
      const {
        target: {
          selector: [{ range }]
        }
      } = annotation;

      refs.setPositionReference({
        getBoundingClientRect: () => range.getBoundingClientRect(),
        getClientRects: () => range.getClientRects()
      });
    } else {
      refs.setPositionReference(null);
    }
  }, [isOpen, annotation, refs]);

  useEffect(() => {
    const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

    const mutationObserver = new MutationObserver(() => update());
    mutationObserver.observe(document.body, config);

    window.document.addEventListener('scroll', update, true);

    return () => {
      mutationObserver.disconnect();
      window.document.removeEventListener('scroll', update, true);
    };
  }, [update]);

  // Prevent text-annotator from handling the irrelevant events triggered from the popup
  const getStopEventsPropagationProps = useCallback(
    () => ({ onPointerUp: (event: PointerEvent<HTMLDivElement>) => event.stopPropagation() }),
    []
  );

  // Don't shift focus to the floating element if selected via keyboard or on mobile.
  const initialFocus = useMemo(() => {
    return (event?.type === 'keyup' || event?.type === 'contextmenu' || isMobile()) ? -1 : 0;
  }, [event]);

  /**
   * Announce the navigation hint only on the keyboard selection,
   * because the focus isn't shifted to the popup automatically then
   */
  useAnnouncePopupNavigation({
    disabled: isFloatingFocused,
    floatingOpen: isOpen,
    message: popupNavigationMessage,
  });

  return isOpen && annotation ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={context}
        modal={false}
        closeOnFocusOut={true}
        returnFocus={false}
        initialFocus={initialFocus}>
        <div
          className="a9s-popup r6o-popup annotation-popup r6o-text-popup not-annotatable"
          ref={refs.setFloating}
          style={floatingStyles}
          onFocus={handleFloatingFocus}
          onBlur={handleFloatingBlur}
          {...getFloatingProps()}
          {...getStopEventsPropagationProps()}>
          {popup({
            annotation: selected[0].annotation,
            editable: selected[0].editable,
            event
          })}
          <button className="r6o-popup-sr-only" aria-live="assertive" onClick={handleClose}>
            {props.ariaCloseWarning || 'Click or leave this dialog to close it.'}
          </button>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  ) : null;

}
