import { describe, it, expect } from 'vitest';
import type { CourseId, KartState, RaceState, VehicleId } from './config';
import { COURSE_ORDER } from './courses';
import { createRace, cpuInput, stepRace } from './sim';
import { GHOST_HZ, createRecorder, ghostDone, isBetter, parseGhostRun, poseAt, splitTimes, type GhostRun } from './ghost';
import { createLocalGhostStore, ghostKey } from './ghostStore';

const STEP = 1 / 60;

/** A solo time trial driven by the CPU driver; records it and returns the finished run. */
function soloRun(course: CourseId, vehicle: VehicleId, skill = 1): { run: GhostRun | null; race: RaceState } {
  const race = createRace([{ vehicle, skill }], course);
  race.boxes = race.boxes.map(() => Infinity);
  const rec = createRecorder();
  rec.push(race.karts[0], 0);
  const lapTimes: number[] = [];
  for (let i = 0; i < 400 * 60 && race.karts[0].fin === null; i++) {
    const lap = race.karts[0].lap;
    stepRace(race, [cpuInput(race, 0)], STEP);
    rec.push(race.karts[0], race.t);
    if (race.karts[0].lap > lap) lapTimes.push(race.t);
  }
  const run = rec.finish({ course, vehicle, laps: race.laps, lapTimes, fin: race.karts[0].fin, color: 0xff0000,
    gnome: null, name: 'Gnorman', at: '2026-01-01T00:00:00.000Z' });
  return { run, race };
}

function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('recording a run', () => {
  it.each(COURSE_ORDER)('records a finished 3-lap run on %s that validates', (course) => {
    const { run, race } = soloRun(course, 'cart');
    expect(run).not.toBeNull();
    const r = run as GhostRun;
    expect(r.lapMs).toHaveLength(3);
    expect(r.lapMs.reduce((a, b) => a + b, 0)).toBe(r.totalMs);
    expect(r.totalMs).toBe(Math.round((race.karts[0].fin as number) * 1000));
    // One sample per 1/hz of race time, up to the line.
    expect(r.samples.length / 4).toBeGreaterThanOrEqual(Math.floor(r.totalMs / 1000 * GHOST_HZ));
    expect(parseGhostRun(JSON.parse(JSON.stringify(r)))).toEqual(r);
  });

  it('stays small enough to keep: a 3-lap run is under 80 KB of JSON', () => {
    const { run } = soloRun('garden', 'cart');
    expect(JSON.stringify(run).length).toBeLessThan(80_000);
  });

  it('gives no run for a kart that never finished', () => {
    const race = createRace([{ vehicle: 'bike', skill: 1 }], 'garden');
    const rec = createRecorder();
    rec.push(race.karts[0], 0);
    expect(rec.finish({ course: 'garden', vehicle: 'bike', laps: 3, lapTimes: [], fin: null, color: 1, gnome: null, name: 'x', at: 'now' })).toBeNull();
  });

  it('is deterministic: the same inputs give the same ghost', () => {
    const a = soloRun('panic', 'bike').run;
    const b = soloRun('panic', 'bike').run;
    expect(a?.samples).toEqual(b?.samples);
    expect(a?.totalMs).toBe(b?.totalMs);
  });
});

describe('playing a run back', () => {
  it('puts the ghost where the kart was, at every sample time', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }], 'garden');
    const rec = createRecorder();
    const seen: { t: number; x: number; z: number }[] = [];
    rec.push(race.karts[0], 0);
    seen.push({ t: 0, x: race.karts[0].x, z: race.karts[0].z });
    for (let i = 0; i < 400 * 60 && race.karts[0].fin === null; i++) {
      stepRace(race, [cpuInput(race, 0)], STEP);
      rec.push(race.karts[0], race.t);
    }
    const run = rec.finish({ course: 'garden', vehicle: 'cart', laps: 3, lapTimes: [30, 60, race.t], fin: race.karts[0].fin, color: 1, gnome: null, name: 'x', at: 'now' }) as GhostRun;
    const out = { ...race.karts[0] } as KartState;
    expect(poseAt(run, 0, out).x).toBeCloseTo(seen[0].x, 1);
    expect(poseAt(run, 0, out).z).toBeCloseTo(seen[0].z, 1);
    // Mid-run: the ghost is on the track, moving.
    const mid = poseAt(run, run.totalMs / 2000, out);
    expect(Math.hypot(mid.vx, mid.vz)).toBeGreaterThan(1);
  });

  it('interpolates between samples and parks on the last one', () => {
    const { run } = soloRun('garden', 'cart');
    const r = run as GhostRun;
    const out = createRace([{ vehicle: 'cart', skill: 1 }], 'garden').karts[0];
    const a = { ...poseAt(r, 5, out) };
    const half = { ...poseAt(r, 5 + 0.5 / GHOST_HZ, out) };
    const b = { ...poseAt(r, 5 + 1 / GHOST_HZ, out) };
    expect(half.x).toBeCloseTo((a.x + b.x) / 2, 1);
    expect(half.z).toBeCloseTo((a.z + b.z) / 2, 1);
    expect(ghostDone(r, 5)).toBe(false);
    const end = { ...poseAt(r, 9999, out) };
    expect(poseAt(r, 99999, out).x).toBe(end.x);
    expect(ghostDone(r, 9999)).toBe(true);
  });

  it('turns the short way round when the heading wraps', () => {
    const run: GhostRun = { v: 1, course: 'garden', vehicle: 'cart', laps: 1, totalMs: 1000, lapMs: [1000], color: 0, gnome: null,
      name: 'x', at: 'now', hz: 20, samples: [0, 0, 3100, 0, 0, 0, -3100, 0] };
    const out = createRace([{ vehicle: 'cart', skill: 1 }], 'garden').karts[0];
    // 3.1 rad to -3.1 rad is a 0.083 rad turn through PI, not a 6.2 rad swing back through 0.
    const h = poseAt(run, 0.5 / 20, out).h;
    expect(Math.abs(h)).toBeGreaterThan(3.1);
  });

  it('splits sum to the finish time', () => {
    const { run } = soloRun('front', 'cart');
    const splits = splitTimes(run as GhostRun);
    expect(splits).toHaveLength(3);
    expect(splits[2]).toBeCloseTo((run as GhostRun).totalMs / 1000, 3);
  });
});

describe('parseGhostRun', () => {
  const good = (): GhostRun => ({ v: 1, course: 'garden', vehicle: 'cart', laps: 3, totalMs: 60000, lapMs: [20000, 20000, 20000],
    color: 0xff0000, gnome: null, name: 'Gnorman', at: 'now', hz: 20, samples: [0, 0, 0, 0, 1, 1, 1, 0] });

  it('accepts a good run', () => {
    expect(parseGhostRun(good())).toEqual(good());
  });

  it.each([
    ['null', null],
    ['a string', 'ghost'],
    ['a future version', { ...good(), v: 2 }],
    ['an unknown course', { ...good(), course: 'moon' }],
    ['an unknown vehicle', { ...good(), vehicle: 'rocket' }],
    ['a zero time', { ...good(), totalMs: 0 }],
    ['an absurd time', { ...good(), totalMs: 1e9 }],
    ['lap times that do not match the laps', { ...good(), lapMs: [60000] }],
    ['samples of the wrong width', { ...good(), samples: [0, 0, 0, 0, 1] }],
    ['samples with a non-number', { ...good(), samples: [0, 0, 0, 0, 1, 1, 1, 'x'] }],
    ['too few samples', { ...good(), samples: [0, 0, 0, 0] }],
    ['NaN samples', { ...good(), samples: [0, 0, 0, 0, 1, 1, 1, NaN] }],
  ])('rejects %s', (_name, raw) => {
    expect(parseGhostRun(raw)).toBeNull();
  });
});

describe('the local ghost store', () => {
  it('has no ghost at first, keeps a first run, and loads it back', async () => {
    const store = createLocalGhostStore(fakeStorage());
    expect(await store.load('garden', 'cart')).toBeNull();
    const run = soloRun('garden', 'cart').run as GhostRun;
    expect(await store.save(run)).toBe(true);
    expect(await store.load('garden', 'cart')).toEqual(run);
  });

  it('keeps only a faster run', async () => {
    const storage = fakeStorage();
    const store = createLocalGhostStore(storage);
    const run = soloRun('garden', 'cart').run as GhostRun;
    await store.save(run);
    expect(await store.save({ ...run, totalMs: run.totalMs + 500 })).toBe(false);
    expect(await store.save({ ...run, totalMs: run.totalMs })).toBe(false); // a tie is not a new best
    expect(await store.save({ ...run, totalMs: run.totalMs - 500, lapMs: run.lapMs.map((m, i) => (i === 0 ? m - 500 : m)) })).toBe(true);
    expect((await store.load('garden', 'cart'))?.totalMs).toBe(run.totalMs - 500);
  });

  it('keeps a best per course and per vehicle', async () => {
    const store = createLocalGhostStore(fakeStorage());
    const a = soloRun('garden', 'cart').run as GhostRun;
    const b = soloRun('garden', 'bike').run as GhostRun;
    await store.save(a);
    await store.save(b);
    expect((await store.load('garden', 'cart'))?.vehicle).toBe('cart');
    expect((await store.load('garden', 'bike'))?.vehicle).toBe('bike');
    expect(await store.load('panic', 'cart')).toBeNull();
  });

  it('ignores corrupt or misplaced stored data', async () => {
    const storage = fakeStorage();
    const store = createLocalGhostStore(storage);
    storage.data.set(ghostKey('garden', 'cart'), '{not json');
    expect(await store.load('garden', 'cart')).toBeNull();
    const run = soloRun('panic', 'cart').run as GhostRun;
    storage.data.set(ghostKey('garden', 'cart'), JSON.stringify(run)); // a panic run under the garden key
    expect(await store.load('garden', 'cart')).toBeNull();
  });

  it('survives blocked storage', async () => {
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const store = createLocalGhostStore(throwing);
    expect(await store.load('garden', 'cart')).toBeNull();
    expect(await store.save(soloRun('garden', 'cart').run as GhostRun)).toBe(false);
    expect(await createLocalGhostStore(null).load('garden', 'cart')).toBeNull();
  });
});

describe('isBetter', () => {
  it('is true with no best, and only for a strictly faster time', () => {
    expect(isBetter({ totalMs: 5 }, null)).toBe(true);
    expect(isBetter({ totalMs: 5 }, { totalMs: 6 })).toBe(true);
    expect(isBetter({ totalMs: 6 }, { totalMs: 6 })).toBe(false);
  });
});

describe('recordCpuGhost (the #seedghost demo hook)', () => {
  it('makes a valid ghost for every course', async () => {
    const { recordCpuGhost } = await import('./ghostSeed');
    for (const course of COURSE_ORDER) {
      for (const vehicle of ['cart', 'bike'] as const) {
        const run = recordCpuGhost(course, vehicle, 0x2255ff);
        expect(run, course + vehicle).not.toBeNull();
        expect(parseGhostRun(run)).toEqual(run);
      }
    }
  });
});
