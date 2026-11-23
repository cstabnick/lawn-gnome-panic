import { describe, expect, it } from 'vitest';
import { readEmoteId, readPartyChat, readPartyId, readPartyRoster } from './protocol';

describe('readPartyId', () => {
  it('accepts <leader>:<seq> ids and rejects the rest', () => {
    expect(readPartyId('12:3')).toBe('12:3');
    expect(readPartyId('')).toBeNull();
    expect(readPartyId('x:1')).toBeNull();
    expect(readPartyId(42)).toBeNull();
    expect(readPartyId('1'.repeat(40))).toBeNull();
  });
});

describe('readPartyRoster', () => {
  it('sorts members and keeps helpers', () => {
    const r = readPartyRoster(3, [9, 3, 5], [['Pim', 4]]);
    expect(r).toEqual({ lead: 3, m: [3, 5, 9], h: [['Pim', 4]] });
  });

  it('rejects a list without the lead', () => {
    expect(readPartyRoster(3, [5, 9], [])).toBeNull();
  });

  it('rejects duplicates and five members', () => {
    expect(readPartyRoster(3, [3, 3], [])).toBeNull();
    expect(readPartyRoster(1, [1, 2, 3, 4, 5], [])).toBeNull();
  });

  it('rejects a non-integer id', () => {
    expect(readPartyRoster(3, [3, 5.5], [])).toBeNull();
  });

  it('rejects helpers at level 0 or 100', () => {
    expect(readPartyRoster(3, [3, 5], [['Pim', 0]])).toBeNull();
    expect(readPartyRoster(3, [3, 5], [['Pim', 100]])).toBeNull();
  });

  it('rejects more than three helpers', () => {
    const h: [string, number][] = [['A', 1], ['B', 1], ['C', 1], ['D', 1]];
    expect(readPartyRoster(3, [3, 5], h)).toBeNull();
  });
});

describe('readPartyChat', () => {
  it('trims and caps at 120 characters', () => {
    expect(readPartyChat('  hi there  ')).toBe('hi there');
    expect(readPartyChat('a'.repeat(200))).toHaveLength(120);
  });

  it('returns null for blank text and non-strings', () => {
    expect(readPartyChat('   ')).toBeNull();
    expect(readPartyChat(7)).toBeNull();
  });
});

describe('readEmoteId', () => {
  it('accepts known emotes and rejects unknown ones', () => {
    expect(readEmoteId('wave')).toBe('wave');
    expect(readEmoteId('moonwalk-nope')).toBeNull();
  });
});
