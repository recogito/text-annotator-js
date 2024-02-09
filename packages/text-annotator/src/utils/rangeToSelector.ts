import { notAnnotableSelector } from './getAnnotableRanges';
import type { TextSelector } from '../model';

const getAnnotableRangeContents = (range: Range): DocumentFragment => {
	const contents = range.cloneContents();
	contents.querySelectorAll(notAnnotableSelector).forEach((el) => el.remove());
	return contents;
};

export const rangeToSelector = (
	range: Range,
	container: HTMLElement,
	offsetReferenceSelector?: string
): TextSelector => {
	const rangeBefore = document.createRange();

	const offsetReference: HTMLElement = offsetReferenceSelector
		? (range.startContainer.parentElement as HTMLElement).closest(offsetReferenceSelector)!
		: container;

	// A helper range from the start of the container to the start of the selection
	rangeBefore.setStart(offsetReference, 0);
	rangeBefore.setEnd(range.startContainer, range.startOffset);

	// A content range before content w/o not annotable elements
	const rangeBeforeAnnotableContents = getAnnotableRangeContents(rangeBefore);

	const quote = range.toString();
	const start = rangeBeforeAnnotableContents.textContent?.length || 0;
	const end = start + quote.length;

	return offsetReferenceSelector
		? { quote, start, end, range, offsetReference }
		: { quote, start, end, range };
};
