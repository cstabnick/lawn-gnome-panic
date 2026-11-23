// Depth systems: building pieces, spike lines, snares, garden beds and crops, with ledger bookkeeping.
import { describe, expect, it } from 'vitest';
import { checkSnare, defenceOf, depthDaily, placePiece, stepBuild } from './build';
import { harvestBed, plantBed, stepFarms, tendBed, waterBed } from './farming';
import { hatlessInRegion } from './horde';
import type { Rng } from './rng';
import { RESOURCES, type RegionId, type WorldState } from './types';
import { createWorld, hashWorld, hatlessTotal, resourceTotals, runDays, stepWorld } from './world';
import { seasonOf } from './weather';

const tpdOf = (w: WorldState): number => w.tuning.clock.ticksPerDay;
const firstRegion = (w: WorldState): RegionId => w.graph.regions[0].id;

/** Clears herds in region r so a test controls the Hatless count there exactly. */
function clearHerds(w: WorldState, r: RegionId): void { w.horde.herds = w.horde.herds.filter((h) => h.region !== r); }

/** A garden bed on a fresh piece in region r; returns the bed index. */
function bedIn(w: WorldState, r: RegionId): number {
  const p = placePiece(w, { kind: 'garden-bed', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
  return w.beds.findIndex((b) => b.piece === p.id);
}

/** Plants clover on the endOfDay tick of day 1 (autumn at the start); returns that tick. */
function plantClover(w: WorldState, bed: number): number {
  w.tick = tpdOf(w) - 1;
  expect(plantBed(w, bed, 'clover')).toBe(true);
  return w.tick;
}

/** Runs `days` end-of-days after `planted`; each day waters and/or tends the bed if asked. */
function growDays(w: WorldState, rng: Rng, bed: number, planted: number, days: number, opts: { water: boolean; tend: boolean }): void {
  const tpd = tpdOf(w);
  for (let n = 1; n <= days; n++) {
    w.tick = planted + n * tpd;
    if (opts.water) waterBed(w, bed, 1);
    if (opts.tend) tendBed(w, bed);
    stepFarms(w, rng);
  }
}

/** Count of the first item harvested from a clover bed grown 5 days under the given care. */
function cloverYield(seed: number, opts: { water: boolean; tend: boolean }): number {
  const { world: w, streams } = createWorld(seed);
  const bed = bedIn(w, firstRegion(w));
  const planted = plantClover(w, bed);
  growDays(w, streams.farm, bed, planted, 5, opts);
  expect(w.beds[bed].ready).toBe(true);
  w.tick = planted + 5 * tpdOf(w);
  if (opts.tend) tendBed(w, bed);
  return harvestBed(w, bed)[0]?.count ?? 0;
}

describe('depth: beds and crops', () => {
  it('clover is ready after exactly 5 days', () => {
    const { world: w, streams } = createWorld(1);
    const bed = bedIn(w, firstRegion(w));
    const planted = plantClover(w, bed);
    const tpd = tpdOf(w);
    for (let n = 1; n <= 5; n++) {
      w.tick = planted + n * tpd;
      waterBed(w, bed, 1);
      stepFarms(w, streams.farm);
      expect(w.beds[bed].ready).toBe(n === 5);
    }
  });

  it('clover yields 8 seed cakes, booked in the ledger', () => {
    const { world: w, streams } = createWorld(1);
    const bed = bedIn(w, firstRegion(w));
    const planted = plantClover(w, bed);
    growDays(w, streams.farm, bed, planted, 5, { water: true, tend: true });
    const farmed = w.ledger.farmed.food;
    const removed = w.ledger.removedByPlayer.food;
    expect(harvestBed(w, bed)).toEqual([{ def: 'seed-cake', count: 8, condition: 1 }]);
    expect(w.ledger.farmed.food).toBe(farmed + 8);
    expect(w.ledger.removedByPlayer.food).toBe(removed + 8);
    expect(w.beds[bed].crop).toBeNull();
  });

  it('unwatered halves the yield', () => {
    expect(cloverYield(1, { water: false, tend: true })).toBe(4);
  });

  it('untended for weedsDays halves the yield', () => {
    expect(cloverYield(1, { water: true, tend: false })).toBe(4);
  });

  it('unwatered and weedy multiply', () => {
    expect(cloverYield(1, { water: false, tend: false })).toBe(2);
  });

  it('a crop cannot be planted out of season', () => {
    const { world: w } = createWorld(1);
    const bed = bedIn(w, firstRegion(w));
    expect(seasonOf(1, w.tuningBase)).toBe('autumn');
    expect(seasonOf(8, w.tuningBase)).toBe('winter');
    w.tick = 7 * tpdOf(w);   // day 8: winter
    expect(plantBed(w, bed, 'clover')).toBe(false);
    expect(plantBed(w, bed, 'toadstool')).toBe(true);
  });

  it('a repeating crop regrows after repeatDays', () => {
    const { world: w, streams } = createWorld(1);
    const bed = bedIn(w, firstRegion(w));
    w.tick = tpdOf(w) - 1;
    expect(plantBed(w, bed, 'berries')).toBe(true);
    const planted = w.tick;
    growDays(w, streams.farm, bed, planted, 14, { water: true, tend: true });
    expect(w.beds[bed].ready).toBe(true);
    w.tick = planted + 14 * tpdOf(w);
    expect(harvestBed(w, bed)).toEqual([{ def: 'blackberry', count: 12, condition: 1 }]);
    expect(w.beds[bed].crop).toBe('berries');
    expect(w.beds[bed].ready).toBe(false);
  });
});

describe('depth: pieces and Hatless', () => {
  it('a barricade under density 40 breaks in two ticks', () => {
    const { world: w, streams } = createWorld(1);
    const r = firstRegion(w);
    clearHerds(w, r);
    const p = placePiece(w, { kind: 'barricade', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
    w.horde.density[r] = 40;
    stepBuild(w, streams.farm);
    expect(w.pieces[p.id].hp).toBe(40);
    stepBuild(w, streams.farm);
    expect(w.pieces[p.id].hp).toBe(0);
    expect(w.events.some((e) => e.kind === 'piece-broken' && e.piece === p.id)).toBe(true);
    expect(defenceOf(w, r)).toBe(0);
  });

  it('spike-line kills keep hatlessTotal plus destroyed constant', () => {
    const { world: w, streams } = createWorld(1);
    const r = firstRegion(w);
    clearHerds(w, r);
    placePiece(w, { kind: 'spike-line', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
    w.horde.density[r] = 10;
    const before = hatlessTotal(w) + w.ledger.hatlessDestroyed;
    for (let t = 0; t < 2 * tpdOf(w); t++) stepBuild(w, streams.farm);
    expect(w.ledger.hatlessDestroyed).toBeGreaterThan(0);
    expect(hatlessTotal(w) + w.ledger.hatlessDestroyed).toBe(before);
    expect(hatlessInRegion(w, r)).toBe(10 - w.ledger.hatlessDestroyed);
  });

  it('a set snare catches one pickled slug, once', () => {
    const { world: w } = createWorld(1);
    const p = placePiece(w, { kind: 'snare', region: firstRegion(w), x: 0, y: 0, z: 0, rotY: 0 }, 'local');
    w.flags[`snare:${p.id}`] = true;
    const farmed = w.ledger.farmed.food;
    const removed = w.ledger.removedByPlayer.food;
    expect(checkSnare(w, p.id)).toEqual([{ def: 'pickled-slug', count: 1, condition: 1 }]);
    expect(w.ledger.farmed.food).toBe(farmed + 1);
    expect(w.ledger.removedByPlayer.food).toBe(removed + 1);
    expect(checkSnare(w, p.id)).toEqual([]);
  });

  it('depthDaily reports standing pieces, growing beds and no mowing', () => {
    const { world: w } = createWorld(1);
    const bed = bedIn(w, firstRegion(w));
    plantClover(w, bed);
    const row = depthDaily(w);
    expect(row.piecesUp).toBe(1);
    expect(row.bedsGrowing).toBe(1);
    expect(row.farmedFood).toBe(0);
    expect(row.mown).toBeNull();
  });
});

describe('depth: conservation and determinism', () => {
  function conservationErrors(w: WorldState): string[] {
    const errs: string[] = [];
    const tot = resourceTotals(w);
    const L = w.ledger;
    for (const k of RESOURCES) {
      const want = L.lootStart[k] + L.foraged[k] + L.farmed[k] + L.givenByPlayer[k] - L.consumed[k] - L.removedByPlayer[k];
      if (tot[k] !== want) errs.push(`${k}: ${tot[k]} != ${want}`);
    }
    const hWant = L.hatlessStart + L.hatlessRisen - L.hatlessCrumbled - L.hatlessDestroyed;
    if (hatlessTotal(w) !== hWant) errs.push(`hatless: ${hatlessTotal(w)} != ${hWant}`);
    return errs;
  }

  it('conserves resources and Hatless over 10 days with pieces and beds', () => {
    const { world: w, streams } = createWorld(7);
    const r = firstRegion(w);
    const bed = bedIn(w, r);
    placePiece(w, { kind: 'spike-line', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
    placePiece(w, { kind: 'barricade', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
    const snare = placePiece(w, { kind: 'snare', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
    w.tick = 0;
    expect(plantBed(w, bed, 'clover')).toBe(true);
    const tpd = tpdOf(w);
    for (let day = 0; day < 10; day++) {
      for (let t = 0; t < tpd; t++) {
        stepWorld(w, streams);
        if (t === 0) waterBed(w, bed, 1);
      }
      tendBed(w, bed);
      if (w.beds[bed].ready) harvestBed(w, bed);
      if (w.beds[bed].crop === null) plantBed(w, bed, 'grain');
      checkSnare(w, snare.id);
      expect(conservationErrors(w)).toEqual([]);
    }
  });

  it('is deterministic with pieces and beds placed', () => {
    const run = (): string => {
      const { world: w, streams } = createWorld(3);
      const r = firstRegion(w);
      placePiece(w, { kind: 'spike-line', region: r, x: 0, y: 0, z: 0, rotY: 0 }, 'local');
      const bed = bedIn(w, r);
      plantBed(w, bed, 'clover');
      runDays(w, streams, 6);
      return hashWorld(w);
    };
    expect(run()).toBe(run());
  });
});
