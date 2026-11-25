import { GNOMA_TRUCK } from './config';
import type { Economy } from './economy';
import type { Fx, Hud, Player, Sfx } from './types';

export type InteractableKind = 'cola' | 'fizz' | 'cake';

export interface InteractableBuff {
  speedMult: number;
  jumpMult: number;
  buffLabel: string | null;
}

export interface Interactables {
  prompt(player: Player): string | null;
  interact(player: Player): boolean;
  update(dt: number, player: Player): InteractableBuff;
}

interface Spot {
  kind: InteractableKind;
  x: number;
  z: number;
  cost: number;
  prompt: string;
}

const INTERACT_RANGE = 3.6;
const COLA_COST = 15;
const COLA_HEAL = 0.35;
const FIZZ_COST = 25;
const FIZZ_DURATION_S = 15.0;
const FIZZ_SPEED_MULT = 1.35;
const FIZZ_JUMP_MULT = 1.28;
const CAKE_COST = 40;

const GNOMA_QUIPS: readonly string[] = [
  "Cooking Gnoma: 'Fresh out of the kiln-oven! Mind the glaze.'",
  "Cooking Gnoma: 'Two scoops of acorn flour, zero regrets.'",
  "Cooking Gnoma: 'Eat up, dearie — you look like you've been mowed over.'",
  "Cooking Gnoma: 'Secret ingredient? Finely ground lawn clippings.'",
];

const SPOTS: readonly Spot[] = [
  // Acorn-Cola vending machines (matches scatterVendingMachines in world.ts)
  { kind: 'cola', x: -7, z: -22, cost: COLA_COST, prompt: 'Buy Acorn-Cola (15 Acorns — Heal)' },
  { kind: 'cola', x: 7, z: -46, cost: COLA_COST, prompt: 'Buy Acorn-Cola (15 Acorns — Heal)' },
  { kind: 'cola', x: -24, z: 7, cost: COLA_COST, prompt: 'Buy Acorn-Cola (15 Acorns — Heal)' },
  { kind: 'cola', x: 46, z: 7, cost: COLA_COST, prompt: 'Buy Acorn-Cola (15 Acorns — Heal)' },
  { kind: 'cola', x: -53, z: 24, cost: COLA_COST, prompt: 'Buy Acorn-Cola (15 Acorns — Heal)' },
  { kind: 'cola', x: 67, z: 18, cost: COLA_COST, prompt: 'Buy Acorn-Cola (15 Acorns — Heal)' },

  // Dandelion Fizz vending machines (matches scatterVendingMachines in world.ts)
  { kind: 'fizz', x: 7, z: -20, cost: FIZZ_COST, prompt: 'Buy Dandelion Fizz (25 Acorns — Pollen Rush)' },
  { kind: 'fizz', x: -7, z: 32, cost: FIZZ_COST, prompt: 'Buy Dandelion Fizz (25 Acorns — Pollen Rush)' },
  { kind: 'fizz', x: 24, z: -7, cost: FIZZ_COST, prompt: 'Buy Dandelion Fizz (25 Acorns — Pollen Rush)' },
  { kind: 'fizz', x: -46, z: -7, cost: FIZZ_COST, prompt: 'Buy Dandelion Fizz (25 Acorns — Pollen Rush)' },
  { kind: 'fizz', x: 53, z: -18, cost: FIZZ_COST, prompt: 'Buy Dandelion Fizz (25 Acorns — Pollen Rush)' },
  { kind: 'fizz', x: -67, z: 32, cost: FIZZ_COST, prompt: 'Buy Dandelion Fizz (25 Acorns — Pollen Rush)' },

  // Cooking Gnoma's Food Truck
  { kind: 'cake', x: GNOMA_TRUCK.x, z: GNOMA_TRUCK.z, cost: CAKE_COST, prompt: 'Buy Acorn-Flour Cake (40 Acorns — Full Glaze)' },
];

/**
 * Spots added by other modules (parks/life.ts: benches, wishing fountains). `prompt` is shown within INTERACT_RANGE;
 * `run` does the thing (it gets the interactables' own deps). Checked after the built-in spots.
 */
export interface ExtraSpot {
  x: number;
  z: number;
  prompt: string;
  run(player: Player, deps: { hud: Hud; economy: Economy; fx: Fx; play: (sfx: Sfx) => void }): boolean;
}
const EXTRA: ExtraSpot[] = [];
export function addInteractSpot(s: ExtraSpot): void {
  EXTRA.push(s);
}
function nearestExtra(player: Player): ExtraSpot | null {
  if (player.vehicle || player.airborne) return null;
  let best: ExtraSpot | null = null;
  let bestD2 = INTERACT_RANGE * INTERACT_RANGE;
  for (const s of EXTRA) {
    const dx = player.x - s.x;
    const dz = player.z - s.z;
    const d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = s;
    }
  }
  return best;
}

function nearestSpot(player: Player): Spot | null {
  if (player.vehicle || player.airborne) return null;
  let best: Spot | null = null;
  let bestD2 = INTERACT_RANGE * INTERACT_RANGE;
  for (const s of SPOTS) {
    const dx = player.x - s.x;
    const dz = player.z - s.z;
    const d2 = dx * dx + dz * dz;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = s;
    }
  }
  return best;
}

export function createInteractables(
  hud: Hud,
  economy: Economy,
  fx: Fx,
  play: (sfx: Sfx) => void,
): Interactables {
  let fizzTimer = 0;
  let trailTimer = 0;
  let quipIndex = 0;

  function prompt(player: Player): string | null {
    return nearestSpot(player)?.prompt ?? nearestExtra(player)?.prompt ?? null;
  }

  function interact(player: Player): boolean {
    const spot = nearestSpot(player);
    if (!spot) {
      const extra = nearestExtra(player);
      return extra ? extra.run(player, { hud, economy, fx, play }) : false;
    }

    if (spot.kind === 'cola') {
      if (!economy.spend(COLA_COST, 'Acorn-Cola')) {
        hud.toast(`Need ${COLA_COST} Acorns for Acorn-Cola.`);
        return false;
      }
      player.health = Math.min(1.0, player.health + COLA_HEAL);
      play('door');
      fx.spark(player.x, player.y + 0.8, player.z);
      hud.toast('Acorn-Cola! +35% Glaze.');
      return true;
    }

    if (spot.kind === 'fizz') {
      if (!economy.spend(FIZZ_COST, 'Dandelion Fizz')) {
        hud.toast(`Need ${FIZZ_COST} Acorns for Dandelion Fizz.`);
        return false;
      }
      fizzTimer = FIZZ_DURATION_S;
      trailTimer = 0;
      play('steal');
      fx.spark(player.x, player.y + 0.8, player.z);
      hud.toast('Pollen Rush! Speed & jump boosted for 15s.');
      return true;
    }

    // Cooking Gnoma's Food Truck
    if (!economy.spend(CAKE_COST, 'Acorn-Flour Cake')) {
      hud.toast(`Need ${CAKE_COST} Acorns for Acorn-Flour Cake.`);
      return false;
    }
    player.health = 1.0;
    play('door');
    fx.spark(player.x, player.y + 1.0, player.z);
    const quip = GNOMA_QUIPS[quipIndex % GNOMA_QUIPS.length];
    quipIndex += 1;
    hud.toast(quip);
    return true;
  }

  function update(dt: number, player: Player): InteractableBuff {
    if (fizzTimer > 0) {
      fizzTimer = Math.max(0, fizzTimer - dt);
      trailTimer += dt;
      if (trailTimer >= 0.14) {
        trailTimer = 0;
        fx.spark(player.x, player.y + 0.35, player.z);
      }
      if (fizzTimer > 0) {
        return {
          speedMult: FIZZ_SPEED_MULT,
          jumpMult: FIZZ_JUMP_MULT,
          buffLabel: 'Pollen Rush',
        };
      }
    }
    return {
      speedMult: 1,
      jumpMult: 1,
      buffLabel: null,
    };
  }

  return { prompt, interact, update };
}
