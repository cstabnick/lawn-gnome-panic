// The seat cover's sitting surface (GlazeRig.seatCover) and the cushion heights it is built from. Run: npx vitest run packages/glaze/src/seatCover.test.ts
import { describe, expect, it } from 'vitest';
import { attachLoadout, buildGlazeBody } from './attach';
import { SEAT_CUSHION } from './seats';
import { defaultLoadout } from './loadout';
import { SEAT_IDS } from './ids';

const PREFAB = 'ride-on-mower';
const SCALE = 1.5;
const stock = defaultLoadout(0xd8342c);

describe('GlazeRig.seatCover', () => {
  it('is null without a seat cover', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, { ...stock, seat: 'none' });
    expect(rig.seatCover).toBeNull();
  });

  it('sits higher with a hay bale than with a bench', () => {
    const hay = attachLoadout(buildGlazeBody(PREFAB, { scale: SCALE }), PREFAB, { ...stock, seat: 'hay' });
    const bench = attachLoadout(buildGlazeBody(PREFAB, { scale: SCALE }), PREFAB, { ...stock, seat: 'bench' });
    expect(hay.seatCover).not.toBeNull();
    expect(bench.seatCover).not.toBeNull();
    expect(hay.seatCover![1]).toBeGreaterThan(bench.seatCover![1]);
  });

  it('ignores the ride height (the surface is in the stock frame)', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, { ...stock, seat: 'hay' });
    const before = rig.seatCover!;
    rig.set({ ...stock, seat: 'hay', rideHeight: -1 });
    expect(rig.seatCover).toEqual(before);
  });

  it('every seat cover has a cushion height above its origin', () => {
    for (const id of SEAT_IDS) expect(SEAT_CUSHION[id]).toBeGreaterThan(0);
  });
});
