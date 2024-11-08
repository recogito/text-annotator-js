import { PointerEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { useAnnotator, useSelection } from '@annotorious/react';
import { isRevived, NOT_ANNOTATABLE_CLASS, TextAnnotation, TextAnnotator } from '@recogito/text-annotator';

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

import { isMobile } from './isMobile';

import './TextAnnotatorPopup.css';

interface TextAnnotationPopupProps {

  ariaCloseWarning?: string;

  popup(props: TextAnnotationPopupContentProps): ReactNode;

}

export interface TextAnnotationPopupContentProps {

  annotation: TextAnnotation;

  editable?: boolean;

  event?: PointerEvent;

}

export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();

  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);

  const { refs, floatingStyles, update, context } = useFloating({
    placement: isMobile() ? 'bottom' : 'top',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      if (!open && (reason === 'escape-key' || reason === 'focus-out')) {
        setOpen(open);
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

  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    const annotationSelector = annotation?.target.selector;
    setOpen(annotationSelector?.length > 0 ? isRevived(annotationSelector) : false);
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

  // Don't shift focus to the floating element if selected via keyboard or on mobile.
  const initialFocus = useMemo(() => {
    return (event?.type === 'keyup' || event?.type === 'contextmenu' || isMobile()) ? -1 : 0;
  }, [event]);

  const onClose = () => r?.cancelSelected();

  return isOpen && annotation ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={context}
        modal={false}
        closeOnFocusOut={true}
        returnFocus={false}
        initialFocus={initialFocus}>
        <div
          className={`a9s-popup r6o-popup annotation-popup r6o-text-popup ${NOT_ANNOTATABLE_CLASS}`}
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps(getStopEventsPropagationProps())}>
          {props.popup({
            annotation: selected[0].annotation,
            editable: selected[0].editable,
            event
          })}

          <button className="r6o-popup-sr-only" aria-live="assertive" onClick={onClose}>
            {props.ariaCloseWarning || 'Click or leave this dialog to close it.'}
          </button>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  ) : null;

}

/**
 * Prevent text-annotator from handling the irrelevant events
 * triggered from the popup/toolbar/dialog
 */
const getStopEventsPropagationProps = <T extends HTMLElement = HTMLElement>() => ({
  onPointerUp: (event: PointerEvent<T>) => event.stopPropagation(),
  onPointerDown: (event: PointerEvent<T>) => event.stopPropagation(),
  onMouseDown: (event: MouseEvent<T>) => event.stopPropagation(),
  onMouseUp: (event: MouseEvent<T>) => event.stopPropagation()
});
