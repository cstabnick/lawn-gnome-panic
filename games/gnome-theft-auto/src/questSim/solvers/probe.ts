// Quest sim solvers. Activity probes (the Newcomers' Card tutorials): each probe id done through its activity's own API.
// Every probe id has one entry in PROBE_ACTIONS, with a fidelity saying how real the run was:
//   - 'action':  the game's own UI call (ctx.actions: wheel, kit, emote, street event, banner, party);
//   - 'api':     the activity's own store (buy, catch, comb, mark, sell, mow), the same calls its UI makes;
//   - 'economy': the activity's own price spent with its exact reason string (the full game path is not in the sim);
//   - 'vehicle': the player gets into (or stores) the vehicle the probe is about.
import type { Solver, SimCtx } from '../types';
import { SimFail } from '../types';
import { getInto, nearestVehicle, runUntil, travelTo } from '../util';
import { readProbe } from '../../city/probes';
import { createFishStore } from '../../fishing/fishSave';
import { FISH_SPECIES } from '../../fishing/species';
import { RODS } from '../../fishing/tackle';
import { SHOP } from '../../fishing/types';
import { createHuntStore } from '../../hunting/huntSave';
import { SPECIES } from '../../hunting/species';
import { createBirdStore } from '../../birding/birdSave';
import { BIRDS } from '../../birding/species';
import { sharedJobsStore, recordGig } from '../../jobs/career';
import type { PayResult } from '../../jobs/types';
import { createMowRewards } from '../../flora/rewards';
import { HOPPER_FARE } from '../../outskirts/bus';
import { CRAFT_PAINT_PRICE } from '../../craft/craftPanels';
import { LOCKUP } from '../../lockup/config';
import { SIDE_VALVE } from '../../config';

export type ProbeFidelity = 'api' | 'action' | 'economy' | 'vehicle';

export interface ProbeAction {
  fidelity: ProbeFidelity;
  run(ctx: SimCtx): Promise<void>;
}

/** Where the headless and browser layers both get their Storage (the sim installs localStorage; so does the game). */
const store = (): Storage => globalThis.localStorage;

/**
 * A buy from the economy. The sim purse pays (freeAcorns), recorded so the report shows it. False when the economy
 * refuses the spend.
 */
function pay(ctx: SimCtx, probe: string, amount: number, reason: string): boolean {
  ctx.useCheat('freeAcorns', `probe ${probe}: paid from the sim purse`);
  return ctx.economy.spend(amount, reason);
}

/**
 * A price spent for a `spend:<reason>` probe. The probe must move: if it does not, the session's economy is not the
 * one the probes count (a wiring gap, not a bot failure), so say so instead of waiting out the budget.
 */
function spendProbe(ctx: SimCtx, reason: string, amount: number): void {
  const key = `spend:${reason}`;
  const before = readProbe(key);
  if (!pay(ctx, key, amount, reason)) throw new SimFail('bot', `${key}: cannot afford ${amount} Acorns`);
  if (readProbe(key) === before) {
    throw new SimFail('blocked', `${key}: the spend did not reach the probe (session economy is not probe-wrapped)`);
  }
}

/** A buy through an activity's store: `spend` pays through pay(), and the store decides what it gives. */
function payFor(ctx: SimCtx, probe: string, reason: string): (n: number) => boolean {
  return (n) => pay(ctx, probe, n, reason);
}

/** Spawn a vehicle for a probe (the sim has no garage) and record the cheat that allows it. */
function spawnFor(ctx: SimCtx, probe: string, kind: Parameters<SimCtx['spawnVehicle']>[0], x: number, z: number) {
  ctx.useCheat('unlockAllItems', `probe ${probe}: spawned a ${kind} (no garage in the sim)`);
  return ctx.spawnVehicle(kind, x, z, 0);
}

/** One mow of a plant, through the game's own mowing rewards (it writes the mowing save). */
async function mowOne(ctx: SimCtx, kindId: string, longGrass: boolean): Promise<void> {
  const rewards = createMowRewards({
    increment: () => {},
    earn: (n, reason) => ctx.economy.earn(n, reason),
    toast: () => {},
    storage: store(),
  });
  rewards.record(kindId, longGrass, false);
  // Flush the save now (the rewards write it every few seconds).
  rewards.update(5);
  await ctx.step();
}

/** Loch Moss deep water, for the boat probe (the Loch Deeps fishing spot). */
const LOCH_DEEPS: [number, number] = [-700, -690];
/** The Golf-cart at the Patio Heights Country Club (the objective's spot). */
const GOLF_CART_SPOT: [number, number] = [185, -185];

export const PROBE_ACTIONS: Record<string, ProbeAction> = {
  'street-event': {
    fidelity: 'action',
    run: (ctx) => ctx.actions.streetEventDone(),
  },
  emote: {
    fidelity: 'action',
    run: (ctx) => ctx.actions.emote(false),
  },
  'pair-emote': {
    fidelity: 'action',
    run: (ctx) => ctx.actions.emote(true),
  },
  'wheel-open': {
    fidelity: 'action',
    async run(ctx) {
      await ctx.actions.setWheelOpen(true);
      await ctx.step(1);
      await ctx.actions.setWheelOpen(false);
    },
  },
  'kit-open': {
    fidelity: 'action',
    async run(ctx) {
      await ctx.actions.setKitOpen(true);
      await ctx.step(1);
      await ctx.actions.setKitOpen(false);
    },
  },
  'lockup-stored': {
    fidelity: 'vehicle',
    async run(ctx) {
      // A Lock-Up ride-on in its bay, driven in and stored.
      const v = spawnFor(ctx, 'lockup-stored', 'ride-on', SIDE_VALVE.bay.x, SIDE_VALVE.bay.z);
      await getInto(ctx, v, 'probe lockup-stored');
      await ctx.actions.storeInLockup();
    },
  },
  'spend:Sling-Lift': {
    fidelity: 'economy',
    async run(ctx) {
      spendProbe(ctx, 'Sling-Lift', LOCKUP.delivery.fee);
    },
  },
  mowed: {
    fidelity: 'api',
    run: (ctx) => mowOne(ctx, 'flower-bed', false),
  },
  'golf-cart': {
    fidelity: 'vehicle',
    async run(ctx) {
      const [x, z] = GOLF_CART_SPOT;
      const v = nearestVehicle(ctx, x, z, 'golf-cart', 30) ?? spawnFor(ctx, 'golf-cart', 'golf-cart', x, z);
      await getInto(ctx, v, 'probe golf-cart');
    },
  },
  'fish-rod': {
    fidelity: 'api',
    async run(ctx) {
      // A rod from the Bent Pin counter; the store refuses when one is already owned.
      const rod = RODS[0];
      createFishStore(store()).buyRod(rod.id, (n) => pay(ctx, 'fish-rod', n, rod.name));
      await ctx.step();
    },
  },
  'fish-caught': {
    fidelity: 'api',
    async run(ctx) {
      // One landed fish of the first species, at its smallest size; the store makes a catch card when it has room.
      const sp = FISH_SPECIES[0];
      createFishStore(store()).recordCatch(sp, sp.size[0]);
      await ctx.step();
    },
  },
  'fish-sold': {
    fidelity: 'api',
    async run(ctx) {
      const fish = createFishStore(store());
      if (fish.data().cards.length === 0) fish.recordCatch(FISH_SPECIES[0], FISH_SPECIES[0].size[0]);
      const { acorns } = fish.sellCards();
      if (acorns > 0) ctx.economy.earn(acorns, SHOP.name);
      await ctx.step();
    },
  },
  'job-gigs': {
    fidelity: 'api',
    async run(ctx) {
      // One taxi fare booked through the jobs career store (the runtime's own bookkeeping).
      const jobs = sharedJobsStore();
      const fare: PayResult = { base: 10, time: 0, tip: 0, bonus: 0, total: 10, xp: 10, stars: 5, notes: [] };
      recordGig(jobs.get(), 'taxi', 'fare', fare);
      jobs.commit();
      await ctx.step();
    },
  },
  [`spend:Wingwright's Slipway`]: {
    fidelity: 'economy',
    async run(ctx) {
      spendProbe(ctx, "Wingwright's Slipway", CRAFT_PAINT_PRICE);
    },
  },
  'banner-near': {
    fidelity: 'action',
    run: (ctx) => ctx.actions.nearBanner(),
  },
  'hunt-licensed': {
    fidelity: 'api',
    async run(ctx) {
      createHuntStore(store()).buyLicense(payFor(ctx, 'hunt-licensed', 'Tuft License'));
      await ctx.step();
    },
  },
  'hunt-combed': {
    fidelity: 'api',
    async run(ctx) {
      // One quarry knocked over and combed (a shot at 10 m).
      createHuntStore(store()).recordComb(SPECIES[0], false, 10);
      await ctx.step();
    },
  },
  'hunt-sold': {
    fidelity: 'api',
    async run(ctx) {
      const hunt = createHuntStore(store());
      if (hunt.bagCount() === 0) hunt.recordComb(SPECIES[0], false, 10);
      const { acorns } = hunt.sellAll();
      if (acorns > 0) ctx.economy.earn(acorns, 'Tuft & Tally Lodge');
      await ctx.step();
    },
  },
  [`spend:Pebblewick Hopper`]: {
    fidelity: 'economy',
    async run(ctx) {
      spendProbe(ctx, 'Pebblewick Hopper', HOPPER_FARE);
    },
  },
  'bird-seen': {
    fidelity: 'api',
    async run(ctx) {
      const birds = createBirdStore(store());
      const sp = BIRDS.find((b) => !birds.hasSeen(b.id));
      if (!sp) throw new SimFail('bot', 'bird-seen: every species is already seen');
      birds.markSeen(sp.id);
      await ctx.step();
    },
  },
  'bird-heard': {
    fidelity: 'api',
    async run(ctx) {
      const birds = createBirdStore(store());
      const sp = BIRDS.find((b) => !birds.hasHeard(b.id));
      if (!sp) throw new SimFail('bot', 'bird-heard: every call is already heard');
      birds.markHeard(sp.id);
      await ctx.step();
    },
  },
  'bird-photos': {
    fidelity: 'api',
    async run(ctx) {
      const birds = createBirdStore(store());
      const sp = BIRDS.find((b) => !birds.hasPhoto(b.id));
      if (!sp) throw new SimFail('bot', 'bird-photos: every species is already photographed');
      birds.markPhoto(sp.id);
      await ctx.step();
    },
  },
  boat: {
    fidelity: 'vehicle',
    async run(ctx) {
      const [x, z] = LOCH_DEEPS;
      const v = nearestVehicle(ctx, x, z, 'gravy-boat', 30) ?? spawnFor(ctx, 'boat', 'gravy-boat', x, z);
      await getInto(ctx, v, 'probe boat');
    },
  },
  'party-on': {
    fidelity: 'action',
    // Headless: throws SimFail 'blocked' (no relay server); let it through.
    run: (ctx) => ctx.actions.joinParty(),
  },
};

export const probeSolver: Solver<'probe'> = {
  kind: 'probe',
  async solve(obj, ctx, opts) {
    if (obj.at) await travelTo(ctx, obj.at[0], obj.at[1], `probe ${obj.probe}`);
    const entry = PROBE_ACTIONS[obj.probe];
    if (!entry) throw new SimFail('bot', `probe ${obj.probe}: no action`);
    ctx.log(`probe ${obj.probe} via ${entry.fidelity}`);
    // The action runs once a second, at most count + 3 times; after that the probe just has to rise on its own.
    const max = (obj.count ?? 1) + 3;
    let runs = 0;
    let last = -Infinity;
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: `probe ${obj.probe}` }, async () => {
      if (runs >= max || ctx.now() - last < 1) return;
      last = ctx.now();
      runs++;
      await entry.run(ctx);
    });
  },
};
