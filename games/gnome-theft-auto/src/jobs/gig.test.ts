import { describe, expect, it } from 'vitest';
import { loaded, startGig, stepGig } from './gig';
import type { Gig, Sample, Stop } from './types';

function sample(over: Partial<Sample> = {}): Sample {
  return {
    x: 0, y: 0, z: 0, speed: 0, yaw: 0, vy: 0, aboveGround: 0, hpLoss: 0, ranOver: false, waveSlope: 0,
    stalled: false, action: false, inVehicle: true, playerAboard: false, ...over,
  };
}

function gigOf(stops: Stop[], over: Partial<Gig> = {}): Gig {
  return {
    job: 'taxi', kind: 'fare', title: 'Test', client: 'Tester', personality: 'plain', stops, basePay: 50,
    timeLimit: 0, passengers: 1, parcels: [], seed: 1, ...over,
  };
}

const pickup: Stop = { id: 'a', name: 'A', x: 0, z: 0, action: 'pickup', radius: 7, maxSpeed: 2.5, dwell: 0.8 };
const drop: Stop = { id: 'b', name: 'B', x: 100, z: 0, action: 'drop', radius: 9, maxSpeed: 2.5, dwell: 0.8 };

describe('stepGig: pickup and drop', () => {
  it('reaches a dwell stop after the dwell time, within the speed limit', () => {
    const st = startGig(gigOf([pickup, drop]));
    let frames = 0;
    let ev = null;
    while (!ev && frames < 30) { ev = stepGig(st, sample(), 0.1, false); frames++; }
    expect(ev).toEqual({ t: 'reached', stop: 0 });
    expect(frames).toBeGreaterThanOrEqual(8);
    expect(frames).toBeLessThanOrEqual(9);
  });

  it('does not count while faster than the speed limit', () => {
    const st = startGig(gigOf([pickup, drop]));
    for (let i = 0; i < 20; i++) expect(stepGig(st, sample({ speed: 5 }), 0.1, false)).toBeNull();
    expect(st.idx).toBe(0);
  });

  it('resets the dwell when the vehicle leaves the stop', () => {
    const st = startGig(gigOf([pickup, drop]));
    for (let i = 0; i < 5; i++) stepGig(st, sample(), 0.1, false);
    stepGig(st, sample({ x: 50 }), 0.1, false);
    for (let i = 0; i < 5; i++) expect(stepGig(st, sample(), 0.1, false)).toBeNull();
    expect(st.idx).toBe(0);
  });

  it('completes a two-stop fare with done', () => {
    const st = startGig(gigOf([pickup, drop]));
    for (let i = 0; i < 20 && st.idx === 0; i++) stepGig(st, sample(), 0.1, false);
    expect(st.idx).toBe(1);
    expect(loaded(st)).toBe(true);
    let ev = null;
    for (let i = 0; i < 30 && !ev; i++) ev = stepGig(st, sample({ x: 100 }), 0.1, false);
    expect(ev).toEqual({ t: 'done' });
    expect(st.phase).toBe('done');
    expect(st.reachedAt.length).toBe(2);
  });

  it('does nothing once the gig is no longer running', () => {
    const st = startGig(gigOf([pickup]));
    st.phase = 'done';
    expect(stepGig(st, sample(), 0.1, false)).toBeNull();
    expect(st.t).toBe(0);
  });
});

describe('stepGig: failures', () => {
  it('fails at a hard deadline with its reason', () => {
    const late: Stop = { ...pickup, hardDue: 5, hardReason: 'Fare gave up.' };
    const st = startGig(gigOf([late, drop]));
    let ev = null;
    for (let i = 0; i < 100 && !ev; i++) ev = stepGig(st, sample({ x: 50 }), 0.1, false);
    expect(ev).toEqual({ t: 'failed', reason: 'Fare gave up.' });
    expect(st.phase).toBe('failed');
    expect(st.failReason).toBe('Fare gave up.');
  });

  it('uses a default reason for a hard deadline with none', () => {
    const st = startGig(gigOf([{ ...pickup, hardDue: 1 }]));
    let ev = null;
    for (let i = 0; i < 100 && !ev; i++) ev = stepGig(st, sample({ x: 50 }), 0.1, false);
    expect(ev).toEqual({ t: 'failed', reason: 'Too late.' });
  });

  it('fails after 20 seconds out of the vehicle', () => {
    const st = startGig(gigOf([pickup, drop]));
    let ev = null;
    let frames = 0;
    while (!ev && frames < 50) { ev = stepGig(st, sample({ inVehicle: false }), 1, false); frames++; }
    expect(ev).toEqual({ t: 'failed', reason: 'You left the vehicle.' });
    expect(frames).toBe(21);
  });

  it('resets the out-of-vehicle timer when back in the seat', () => {
    const st = startGig(gigOf([pickup, drop]));
    for (let i = 0; i < 15; i++) stepGig(st, sample({ inVehicle: false }), 1, false);
    stepGig(st, sample(), 1, false);
    expect(st.outT).toBe(0);
    expect(st.phase).toBe('running');
  });
});

describe('stepGig: stop kinds', () => {
  it('gate needs the aircraft inside the altitude band', () => {
    const gate: Stop = { id: 'g', name: 'Gate 1', x: 0, z: 0, action: 'gate', radius: 26, maxSpeed: 0, dwell: 0, minAlt: 12, maxAlt: 140 };
    const st = startGig(gigOf([gate], { job: 'pilot', kind: 'scenic' }));
    expect(stepGig(st, sample({ aboveGround: 5 }), 0.1, false)).toBeNull();
    expect(stepGig(st, sample({ aboveGround: 200 }), 0.1, false)).toBeNull();
    expect(stepGig(st, sample({ aboveGround: 50, x: 100 }), 0.1, false)).toBeNull();
    expect(stepGig(st, sample({ aboveGround: 50 }), 0.1, false)).toEqual({ t: 'done' });
  });

  it('cargo needs the job action pressed', () => {
    const cargo: Stop = { id: 'c', name: 'Drop zone', x: 0, z: 0, action: 'cargo', radius: 70, maxSpeed: 0, dwell: 0 };
    const st = startGig(gigOf([cargo], { job: 'pilot', kind: 'cargo' }));
    expect(stepGig(st, sample({ aboveGround: 30 }), 0.1, false)).toBeNull();
    expect(stepGig(st, sample({ aboveGround: 30, action: true }), 0.1, false)).toEqual({ t: 'done' });
    expect(st.scores[0]).toBe(100);
  });

  it('needsPlayer waits for the calling player to be aboard', () => {
    const fare: Stop = { ...pickup, needsPlayer: true, dwell: 0 };
    const st = startGig(gigOf([fare, drop], { kind: 'player-fare' }));
    expect(stepGig(st, sample({ playerAboard: false }), 0.1, false)).toBeNull();
    expect(stepGig(st, sample({ playerAboard: true }), 0.1, false)).toEqual({ t: 'reached', stop: 0 });
  });

  it('scores a land stop from the last airborne vertical speed', () => {
    const land: Stop = { id: 'l', name: 'Pad', x: 0, z: 0, action: 'land', radius: 10, maxSpeed: 3, dwell: 0 };
    const st = startGig(gigOf([land], { job: 'pilot', kind: 'charter' }));
    stepGig(st, sample({ aboveGround: 5, vy: -3 }), 0.1, false);
    expect(st.touchdownVy).toBe(-3);
    expect(stepGig(st, sample({ aboveGround: 0 }), 0.1, false)).toEqual({ t: 'done' });
    expect(st.scores[0]).toBe(84);
  });
});
