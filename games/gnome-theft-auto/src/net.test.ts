import { describe, expect, it } from 'vitest';
import { parseMsg, poseFromArray } from './net';

const pos = (p: number[]) => ({ k: 'pos', p, t: 1 });
const base = [10, 0, -20, 1.2, -1, 0, 0, 0, 0, 0];

describe('parseMsg', () => {
  it('reads the small messages', () => {
    expect(parseMsg({ k: 'hit' })).toEqual({ k: 'hit' });
    expect(parseMsg({ k: 'board' })).toEqual({ k: 'board' });
    expect(parseMsg({ k: 'leave' })).toEqual({ k: 'leave' });
  });

  it('reads a seat answer: a seat index, or -1 for no room', () => {
    expect(parseMsg({ k: 'seat', s: 2 })).toEqual({ k: 'seat', s: 2 });
    expect(parseMsg({ k: 'seat', s: -1 })).toEqual({ k: 'seat', s: -1 });
    expect(parseMsg({ k: 'seat', s: 8 })).toBeNull();
    expect(parseMsg({ k: 'seat', s: -2 })).toBeNull();
    expect(parseMsg({ k: 'seat', s: 1.5 })).toBeNull();
    expect(parseMsg({ k: 'seat' })).toBeNull();
  });

  it('accepts poses from older clients (9 or 10 numbers) and the newer 12', () => {
    expect(parseMsg(pos(base.slice(0, 9)))).not.toBeNull();
    expect(parseMsg(pos(base.slice(0, 10)))).not.toBeNull();
    expect(parseMsg(pos([...base, -1, 0]))).not.toBeNull();
    expect(parseMsg(pos([...base, 4, 2]))).not.toBeNull();
  });

  it('rejects a ride with a bad seat or host', () => {
    expect(parseMsg(pos([...base, 4, 8]))).toBeNull();
    expect(parseMsg(pos([...base, 4, -1]))).toBeNull();
    expect(parseMsg(pos([...base, -2, 0]))).toBeNull();
    expect(parseMsg(pos([...base, 4.5, 1]))).toBeNull();
  });

  it('still rejects poses with the wrong length', () => {
    expect(parseMsg(pos([...base, 1]))).toBeNull();
    expect(parseMsg(pos([...base, 1, 1, 1]))).toBeNull();
  });

  it('reads radio and banger messages and rejects out-of-range values', () => {
    expect(parseMsg({ k: 'radio', st: 0 })).toEqual({ k: 'radio', st: 0 });
    expect(parseMsg({ k: 'radio', st: -1 })).toEqual({ k: 'radio', st: -1 });
    expect(parseMsg({ k: 'radio', st: 4 })).toBeNull();
    expect(parseMsg({ k: 'radio', st: -2 })).toBeNull();

    expect(parseMsg({ k: 'banger', st: 2, song: 5 })).toEqual({ k: 'banger', st: 2, song: 5 });
    expect(parseMsg({ k: 'banger', st: -1, song: 0 })).toBeNull();
    expect(parseMsg({ k: 'banger', st: 1, song: 32 })).toBeNull();
    expect(parseMsg({ k: 'banger', st: 1, song: -1 })).toBeNull();
  });

  it('reads a look code and rejects anything else', () => {
    expect(parseMsg({ k: 'look', c: 'g1.abc' })).toEqual({ k: 'look', c: 'g1.abc' });
    expect(parseMsg({ k: 'look', c: '' })).toEqual({ k: 'look', c: '' });
    expect(parseMsg({ k: 'look', c: 5 })).toBeNull();
    expect(parseMsg({ k: 'look', c: 'a'.repeat(200) })).toBeNull();
    expect(parseMsg({ k: 'look', c: 'g1 abc' })).toBeNull();
    expect(parseMsg({ k: 'look', c: 'g1<abc' })).toBeNull();
  });
});

describe('poseFromArray', () => {
  it('a 9 or 10 number pose is not riding', () => {
    expect(poseFromArray(base.slice(0, 9)).ride).toBeNull();
    expect(poseFromArray(base.slice(0, 10)).ride).toBeNull();
  });

  it('host -1 is not riding', () => {
    expect(poseFromArray([...base, -1, 0]).ride).toBeNull();
  });

  it('a rider has the driver id and their seat', () => {
    expect(poseFromArray([...base, 7, 3]).ride).toEqual({ host: 7, seat: 3 });
  });
});
