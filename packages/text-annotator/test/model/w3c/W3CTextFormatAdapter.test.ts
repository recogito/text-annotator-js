import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import type { W3CAnnotationBody } from '@annotorious/core/src/model/W3CAnnotation';
import { textAnnotation, incompleteTextAnnotation } from './fixtures';
import {
  parseW3CTextAnnotation,
  serializeW3CTextAnnotation,
  type W3CTextAnnotationTarget
} from '../../../src';


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
    const parseResults = parseW3CTextAnnotation(textAnnotation, global.contentContainer);
    expect(parseResults.error).toBeUndefined();

    const fixtureBody = textAnnotation.body as W3CAnnotationBody;
    const fixtureTarget = textAnnotation.target as W3CTextAnnotationTarget;

    const { parsed } = parseResults;
    expect(parsed.bodies).toHaveLength(1);
    expect(parsed.bodies[0].value).toBe(fixtureBody.value);

    const { quote, start, range } = parsed.target.selector;
    expect(quote).toStrictEqual(fixtureTarget.selector[0].exact);
    expect(start).toStrictEqual(fixtureTarget.selector[1].start);
    expect(range).toBeDefined();
  });

  it('should return an error if the selector is incomplete', () => {
    const parseResults = parseW3CTextAnnotation(incompleteTextAnnotation, global.contentContainer);
    expect(parseResults.parsed).toBeUndefined();
    expect(parseResults.error).toBeDefined();
    expect(parseResults.error.message).toContain('Missing selector');
  });

  it('should serialize the sample annotation correctly', () => {
    const parseResults = parseW3CTextAnnotation(textAnnotation, global.contentContainer);
    expect(parseResults.error).toBeUndefined();

    // @ts-ignore
    const serialized = serializeW3CTextAnnotation(parseResults.parsed, textAnnotation.target.source);

    const w3cBodies = Array.isArray(textAnnotation.body) ? textAnnotation.body : [textAnnotation.body];
    expect(serialized.body).toEqual(w3cBodies);

    // @ts-ignore
    const w3cSelectors = Array.isArray(textAnnotation.target.selector) ? textAnnotation.target.selector : [textAnnotation.target.selector];
    // @ts-ignore
    expect(serialized.target.selector).toEqual(w3cSelectors);
  });
});
