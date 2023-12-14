import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { correctTextAnnotation } from './fixtures';
import { parseW3CTextAnnotation } from '../../../src/model/w3c';

beforeEach(async () => {
  const dom = await JSDOM.fromFile(`${process.cwd()}/test/index.html`);
  global.document = dom.window.document;
  global.contentContainer = global.document.getElementById('content');
});

afterEach(() => {
  delete global.document;
  delete global.contentContainer;
});

describe('parseW3CTextAnnotation', () => {
  it('should parse the sample annotation correctly', () => {
    const parsed = parseW3CTextAnnotation(correctTextAnnotation, global.contentContainer);
    expect(parsed.error).toBeUndefined();

    const { parsed: textAnnotation } = parsed;
    expect(textAnnotation.bodies).toHaveLength(1);

    const { quote, start, end, range } = textAnnotation.target.selector;
    expect(quote).toStrictEqual('But as years');
    expect(start).toBeDefined();
    expect(end).toBeDefined();
    expect(range).toBeDefined();
  });
});
