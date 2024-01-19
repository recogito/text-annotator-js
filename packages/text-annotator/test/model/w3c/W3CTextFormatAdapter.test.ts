import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
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
    const { parsed, error } = parseW3CTextAnnotation(textAnnotation, global.contentContainer);
    expect(error).toBeUndefined();

    const fixtureBody = textAnnotation.body[0];
    const fixtureTarget = textAnnotation.target as W3CTextAnnotationTarget;

    expect(parsed.bodies).toHaveLength(1);
    expect(parsed.bodies[0].value).toBe(fixtureBody.value);

    const { selector: { quote, start, range }, created, creator } = parsed.target;
    expect(quote).toStrictEqual(fixtureTarget.selector[0].exact);
    expect(start).toStrictEqual(fixtureTarget.selector[1].start);
    expect(created.getTime()).toEqual(new Date(textAnnotation.created).getTime());
    expect(creator.id).toEqual(textAnnotation.creator.id);
    expect(range).toBeDefined();
  });

  it('should return an error if the selector is incomplete', () => {
    const { parsed, error } = parseW3CTextAnnotation(incompleteTextAnnotation, global.contentContainer);
    expect(parsed).toBeUndefined();
    expect(error).toBeDefined();
    expect(error.message).toContain('Missing selector');
  });

  it('should serialize the sample annotation correctly', () => {
    const { parsed, error } = parseW3CTextAnnotation(textAnnotation, global.contentContainer);
    expect(error).toBeUndefined();

    // @ts-expect-error
    const serialized = serializeW3CTextAnnotation(parsed, textAnnotation.target.source, global.contentContainer);
    expect(serialized.body).toEqual(textAnnotation.body);

    // @ts-expect-error
    expect(serialized.target.selector).toEqual(textAnnotation.target.selector);
  });
});
