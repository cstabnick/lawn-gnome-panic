import { describe, expect, it } from 'vitest';
import {
  applyOffline, bedSecondsLeft, bedStatus, harvest, mergeFarm, newFarm, oakReady, oakSecondsLeft, parseFarm,
  plantCrop, plantOak, serializeFarm, shakeOak, stepFarm, waterBed,
} from './state';
import { cropDef, FARM } from './types';

const RADISH_STAGE = cropDef('radish').stageS;

describe('farm state', () => {
  it('starts with eight empty beds, no oak and seed radish', () => {
    const s = newFarm(5);
    expect(s.beds).toHaveLength(8);
    expect(s.beds.every((b) => b.crop === null)).toBe(true);
    expect(s.oak.planted).toBe(false);
    expect(s.seed).toBe('radish');
    expect(s.savedAt).toBe(5);
    expect(bedStatus(s, 0)).toBe('empty');
  });

  it('plant → water → step a stage → stage 1, dry, with a thirsty event', () => {
    const s = newFarm();
    expect(plantCrop(s, 0, 'radish')).toEqual({ ok: true });
    expect(bedStatus(s, 0)).toBe('dry');
    expect(waterBed(s, 0)).toEqual({ ok: true });
    expect(bedStatus(s, 0)).toBe('growing');
    const ev = stepFarm(s, RADISH_STAGE);
    expect(ev).toEqual([
      { kind: 'stage', bed: 0, crop: 'radish', stage: 1 },
      { kind: 'thirsty', bed: 0, crop: 'radish' },
    ]);
    expect(s.beds[0].stage).toBe(1);
    expect(s.beds[0].wet).toBe(false);
    expect(bedStatus(s, 0)).toBe('dry');
    expect(s.stats.planted).toBe(1);
  });

  it('water → step → ripe → harvest gives the yield and empties the bed', () => {
    const s = newFarm();
    plantCrop(s, 2, 'radish');
    waterBed(s, 2);
    stepFarm(s, RADISH_STAGE);
    waterBed(s, 2);
    const ev = stepFarm(s, RADISH_STAGE);
    expect(ev).toEqual([{ kind: 'stage', bed: 2, crop: 'radish', stage: 2 }]);
    expect(bedStatus(s, 2)).toBe('ripe');
    const r = harvest(s, 2);
    expect(r).toEqual({ ok: true, crop: 'radish', n: cropDef('radish').yield });
    expect(s.beds[2]).toEqual({ crop: null, stage: 0, grown: 0, wet: false });
    expect(s.stats.harvested).toBe(cropDef('radish').yield);
  });

  it('dry beds do not grow', () => {
    const s = newFarm();
    plantCrop(s, 1, 'carrot');
    expect(stepFarm(s, 1000)).toEqual([]);
    expect(s.beds[1].grown).toBe(0);
  });

  it('leftover time is not carried across a crop stage', () => {
    const s = newFarm();
    plantCrop(s, 0, 'radish');
    waterBed(s, 0);
    stepFarm(s, RADISH_STAGE + 30);
    expect(s.beds[0].stage).toBe(1);
    expect(s.beds[0].grown).toBe(0);
    waterBed(s, 0);
    stepFarm(s, 1);
    expect(s.beds[0].grown).toBe(1);
  });

  it('bedSecondsLeft counts wet growth to the next stage', () => {
    const s = newFarm();
    expect(bedSecondsLeft(s, 0)).toBe(0);
    plantCrop(s, 0, 'radish');
    expect(bedSecondsLeft(s, 0)).toBe(RADISH_STAGE);
    waterBed(s, 0);
    stepFarm(s, 10);
    expect(bedSecondsLeft(s, 0)).toBe(RADISH_STAGE - 10);
  });

  it('every plantCrop error', () => {
    const s = newFarm();
    expect(plantCrop(s, 8, 'radish')).toEqual({ ok: false, error: 'No such bed.' });
    expect(plantCrop(s, -1, 'radish')).toEqual({ ok: false, error: 'No such bed.' });
    expect(plantCrop(s, 0, 'oak')).toEqual({ ok: false, error: 'The oak goes in its own spot.' });
    plantCrop(s, 0, 'carrot');
    expect(plantCrop(s, 0, 'radish')).toEqual({ ok: false, error: 'Something is growing here.' });
  });

  it('every waterBed error', () => {
    const s = newFarm();
    expect(waterBed(s, 9)).toEqual({ ok: false, error: 'No such bed.' });
    expect(waterBed(s, 0)).toEqual({ ok: false, error: 'Nothing planted.' });
    plantCrop(s, 0, 'radish');
    waterBed(s, 0);
    expect(waterBed(s, 0)).toEqual({ ok: false, error: 'Already watered.' });
    stepFarm(s, RADISH_STAGE);
    stepFarm(s, 0);
    waterBed(s, 0);
    stepFarm(s, RADISH_STAGE);
    expect(waterBed(s, 0)).toEqual({ ok: false, error: 'Ready to harvest.' });
  });

  it('every harvest error', () => {
    const s = newFarm();
    expect(harvest(s, 8)).toEqual({ ok: false, error: 'No such bed.' });
    expect(harvest(s, 0)).toEqual({ ok: false, error: 'Nothing planted.' });
    plantCrop(s, 0, 'radish');
    expect(harvest(s, 0)).toEqual({ ok: false, error: 'Not ripe yet.' });
  });

  it('the oak grows without water through two stages, then shakes', () => {
    const s = newFarm();
    expect(plantOak(s)).toEqual({ ok: true });
    expect(plantOak(s)).toEqual({ ok: false, error: 'The oak is already planted.' });
    const stageS = cropDef('oak').stageS;
    expect(oakSecondsLeft(s)).toBe(stageS);
    const ev = stepFarm(s, 2 * stageS);
    expect(ev).toEqual([
      { kind: 'oak-stage', stage: 1 },
      { kind: 'oak-stage', stage: 2 },
    ]);
    expect(s.oak.stage).toBe(2);
    expect(oakReady(s)).toBe(false);
    expect(oakSecondsLeft(s)).toBe(FARM.oakShakeS);
    expect(stepFarm(s, FARM.oakShakeS)).toEqual([{ kind: 'oak-ready' }]);
    expect(oakReady(s)).toBe(true);
    expect(oakSecondsLeft(s)).toBe(0);
    expect(shakeOak(s)).toBe(FARM.oakShakeAcorns);
    expect(shakeOak(s)).toBe(0);
    expect(s.stats.acornsFromOak).toBe(FARM.oakShakeAcorns);
  });

  it('applyOffline caps at two hours', () => {
    const s = newFarm(0);
    plantOak(s);
    const ev = applyOffline(s, 10 * 60 * 60 * 1000);
    expect(FARM.offlineCapS).toBe(7200);
    // 2 x 1200 s to ripe, the remaining 4800 s go to the first shake: exactly the capped 7200 s.
    expect(s.oak.stage).toBe(2);
    expect(s.oak.sinceShake).toBe(7200 - 2400);
    expect(ev).toEqual([
      { kind: 'oak-stage', stage: 1 },
      { kind: 'oak-stage', stage: 2 },
      { kind: 'oak-ready' },
    ]);
    expect(s.savedAt).toBe(10 * 60 * 60 * 1000);
  });

  it('applyOffline ignores a clock that went backwards', () => {
    const back = newFarm(100_000);
    plantOak(back);
    expect(applyOffline(back, 50_000)).toEqual([]);
    expect(back.oak.grown).toBe(0);
    expect(back.savedAt).toBe(50_000);
  });

  it('serialize → parse round-trips', () => {
    const s = newFarm(0);
    plantCrop(s, 3, 'pumpkin');
    waterBed(s, 3);
    stepFarm(s, 100);
    plantOak(s);
    s.crate.carrot = 3;
    s.seed = 'carrot';
    s.stats.sold = 2;
    const back = parseFarm(serializeFarm(s, 777), 0);
    expect(back).toEqual({ ...s, savedAt: 777 });
  });

  it('parse of junk gives a fresh farm', () => {
    expect(parseFarm(null, 9)).toEqual(newFarm(9));
    expect(parseFarm('{not json', 9)).toEqual(newFarm(9));
    expect(parseFarm('{"v":2}', 9)).toEqual(newFarm(9));
    expect(parseFarm('[1,2]', 9)).toEqual(newFarm(9));
  });

  it('parse keeps good beds and empties bad ones', () => {
    const s = newFarm(0);
    plantCrop(s, 0, 'radish');
    const raw = JSON.parse(serializeFarm(s, 0));
    raw.beds[1] = { crop: 'oak', stage: 0, grown: 0, wet: false };
    raw.beds[2] = { crop: 'carrot', stage: 9, grown: 0, wet: false };
    raw.crate = { radish: 2, carrot: -1, bogus: 4 };
    raw.seed = 'oak';
    raw.stats = { planted: 'x', harvested: 4 };
    const back = parseFarm(JSON.stringify(raw), 0);
    expect(back.beds).toHaveLength(8);
    expect(back.beds[0].crop).toBe('radish');
    expect(back.beds[1].crop).toBeNull();
    expect(back.beds[2].crop).toBeNull();
    expect(back.crate).toEqual({ radish: 2 });
    expect(back.seed).toBe('radish');
    expect(back.stats).toEqual({ planted: 0, harvested: 4, sold: 0, earned: 0, acornsFromOak: 0 });
  });

  it('mergeFarm picks the later savedAt (ties: a)', () => {
    const a = newFarm(100);
    const b = newFarm(200);
    expect(mergeFarm(a, b)).toBe(b);
    expect(mergeFarm(b, a)).toBe(b);
    const c = newFarm(100);
    expect(mergeFarm(a, c)).toBe(a);
  });
});
