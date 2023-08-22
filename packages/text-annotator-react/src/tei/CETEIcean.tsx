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