type DebouncedFunction<T extends (...args: any[]) => void> = T & {
  clear(): void;
};

export const debounce = <T extends (...args: any[]) => void>(func: T, delay = 10): DebouncedFunction<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  }) as DebouncedFunction<T>;

  debounced.clear = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  return debounced;
}
