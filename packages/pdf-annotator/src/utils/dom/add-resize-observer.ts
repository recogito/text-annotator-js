export const addResizeObserver = (container: HTMLDivElement, callback: () => void) => {

  const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    callback();
  });

  observer.observe(container);

  return () => {
    observer.disconnect();
  }

}
