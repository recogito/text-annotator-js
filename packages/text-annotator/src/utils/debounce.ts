export const debounce = <T extends (...args: any[]) => void>(func: T, delay = 10): T => {
	let timeoutId: ReturnType<typeof setTimeout>;

	return ((...args: any[]) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	}) as T;
}
