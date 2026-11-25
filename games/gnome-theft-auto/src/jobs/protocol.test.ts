import { describe, expect, it } from 'vitest';
import {
  CAB_STATE, JOB_WIRE, TOW_EMPTY, TOW_NPC,
  decodeCab, decodeDropArgs, decodePax, decodeTow, encodeCab, encodePax, encodeTow,
} from './protocol';

describe('cab wire', () => {
  it('round-trips a call within quantization', () => {
    const c = { id: 3, x: 12.34, z: -56.78, takenBy: 7, state: CAB_STATE.assigned, dest: 'dust-flats', name: 'Gnome Bob' };
    const { rec, str } = encodeCab(c);
    const back = decodeCab(rec, str);
    expect(back).not.toBeNull();
    expect(back!.id).toBe(3);
    expect(Math.abs(back!.x - c.x)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(back!.z - c.z)).toBeLessThanOrEqual(0.05);
    expect(back!.takenBy).toBe(7);
    expect(back!.state).toBe(CAB_STATE.assigned);
    expect(back!.dest).toBe('dust-flats');
    expect(back!.name).toBe('Gnome Bob');
  });

  it('encodes an open call as takenBy -1 and decodes it as null', () => {
    const { rec, str } = encodeCab({ id: 1, x: 0, z: 0, takenBy: null, state: CAB_STATE.open, dest: 'a', name: 'b' });
    expect(rec[3]).toBe(-1);
    expect(decodeCab(rec, str)!.takenBy).toBeNull();
  });

  it('decodes a missing string as empty dest and name', () => {
    const back = decodeCab([1, 0, 0, -1, 0], undefined);
    expect(back).not.toBeNull();
    expect(back!.dest).toBe('');
    expect(back!.name).toBe('');
  });

  it('removes | and cuts the name to maxName characters', () => {
    const name = 'Q|' + 'x'.repeat(38); // 40 characters
    const { str } = encodeCab({ id: 1, x: 0, z: 0, takenBy: null, state: 0, dest: 'dust-flats', name });
    const encodedName = str.slice('dust-flats|'.length);
    expect(encodedName.length).toBe(JOB_WIRE.maxName);
    expect(encodedName.includes('|')).toBe(false);
  });
});

describe('malformed records decode to null', () => {
  it('rejects bad cab records', () => {
    expect(decodeCab([1, 0, 0, -1], 'a|b')).toBeNull(); // length 4
    expect(decodeCab([1, 0, 0, -1, 0, 0], 'a|b')).toBeNull(); // length 6
    expect(decodeCab([0, 0, 0, -1, 0], 'a|b')).toBeNull(); // id 0
    expect(decodeCab([JOB_WIRE.maxId + 1, 0, 0, -1, 0], 'a|b')).toBeNull(); // id too big
    expect(decodeCab([1, 0, 0, -2, 0], 'a|b')).toBeNull(); // takenBy below -1
    expect(decodeCab([1, 0, 0, -1, 3], 'a|b')).toBeNull(); // state not a CAB_STATE
    expect(decodeCab([1, 1.5, 0, -1, 0], 'a|b')).toBeNull(); // non-integer x
    expect(decodeCab([1, 0, 0, -1, 0], 'Bad Dest|Bob')).toBeNull(); // dest fails destRe
    expect(decodeCab([1, 0, 0, -1, 0], 'dust|')).toBeNull(); // empty name
    expect(decodeCab([1, 0, 0, -1, 0], `dust|${'n'.repeat(JOB_WIRE.maxName + 1)}`)).toBeNull(); // name too long
    expect(decodeCab([1, 0, 0, -1, 0], 'dust-flats')).toBeNull(); // no | separator
  });

  it('rejects bad drop args', () => {
    expect(decodeDropArgs([10])).toBeNull();
    expect(decodeDropArgs([10.5, 2])).toBeNull();
  });

  it('rejects bad pax records', () => {
    expect(decodePax([1, 2, 3])).toBeNull(); // odd pair count
    expect(decodePax([1, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])).toBeNull(); // five pairs
    expect(decodePax([1, 0, 0, 5])).toBeNull(); // seat 0
    expect(decodePax([1, 0, 1, JOB_WIRE.maxSeed + 1])).toBeNull(); // seed too big
    expect(decodePax([1, JOB_WIRE.maxParcels + 1])).toBeNull(); // parcels out of bounds
    expect(decodePax([2, 0])).toBeNull(); // wrong tag
  });

  it('rejects bad tow records', () => {
    const good = encodeTow({ on: true, mode: 'tube', score: 1, gates: 1, slots: [] });
    expect(decodeTow(good.slice(0, 15))).toBeNull(); // length 15
    expect(decodeTow([1, 1, 0, 0, -3, 0, 0, 0, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0])).toBeNull(); // who < -2
    expect(decodeTow([1, 3, 0, 0, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0])).toBeNull(); // on = 3
    expect(decodeTow([1, 0, JOB_WIRE.maxPoints + 1, 0, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0])).toBeNull();
    expect(decodeTow([1, 0, 0, JOB_WIRE.maxGates + 1, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0, TOW_EMPTY, 0, 0, 0])).toBeNull();
  });
});

describe('pax wire', () => {
  it('round-trips seats and parcels', () => {
    const p = { parcels: 3, seats: [[2, 42], [7, 9999]] as [number, number][] };
    const rec = encodePax(p);
    expect(rec).toEqual([1, 3, 2, 42, 7, 9999]);
    expect(decodePax(rec)).toEqual(p);
  });

  it('clamps values and drops seats past the cap', () => {
    const rec = encodePax({
      parcels: 99,
      seats: [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
    });
    expect(rec[1]).toBe(JOB_WIRE.maxParcels);
    expect(rec.length).toBe(2 + JOB_WIRE.maxPaxSeats * 2);
  });
});

describe('tow wire', () => {
  it('round-trips score, gates and slots', () => {
    const t = {
      on: true,
      mode: 'tube' as const,
      score: 1234,
      gates: 5,
      slots: [
        { who: 4, x: 1.23, z: -4.56, yaw: 1.0 },
        { who: TOW_NPC, x: -7.8, z: 2.1, yaw: -2.0 },
        { who: TOW_EMPTY, x: 0, z: 0, yaw: 0 },
      ],
    };
    const rec = encodeTow(t);
    expect(rec.length).toBe(16);
    const back = decodeTow(rec)!;
    expect(back.on).toBe(true);
    expect(back.score).toBe(1234);
    expect(back.gates).toBe(5);
    expect(back.slots.length).toBe(JOB_WIRE.slots);
    for (let i = 0; i < 2; i++) {
      expect(back.slots[i].who).toBe(t.slots[i].who);
      expect(Math.abs(back.slots[i].x - t.slots[i].x)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(back.slots[i].z - t.slots[i].z)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(back.slots[i].yaw - t.slots[i].yaw)).toBeLessThanOrEqual(0.03);
    }
  });

  it('round-trips each mode in the on number', () => {
    for (const [mode, on] of [['tube', 1], ['ski', 2]] as const) {
      const rec = encodeTow({ on: true, mode, score: 0, gates: 0, slots: [] });
      expect(rec[1]).toBe(on);
      const back = decodeTow(rec)!;
      expect(back.on).toBe(true);
      expect(back.mode).toBe(mode);
    }
    const off = decodeTow(encodeTow({ on: false, mode: 'ski', score: 0, gates: 0, slots: [] }))!;
    expect(off.on).toBe(false);
    expect(off.mode).toBe('tube');
  });

  it('encodes missing slots as empty', () => {
    const rec = encodeTow({ on: false, mode: 'tube', score: 0, gates: 0, slots: [{ who: 9, x: 0, z: 0, yaw: 0 }] });
    expect(rec.slice(8, 12)).toEqual([TOW_EMPTY, 0, 0, 0]);
    expect(rec.slice(12, 16)).toEqual([TOW_EMPTY, 0, 0, 0]);
    expect(decodeTow(rec)!.slots[1].who).toBe(TOW_EMPTY);
  });
});
