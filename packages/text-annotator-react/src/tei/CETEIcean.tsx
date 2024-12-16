import { useEffect, useRef } from 'react';
import CETEI from 'CETEIcean';

interface CETEIceanProps {

  initArgs?: any;

  tei?: string;

  onLoad?(element: Element): void;

  behaviors?: any;

}

// Override default list, note, table, and ref behaviors 
// so they don't introduce text into the DOM that interferes
// with annotation. Apply a patch to graphics for robustness.
const PRESET_BEHAVIORS = {
  tei: {
    ref: (elem: Element) => {
      const a = document.createElement('a');

      while(elem.firstChild) {
        a.appendChild(elem.removeChild(elem.firstChild));
      }

      a.setAttribute('href', elem.getAttribute('target'));

      elem.appendChild(a);
    },
    // Cf. https://github.com/TEIC/CETEIcean/issues/67
    graphic: (elem: Element) => {
      const content = new Image();
      content.src = elem.getAttribute('url')?.trim();

      if (elem.hasAttribute('width'))
        content.setAttribute('width', elem.getAttribute('width'));

      if (elem.hasAttribute('height'))
        content.setAttribute('height', elem.getAttribute('height'));

      elem.appendChild(content);
    },
    list: null,
    note: null,
    table: null,
    teiHeader: (elem: HTMLElement) => {
      elem.hidden = true;
    }
  }
}

export const CETEIcean = (props: CETEIceanProps) => {

  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.tei) {
      const ceteicean = new CETEI(props.initArgs);

      ceteicean.addBehaviors({
        ...PRESET_BEHAVIORS,
        ...(props.behaviors || {}),
        tei: {
          ...PRESET_BEHAVIORS.tei,
          ...(props.behaviors?.tei || {})
        }
      });

      ceteicean.makeHTML5(props.tei, (data: Element) => {
        el.current.appendChild(data);
        props.onLoad(el.current);
      });
    }

    return () => {
      el.current.innerHTML = '';
    }
  }, [props.tei, JSON.stringify(props.initArgs), props.onLoad]);

  return (
    <div 
      ref={el}
      className="tei-container" />
  )

}