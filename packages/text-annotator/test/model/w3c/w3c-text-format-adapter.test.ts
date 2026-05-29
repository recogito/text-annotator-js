import { JSDOM } from 'jsdom';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { textAnnotation, incompleteTextAnnotation } from './fixtures';
import {
  parseW3CTextAnnotation,
  reviveTextSelector,
  serializeW3CTextAnnotation,
  type AnnotationBody,
  type TextSelector,
  type W3CTextAnnotationTarget,
} from '../../../src';

beforeEach(async () => {
  const dom = await JSDOM.fromFile(`${process.cwd()}/test/index.html`);
  global.document = dom.window.document;
  (global as any).contentContainer = global.document.getElementById('content');
});

afterEach(() => {
  delete (global as any).document;
  delete (global as any).contentContainer;
});

describe('parseW3CTextAnnotation', () => {
  it('should parse the sample annotation correctly', () => {
    const { parsed, error } = parseW3CTextAnnotation(textAnnotation);
    expect(error).toBeUndefined();

    const fixtureBody = (textAnnotation as any).body[0];
    const fixtureTarget = (textAnnotation as any).target[0];

    const bodies = parsed?.bodies as AnnotationBody[];

    expect(bodies).toHaveLength(1);
    expect(bodies[0].value).toBe(fixtureBody.value);

    const { selector, created, creator } = parsed!.target;
    const { quote, start } = selector[0] as any;

    expect(quote).toStrictEqual(fixtureTarget.selector[0].exact);
    expect(start).toStrictEqual(fixtureTarget.selector[1].start);
    expect(created?.getTime()).toEqual(new Date(textAnnotation.created!).getTime());
    expect(creator?.id).toEqual(textAnnotation.creator!.id);
  });

  it('should return an error if the selector is incomplete', () => {
    const { parsed, error } = parseW3CTextAnnotation(incompleteTextAnnotation);
    expect(parsed).toBeUndefined();
    expect(error).toBeDefined();
    expect(error!.message).toContain('Missing selector');
  });

  it('should serialize the sample annotation correctly', () => {
    const { parsed, error } = parseW3CTextAnnotation(textAnnotation);
    parsed!.target.selector = parsed!.target.selector.map(selector => 
      reviveTextSelector(selector as TextSelector, (global as any).contentContainer));

    expect(error).toBeUndefined();

    const testTarget = (textAnnotation.target as W3CTextAnnotationTarget[])[0];

    const serialized = serializeW3CTextAnnotation(
      parsed!, 
      testTarget.source, 
      (global as any).contentContainer);

    expect(serialized.body).toEqual(textAnnotation.body);
    
    const serializedTarget = (serialized.target as W3CTextAnnotationTarget[])[0];
    expect(serializedTarget.selector).toEqual(testTarget.selector);
  });
});
