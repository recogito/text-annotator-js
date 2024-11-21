import { FC, ReactNode, useCallback, useRef, useEffect, useMemo, useState } from 'react';

import { useAnnotator, useSelection } from '@annotorious/react';
import {
  NOT_ANNOTATABLE_CLASS,
  toDomRectList,
  type TextAnnotation,
  type TextAnnotator,
} from '@recogito/text-annotator';

import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingArrowProps,
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
import { useAnnouncePopupNavigation } from '../hooks';

import './TextAnnotationPopup.css';

interface TextAnnotationPopupProps {

  ariaNavigationMessage?: string;

  ariaCloseWarning?: string;

  arrow?: boolean;

  arrowProps?: Omit<FloatingArrowProps, 'context' | 'ref'>;

  popup(props: TextAnnotationPopupContentProps): ReactNode;

}

export interface TextAnnotationPopupContentProps {

  annotation: TextAnnotation;

  editable?: boolean;

  event?: PointerEvent | KeyboardEvent;

}

const toViewportBounds = (annotationBounds: DOMRect, container: HTMLElement): DOMRect => {
  const { left, top, right, bottom } = annotationBounds;
  const containerBounds = container.getBoundingClientRect();
  return new DOMRect(left + containerBounds.left, top + containerBounds.top, right - left, bottom - top);
}

export const TextAnnotationPopup: FC<TextAnnotationPopupProps> = (props) => {

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();

  const annotation = selected[0]?.annotation;

  const [isOpen, setOpen] = useState(selected?.length > 0);
  const handleClose = () => r?.cancelSelected();

  const [isFocused, setFocused] = useState(false);
  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);
  useEffect(() => {
    if (!isOpen) handleBlur();
  }, [isOpen, handleBlur]);

  const arrowRef = useRef(null);

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
      inline(),
      offset(10),
      flip({ crossAxis: true }),
      shift({ crossAxis: true, padding: 10 }),
      arrow({ element: arrowRef })
    ],
    whileElementsMounted: autoUpdate
  });

  const dismiss = useDismiss(context);

  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    if (annotation?.id) {
      const bounds = r?.state.store.getAnnotationBounds(annotation.id);
      setOpen(Boolean(bounds));
    } else {
      setOpen(false);
    }
  }, [annotation?.id, r?.state.store]);

  useEffect(() => {
    if (!r) return;

    if (isOpen && annotation?.id) {
      refs.setPositionReference({
        getBoundingClientRect: () => {
          // Annotation bounds are relative to the document element
          const bounds = r.state.store.getAnnotationBounds(annotation.id);
          return bounds
            ? toViewportBounds(bounds, r.element)
            : new DOMRect();
        },
        getClientRects: () => {
          const rects = r.state.store.getAnnotationRects(annotation.id);
          const viewportRects = rects.map(rect => toViewportBounds(rect, r.element));
          return toDomRectList(viewportRects);
        }
      });
    } else {
      refs.setPositionReference(null);
    }
  }, [isOpen, annotation?.id, annotation?.target, r]);

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

  /**
   * Announce the navigation hint only on the keyboard selection,
   * because the focus isn't shifted to the popup automatically then
   */
  useAnnouncePopupNavigation({
    disabled: isFocused,
    floatingOpen: isOpen,
    message: props.ariaNavigationMessage,
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
          className={`a9s-popup r6o-popup annotation-popup r6o-text-popup ${NOT_ANNOTATABLE_CLASS}`}
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps({
            onFocus: handleFocus,
            onBlur: handleBlur,
            ...getStopEventsPropagationProps()
          })}>
          {props.popup({
            annotation: selected[0].annotation,
            editable: selected[0].editable,
            event
          })}
          {props.arrow && (
            <FloatingArrow
              ref={arrowRef}
              context={context}
              {...(props.arrowProps || {})} />
          )}

          <button className="r6o-popup-sr-only" aria-live="assertive" onClick={handleClose}>
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
  onPointerUp: (event: React.PointerEvent<T>) => event.stopPropagation(),
  onPointerDown: (event: React.PointerEvent<T>) => event.stopPropagation(),
  onMouseDown: (event: React.MouseEvent<T>) => event.stopPropagation(),
  onMouseUp: (event: React.MouseEvent<T>) => event.stopPropagation()
});

/** For backwards compatibility **/
/** @deprecated Use TextAnnotationPopup instead */
export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {

  useEffect(() => {
    console.warn('TextAnnotatorPopup is deprecated and will be removed in a future version. Please use TextAnnotationPopup instead.');
  }, []);

  return <TextAnnotationPopup {...props} />;
};
