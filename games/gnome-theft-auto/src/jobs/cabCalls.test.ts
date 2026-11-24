import { describe, expect, it } from 'vitest';
import { CAB_CMD, decodeDropArgs } from './protocol';
import {
  CALL_TTL_MS, callKey, driverEnd, driverForget, driverIdle, driverSee, driverStatus, driverTake,
  openCalls, riderCall, riderCommand, riderIdle, riderTick, riderWire,
} from './cabCalls';

const RIDER = 5;
const DRIVER = 9;
const OTHER_DRIVER = 8;

describe('cab call happy path', () => {
  it('goes from call to paid through a driver', () => {
    const r = riderIdle();
    expect(riderCall(r, 'Gnome', 1, 2, 'dust-flats', 1000)).toBe(true);
    expect(r.phase).toBe('calling');
    expect(r.id).toBe(1);

    const d = driverIdle();
    driverSee(d, RIDER, riderWire(r)!, 1000);
    const open = openCalls(d, 0, 0);
    expect(open.length).toBe(1);

    const key = callKey(RIDER, 1);
    expect(driverTake(d, key)).toEqual({ owner: RIDER, id: 1 });

    const note = riderCommand(r, DRIVER, 1, CAB_CMD.take, null, 1100);
    expect(note).toEqual({ t: 'assigned', driver: DRIVER });
    expect(r.phase).toBe('assigned');

    const assigned = riderWire(r)!;
    expect(assigned.takenBy).toBe(DRIVER);
    expect(assigned.state).toBe(1);
    driverSee(d, RIDER, assigned, 1100);
    expect(driverStatus(d, DRIVER)).toBe('ok');

    expect(riderTick(r, 1200, DRIVER)).toEqual({ t: 'riding', driver: DRIVER });
    expect(r.phase).toBe('riding');

    const drop = decodeDropArgs([120, 3]);
    expect(riderCommand(r, DRIVER, 1, CAB_CMD.drop, drop, 1300)).toEqual({
      t: 'paid', driver: DRIVER, fare: 120, stars: 3,
    });
    expect(r.phase).toBe('idle');
    expect(driverEnd(d)).toEqual({ owner: RIDER, id: 1 });
  });
});

describe('two drivers take the same call', () => {
  it('the second take is ignored and the second driver is told it was lost', () => {
    const r = riderIdle();
    riderCall(r, 'Gnome', 0, 0, 'dust-flats', 0);
    const dA = driverIdle();
    const dB = driverIdle();
    const wire = riderWire(r)!;
    driverSee(dA, RIDER, wire, 0);
    driverSee(dB, RIDER, wire, 0);
    expect(driverTake(dA, callKey(RIDER, 1))).not.toBeNull();
    expect(driverTake(dB, callKey(RIDER, 1))).not.toBeNull();

    expect(riderCommand(r, OTHER_DRIVER, 1, CAB_CMD.take, null, 10)).toEqual({ t: 'assigned', driver: OTHER_DRIVER });
    expect(riderCommand(r, DRIVER, 1, CAB_CMD.take, null, 11)).toBeNull();
    expect(r.driver).toBe(OTHER_DRIVER);

    driverSee(dB, RIDER, riderWire(r)!, 11);
    expect(driverStatus(dB, DRIVER)).toBe('lost');
    expect(dB.job).toBeNull();
  });
});

describe('expiry and giveup', () => {
  it('expires an untaken call after CALL_TTL_MS', () => {
    const r = riderIdle();
    riderCall(r, 'Gnome', 0, 0, 'dust-flats', 1000);
    expect(riderTick(r, 1000 + CALL_TTL_MS, null)).toBeNull();
    expect(riderTick(r, 1000 + CALL_TTL_MS + 1, null)).toEqual({ t: 'expired' });
    expect(r.phase).toBe('idle');
  });

  it('giving up re-opens the call', () => {
    const r = riderIdle();
    riderCall(r, 'Gnome', 0, 0, 'dust-flats', 0);
    riderCommand(r, DRIVER, 1, CAB_CMD.take, null, 10);
    expect(riderCommand(r, DRIVER, 1, CAB_CMD.giveup, null, 500)).toEqual({ t: 'reopened' });
    expect(r.phase).toBe('calling');
    expect(r.driver).toBeNull();
    expect(r.at).toBe(500);
    const wire = riderWire(r)!;
    expect(wire.state).toBe(0);
    expect(wire.takenBy).toBeNull();
  });
});

describe('leaving the seat and forgetting a call', () => {
  it('leaving the seat while riding gives left and idles the rider', () => {
    const r = riderIdle();
    riderCall(r, 'Gnome', 0, 0, 'dust-flats', 0);
    riderCommand(r, DRIVER, 1, CAB_CMD.take, null, 10);
    riderTick(r, 20, DRIVER);
    expect(riderTick(r, 30, null)).toEqual({ t: 'left' });
    expect(r.phase).toBe('idle');
  });

  it('driverForget makes the job gone', () => {
    const r = riderIdle();
    riderCall(r, 'Gnome', 0, 0, 'dust-flats', 0);
    const d = driverIdle();
    driverSee(d, RIDER, riderWire(r)!, 0);
    expect(driverTake(d, callKey(RIDER, 1))).not.toBeNull();
    driverForget(d, RIDER, 1);
    expect(driverStatus(d, DRIVER)).toBe('gone');
    expect(d.job).toBeNull();
  });
});
