import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'debounce';
import { useAnnotator, useSelection } from '@annotorious/react';
import {
  NOT_ANNOTATABLE_CLASS,
  TextAnnotationStore,
  toViewportBounds,
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
  Placement,
  shift,
  useFloating
} from '@floating-ui/react';
import { isMobile } from './isMobile';
import { useAnnotationQuoteIdle } from '../hooks';

import './TextAnnotationPopup.css';

interface TextAnnotationPopupProps {

  ariaCloseWarning?: string;

  arrow?: boolean;

  arrowProps?: Omit<FloatingArrowProps, 'context' | 'ref'>;

  asPortal?: boolean;

  autoFocus?: boolean;

  placement?: Placement;

  popup(props: TextAnnotationPopupContentProps): ReactNode;

  onClose?(): void;

}

export interface TextAnnotationPopupContentProps<T extends TextAnnotation = TextAnnotation> {

  annotation: T;

  editable?: boolean;

  event?: PointerEvent | KeyboardEvent;

}

let cachedBounds = null;

const updateViewportBounds = debounce((annotationId: string, store: TextAnnotationStore, container: HTMLElement) => {
  requestAnimationFrame(() => {
    const bounds = store.getAnnotationBounds(annotationId);
    if (!bounds) return;
    cachedBounds = toViewportBounds(bounds, container.getBoundingClientRect());
  });
}, 250);

export const TextAnnotationPopup = (props: TextAnnotationPopupProps) => {

  const r = useAnnotator<TextAnnotator>();

  const { selected, event } = useSelection<TextAnnotation>();

  const annotation = selected[0]?.annotation;

  const isAnnotationQuoteIdle = useAnnotationQuoteIdle(annotation?.id);

  const [isOpen, setOpen] = useState(selected?.length > 0);

  // So we can reliably trigger the onClose callback
  const wasOpenRef = useRef(false);

  const arrowRef = useRef(null);

  const { refs, floatingStyles, update, context } = useFloating({
    placement: isMobile() ? 'bottom' : props.placement || 'top',
    strategy: 'absolute',
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      if (!open && (reason === 'escape-key' || reason === 'focus-out')) {
        setOpen(open);
        r?.cancelSelected();
      }
    },
    middleware: [
      inline(),
      offset(10),
      flip({ crossAxis: true }),
      shift({ crossAxis: true, padding: 10,  }),
      arrow({ element: arrowRef })
    ],
    whileElementsMounted: autoUpdate
  });

  useEffect(() => {
    if (annotation?.id && isAnnotationQuoteIdle) {
      const bounds = r?.state.store.getAnnotationBounds(annotation.id);
      setOpen(Boolean(bounds));
    } else {
      setOpen(false);
    }
  }, [annotation?.id, annotation?.target.selector, isAnnotationQuoteIdle, r?.state.store]);

  useEffect(() => {
    if (!props.onClose) return;

    if (isOpen) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      props.onClose();
    }
  }, [props.onClose, isOpen]);

  useEffect(() => {
    if (!r) return;

    if (isOpen && annotation?.id) {
      refs.setPositionReference({
        getBoundingClientRect: () => {
          // Debounced!
          updateViewportBounds(annotation.id, r.state.store, r.element);
          return cachedBounds ? cachedBounds : new DOMRect();
        },
        getClientRects: () => {
          const rects = r.state.store.getAnnotationRects(annotation.id);
          const denormalizedRects = rects.map((rect) =>
            toViewportBounds(rect, r.element.getBoundingClientRect())
          );
          return toDomRectList(denormalizedRects);
        }
      });
    } else {
      refs.setPositionReference(null);
    }
  }, [isOpen, annotation?.id, annotation?.target, r]);

  useEffect(() => {
    if (!props.asPortal) return;

    const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

    const mutationObserver = new MutationObserver(() => update());
    mutationObserver.observe(document.body, config);

    window.document.addEventListener('scroll', update, true);

    return () => {
      mutationObserver.disconnect();
      window.document.removeEventListener('scroll', update, true);
    };
  }, [update, props.asPortal]);

  // Don't shift focus to the floating element if selected via keyboard or on mobile.
  const initialFocus = useMemo(() => {
    return (
      props.autoFocus === false || 
      event?.type === 'keyup' || 
      event?.type === 'contextmenu' || 
      isMobile()
    ) ? -1 : 0;
  }, [props.autoFocus, event]);

  const onClose = () => r?.cancelSelected();

  return isOpen && annotation ? (
    <FloatingPortal
      root={props.asPortal ? undefined : r.element}>
      <FloatingFocusManager
        context={context}
        modal={false}
        closeOnFocusOut={true}
        returnFocus={false}
        initialFocus={-1}>
        <div
          className={`a9s-popup r6o-popup annotation-popup r6o-text-popup ${NOT_ANNOTATABLE_CLASS}`}
          ref={refs.setFloating}
          style={floatingStyles}>
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

          <button className="r6o-popup-sr-only" aria-live="assertive" onClick={onClose}>
            {props.ariaCloseWarning || 'Click or leave this dialog to close it.'}
          </button>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  ) : null;

};

/** For backwards compatibility **/
/** @deprecated Use TextAnnotationPopup instead */
export const TextAnnotatorPopup = (props: TextAnnotationPopupProps) => {

  useEffect(() => {
    console.warn('TextAnnotatorPopup is deprecated and will be removed in a future version. Please use TextAnnotationPopup instead.');
  }, []);

  return <TextAnnotationPopup {...props} />;
};
