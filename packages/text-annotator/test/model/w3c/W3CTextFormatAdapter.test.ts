import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { correctTextAnnotation } from './fixtures';
import { parseW3CTextAnnotation, type W3CTextAnnotationTarget } from '../../../src/model/w3c';
import { W3CAnnotationBody } from '@annotorious/core/src/model/W3CAnnotation';

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

    const fixtureBody = correctTextAnnotation.body as W3CAnnotationBody;
    const fixtureTarget = correctTextAnnotation.target as W3CTextAnnotationTarget;

    const { parsed: textAnnotation } = parsed;
    expect(textAnnotation.bodies).toHaveLength(1);
    expect(textAnnotation.bodies[0].value).toBe(fixtureBody.value);

    const { quote, start, end, range } = textAnnotation.target.selector;
    expect(quote).toStrictEqual(fixtureTarget.selector[0].exact);
    expect(start).toStrictEqual(fixtureTarget.selector[1].start);
    expect(range).toBeDefined();
  });
});
