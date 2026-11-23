import { describe, expect, it } from 'vitest';
import { decodePitch, encodePitch, encodePose, parseMsg, PITCH_MAX, poseFromArray, type GtaMsg, type RemotePose } from './net';
import { easePitch } from './remotes';

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

  it('reads a gun code and rejects anything else', () => {
    expect(parseMsg({ k: 'gun', c: '3-o2m0' })).toEqual({ k: 'gun', c: '3-o2m0' });
    expect(parseMsg({ k: 'gun', c: '0-' })).toEqual({ k: 'gun', c: '0-' });
    expect(parseMsg({ k: 'gun', c: 'x-1' })).toBeNull();
    expect(parseMsg({ k: 'gun', c: '3-' + 'a'.repeat(40) })).toBeNull();
    expect(parseMsg({ k: 'gun', c: 3 })).toBeNull();
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

describe('aim pitch on the wire', () => {
  const pose: RemotePose = {
    x: 12.345, y: 0.5, z: -40.2, yaw: 1.1, veh: -1, tint: 0,
    moving: true, aiming: true, hurt: false, chute: false, ride: null, pitch: 0.42,
  };
  /** Sender -> JSON on the relay -> receiver, as createNet does it. */
  const roundTrip = (p: RemotePose): RemotePose => {
    const w = encodePose(p);
    const msg = parseMsg(JSON.parse(JSON.stringify({ k: 'pos', p: w.p, t: 5, a: w.a }))) as Extract<GtaMsg, { k: 'pos' }>;
    expect(msg).not.toBeNull();
    return poseFromArray(msg.p, msg.a);
  };

  it('round-trips the pitch to within one byte step', () => {
    for (const pitch of [-1.2, -0.7, -0.01, 0, 0.3, 0.42, 1.19]) {
      const back = roundTrip({ ...pose, pitch });
      expect(Math.abs(back.pitch - pitch)).toBeLessThanOrEqual(PITCH_MAX / 127 / 2 + 1e-9);
      expect(back.aiming).toBe(true);
      expect(back.x).toBeCloseTo(12.35, 5);
    }
  });

  it('fits a signed byte and clamps out-of-range pitches', () => {
    expect(encodePitch(5)).toBe(127);
    expect(encodePitch(-5)).toBe(-127);
    expect(encodePitch(Number.NaN)).toBe(0);
    expect(decodePitch(127)).toBeCloseTo(PITCH_MAX, 9);
  });

  it('sends no pitch when not aiming, and reads it as level', () => {
    const w = encodePose({ ...pose, aiming: false });
    expect(w.a).toBeUndefined();
    expect(roundTrip({ ...pose, aiming: false }).pitch).toBe(0);
  });

  it('keeps older clients working both ways', () => {
    // An old client's pose (no pitch field) reads as level.
    const old = parseMsg({ k: 'pos', p: base, t: 1 }) as Extract<GtaMsg, { k: 'pos' }>;
    expect(old.a).toBeUndefined();
    expect(poseFromArray(old.p, old.a).pitch).toBe(0);
    // The new pose keeps the 12-number array an old parser accepts; the pitch rides in its own field.
    expect(encodePose(pose).p).toHaveLength(12);
    // A bad pitch is dropped, not the whole pose.
    for (const a of [200, 1.5, '3', null]) {
      const m = parseMsg({ k: 'pos', p: base, t: 1, a }) as Extract<GtaMsg, { k: 'pos' }>;
      expect(m).not.toBeNull();
      expect(m.a).toBeUndefined();
    }
  });

  it('eases the shown pitch toward the received one without overshoot', () => {
    let shown = 0;
    for (let i = 0; i < 6; i++) {
      const next = easePitch(shown, 0.8, 1 / 60);
      expect(next).toBeGreaterThan(shown);
      expect(next).toBeLessThan(0.8);
      shown = next;
    }
    for (let i = 0; i < 60; i++) shown = easePitch(shown, 0.8, 1 / 60);
    expect(shown).toBeCloseTo(0.8, 3);
  });
});
