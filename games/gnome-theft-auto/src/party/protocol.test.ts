import { describe, expect, it } from 'vitest';
import { parseMsg } from '../net';
import { newPartyCode, normaliseCode, parsePartyMsg, PARTY_CODE_RE } from './protocol';

describe('party protocol', () => {
  it('makes valid codes and reads typed ones', () => {
    for (let i = 0; i < 50; i++) expect(newPartyCode()).toMatch(PARTY_CODE_RE);
    expect(normaliseCode(' bcdf ')).toBe('BCDF');
    expect(normaliseCode('ABCD')).toBeNull(); // vowels are never in a code
    expect(normaliseCode('BCD')).toBeNull();
  });

  it('parses good messages and drops bad ones', () => {
    expect(parsePartyMsg({ o: 'code', c: '' })).toEqual({ o: 'code', c: '' });
    expect(parsePartyMsg({ o: 'code', c: 'BCDF' })).toEqual({ o: 'code', c: 'BCDF' });
    expect(parsePartyMsg({ o: 'code', c: 'nope' })).toBeNull();
    expect(parsePartyMsg({ o: 'inv', c: '' })).toBeNull();
    expect(parsePartyMsg({ o: 'say', m: '   ' })).toBeNull();
    expect(parsePartyMsg({ o: 'say', m: 'meet at the pier' })).toEqual({ o: 'say', m: 'meet at the pier' });
    expect(parsePartyMsg({ o: 'ping', x: 10, z: -20 })).toEqual({ o: 'ping', x: 10, z: -20 });
    expect(parsePartyMsg({ o: 'ping', x: 9999, z: 0 })).toBeNull();
    expect(parsePartyMsg(null)).toBeNull();
  });

  it('rides net.ts as k: pty', () => {
    expect(parseMsg({ k: 'pty', d: { o: 'inv', c: 'GHJK' } })).toEqual({ k: 'pty', d: { o: 'inv', c: 'GHJK' } });
    expect(parseMsg({ k: 'pty', d: { o: 'bogus' } })).toBeNull();
  });
});
