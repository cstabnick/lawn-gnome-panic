import { describe, expect, it } from 'vitest';
import { loadErrorLines } from './loadError';

describe('loadErrorLines', () => {
  it('keeps the first 10 of 12 lines and counts the 2 cut', () => {
    const lines = Array.from({ length: 12 }, (_, i) => `problem ${i + 1}`);
    const r = loadErrorLines(new Error(lines.join('\n')));
    expect(r.lines).toEqual(lines.slice(0, 10));
    expect(r.more).toBe(2);
  });

  it('drops the content packs header', () => {
    const r = loadErrorLines(new Error('content packs failed to load:\nduplicate item id: x in pack a\nbad zone'));
    expect(r.lines).toEqual(['duplicate item id: x in pack a', 'bad zone']);
    expect(r.more).toBe(0);
  });

  it('handles a non-Error value', () => {
    expect(loadErrorLines('plain string failure')).toEqual({ lines: ['plain string failure'], more: 0 });
    expect(loadErrorLines(42)).toEqual({ lines: ['42'], more: 0 });
  });

  it('gives no lines for an empty message', () => {
    expect(loadErrorLines(new Error(''))).toEqual({ lines: [], more: 0 });
    expect(loadErrorLines(new Error('\n\n  \n'))).toEqual({ lines: [], more: 0 });
  });
});
