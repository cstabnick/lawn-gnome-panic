import { describe, expect, it } from 'vitest';
import { parseTownMsg } from './net';

const goodPos = { k: 'pos', m: 'town', p: [1.5, -3, 0.25, 1, 0], t: 1234.5 };

describe('parseTownMsg', () => {
  it('accepts a well-formed pose', () => {
    expect(parseTownMsg(goodPos)).toEqual(goodPos);
  });

  it('returns a clean copy, not the input object', () => {
    const input = { ...goodPos, p: [1, 2, 3, 0, 1], extra: 'x' };
    const out = parseTownMsg(input);
    expect(out).toEqual({ k: 'pos', m: 'town', p: [1, 2, 3, 0, 1], t: 1234.5 });
    expect(out).not.toBe(input);
    expect(out).not.toHaveProperty('extra');
  });

  it('accepts every map id', () => {
    for (const m of ['town', 'gnomecino', 'arcade', 'park']) {
      expect(parseTownMsg({ ...goodPos, m })).not.toBeNull();
    }
  });

  it('rejects an unknown or missing map id', () => {
    expect(parseTownMsg({ ...goodPos, m: 'moon' })).toBeNull();
    expect(parseTownMsg({ ...goodPos, m: undefined })).toBeNull();
    expect(parseTownMsg({ ...goodPos, m: 42 })).toBeNull();
  });

  it('rejects wrong pose lengths', () => {
    expect(parseTownMsg({ ...goodPos, p: [1, 2, 3, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: [1, 2, 3, 0, 0, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: 'nope' })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: undefined })).toBeNull();
  });

  it('rejects NaN, infinite and non-number pose values', () => {
    expect(parseTownMsg({ ...goodPos, p: [NaN, 0, 0, 0, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: [0, Infinity, 0, 0, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: [0, 0, '1', 0, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: [0, 0, 0, null, 0] })).toBeNull();
  });

  it('rejects huge coordinates but not a large facing', () => {
    expect(parseTownMsg({ ...goodPos, p: [500, 0, 0, 0, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: [0, -500, 0, 0, 0] })).toBeNull();
    expect(parseTownMsg({ ...goodPos, p: [499.9, -499.9, 0, 0, 0] })).not.toBeNull();
  });

  it('rejects a non-finite timestamp', () => {
    expect(parseTownMsg({ ...goodPos, t: NaN })).toBeNull();
    expect(parseTownMsg({ ...goodPos, t: undefined })).toBeNull();
  });

  it('accepts a known emote', () => {
    expect(parseTownMsg({ k: 'emo', e: 'wave' })).toEqual({ k: 'emo', e: 'wave' });
    expect(parseTownMsg({ k: 'emo', e: 'cool' })).toEqual({ k: 'emo', e: 'cool' });
  });

  it('rejects unknown emotes and inherited object keys', () => {
    expect(parseTownMsg({ k: 'emo', e: 'moonwalk' })).toBeNull();
    expect(parseTownMsg({ k: 'emo', e: 'toString' })).toBeNull();
    expect(parseTownMsg({ k: 'emo', e: 7 })).toBeNull();
    expect(parseTownMsg({ k: 'emo' })).toBeNull();
  });

  it('rejects unknown kinds and non-objects', () => {
    expect(parseTownMsg({ k: 'chat', text: 'hi' })).toBeNull();
    expect(parseTownMsg(null)).toBeNull();
    expect(parseTownMsg(undefined)).toBeNull();
    expect(parseTownMsg('pos')).toBeNull();
    expect(parseTownMsg(42)).toBeNull();
    expect(parseTownMsg([goodPos])).toBeNull();
  });
});
