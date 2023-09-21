import { useEffect, useRef } from 'react';
import CETEI from 'CETEIcean';

interface CETEIceanProps {

  tei?: string;

  onLoad?(element: Element): void;

}

export const CETEIcean = (props: CETEIceanProps) => {

  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.tei) {
      const ceteicean = new CETEI();

      // Override default list, note, table, and ref behaviors 
      // so they don't introduce text into the DOM that interferes
      // with annotation
      ceteicean.addBehaviors({
        tei: {
          ref: (elem: Element) => {
            const a = document.createElement('a');

            while(elem.firstChild) {
              a.appendChild(elem.removeChild(elem.firstChild));
            }

            a.setAttribute('href', elem.getAttribute('target'));

            elem.appendChild(a);
          },
          list: null,
          note: null,
          table: null,
          teiHeader: (elem: HTMLElement) => {
            elem.hidden = true;
          }
        }
      });

      ceteicean.makeHTML5(props.tei, (data: Element) => {
        el.current.appendChild(data);
        props.onLoad(el.current);
      });
    }
  }, [props.tei]);

  return (
    <div 
      ref={el}
      className="tei-container" />
  )

}